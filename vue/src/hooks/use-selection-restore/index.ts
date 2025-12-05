import { ref, reactive, computed, onMounted, onUnmounted, type Ref } from 'vue'
import {
  SelectionRestore,
  SelectionBehaviorType,
  type SerializedSelection,
  type SerializedSelectionSimple,
  type SelectionTypeConfig,
  type SelectionRestoreOptions,
  type SelectionBehaviorEvent,
  type SelectionInteractionEvent,
  type SelectionInstance
} from '@life2code/range-kit-core'

import type {
  UseSelectionRestoreOptions,
  UseSelectionRestoreReturn,
  SelectionActionEvent,
  SelectionActionType
} from './types'
import { DEFAULT_SELECTION_STYLE, DEFAULT_SELECTION_TYPES } from './constants'
import { convertToSimple } from './utils/convert'
import { scrollToRange, sortHighlightIdsByDOMOrder } from './utils/scroll'
import {
  DEFAULT_CURRENT_HIGHLIGHT_STYLE,
  CURRENT_HIGHLIGHT_NAME
} from '../use-highlight-navigation/constants'

// 导出类型供外部使用
export * from './types'
export { convertToSimple, convertToSimple as convertSelectionsToSimple } from './utils/convert'

/**
 * Range SDK 选区恢复功能 Hook
 * SOTA 实现 - 简洁、职责清晰
 * 注意：搜索高亮功能已独立到 useSearchHighlight hook
 */
export function useSelectionRestore(options: UseSelectionRestoreOptions): UseSelectionRestoreReturn {
  // ========== 响应式状态 ==========
  const isInitialized = ref(false)
  const currentSelections = ref<SerializedSelection[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // SDK 实例
  let sdkInstance: SelectionRestore | null = null

  // 配置
  const config = reactive({
    appId: options.appId,
    containers: options.containers || [],
    selectionStyles: [...DEFAULT_SELECTION_TYPES, ...(options.selectionStyles || [])]
  })

  // ========== 导航状态 ==========
  const navigationIndex = ref<number>(-1)
  /** 当前导航的高亮 ID - 用于在高亮变化后恢复位置 */
  let currentNavigationId: string | null = null
  /** 响应式的活跃高亮数量 - 由 SDK 回调自动更新 */
  const activeHighlightCount = ref<number>(0)
  let navigationHighlightInstance: Highlight | null = null
  let navigationStyleElement: HTMLStyleElement | null = null
  /** 防抖定时器 - 用于等待批量高亮操作完成 */
  let navigationRestoreTimer: ReturnType<typeof setTimeout> | null = null

  // ========== SDK 初始化 ==========

  /**
   * 将 SDK 的 SelectionBehaviorEvent 转换为统一的 SelectionActionEvent
   */
  const convertBehaviorToAction = (event: SelectionBehaviorEvent): SelectionActionEvent => {
    // 映射行为类型到动作类型
    let actionType: SelectionActionType
    switch (event.type) {
      case SelectionBehaviorType.CREATED:
        actionType = 'created'
        break
      case SelectionBehaviorType.CLEARED:
        actionType = 'cleared'
        break
      default:
        actionType = 'created'
    }

    return {
      type: actionType,
      text: event.text,
      position: event.position,
      originalEvent: undefined,
      range: event.range,
      savedSelection: undefined,
      savedSelectionId: undefined,
      overlappedSelections: event.overlappedRanges,
      timestamp: event.timestamp ?? Date.now()
    }
  }

  /**
   * 将 SDK 的 SelectionInteractionEvent 转换为统一的 SelectionActionEvent
   */
  const convertInteractionToAction = (
    event: SelectionInteractionEvent,
    instance: SelectionInstance
  ): SelectionActionEvent => {
    return {
      type: event.type as SelectionActionType,
      text: event.selection.text,
      position: undefined,
      originalEvent: event.originalEvent,
      range: undefined,
      savedSelection: event.selection,
      savedSelectionId: instance.id,
      overlappedSelections: undefined,
      timestamp: Date.now()
    }
  }

  /**
   * 初始化 SDK 实例
   */
  const initializeSDK = async () => {
    try {
      isLoading.value = true
      error.value = null

      const sdkOptions: SelectionRestoreOptions = {
        enabledContainers: config.containers,
        registeredTypes: config.selectionStyles,
        highlightStyle: DEFAULT_SELECTION_STYLE,
        enableLogging: false,
        storage: { type: 'memory' as const },
        // 选区行为回调 - 转换为统一的 onSelectionAction
        onSelectionBehavior: (event: SelectionBehaviorEvent) => {
          if (options.onSelectionAction) {
            options.onSelectionAction(convertBehaviorToAction(event))
          }
        },
        // 选区交互回调 - 转换为统一的 onSelectionAction
        onSelectionInteraction: (event: SelectionInteractionEvent, instance: SelectionInstance) => {
          if (options.onSelectionAction) {
            options.onSelectionAction(convertInteractionToAction(event, instance))
          }
        },
        // 监听活跃高亮数量变化 - 自动更新导航计数并重建导航高亮
        onActiveRangesChange: (event) => {
          activeHighlightCount.value = event.count

          // 使用防抖等待批量操作完成后重建导航高亮
          if (navigationRestoreTimer) {
            clearTimeout(navigationRestoreTimer)
          }

          navigationRestoreTimer = setTimeout(() => {
            navigationRestoreTimer = null
            rebuildNavigationHighlight()
          }, 50)
        }
      }

      sdkInstance = new SelectionRestore(sdkOptions)

      // 注册选区类型
      config.selectionStyles.forEach((typeConfig: SelectionTypeConfig) => {
        sdkInstance!.registerSelectionType(typeConfig)
      })

      // 恢复初始选区
      if (options.initialSelections?.length) {
        await restoreSelections(options.initialSelections)
      }

      await loadCurrentSelections()
      isInitialized.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
    } finally {
      isLoading.value = false
    }
  }

  // ========== 核心方法 ==========

  /**
   * 加载当前所有选区
   */
  const loadCurrentSelections = async () => {
    if (!sdkInstance) return
    try {
      currentSelections.value = await sdkInstance.getAllSelections()
    } catch (err) {
      // 静默处理
    }
  }

  /**
   * 保存当前选区
   * @param id - 选区ID（可选）
   * @param type - 选区类型，默认 'default'
   * @param autoHighlight - 保存后是否自动高亮（不清除其他高亮），默认 true
   * @param fromRange - 从指定 Range 保存选区（可选），如不传则使用当前浏览器选区
   */
  const saveCurrentSelection = async (
    id?: string,
    type: string = 'default',
    autoHighlight: boolean = true,
    fromRange?: Range
  ): Promise<SerializedSelection | null> => {
    if (!sdkInstance) throw new Error('SDK未初始化')

    try {
      // 如果传入了 fromRange，先恢复到浏览器选区
      if (fromRange) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(fromRange)
        }
      }

      const serializedSelection = await sdkInstance.serialize(id)
      if (!serializedSelection) return null

      serializedSelection.type = type
      serializedSelection.appName = config.appId

      await sdkInstance.updateSelection(serializedSelection.id, { type, appName: config.appId })
      await loadCurrentSelections()

      // 自动高亮新保存的选区（不清除其他高亮）
      if (autoHighlight) {
        await sdkInstance.restoreWithoutClear(serializedSelection, false)
      }

      options.onSelectionSaved?.(convertToSimple(serializedSelection))
      return serializedSelection
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存选区失败'
      throw err
    }
  }

  /**
   * 恢复选区
   * 会同时高亮选区并将数据保存到 storage
   */
  const restoreSelections = async (
    selections: SerializedSelection[],
    enableAutoScroll: boolean = false
  ) => {
    if (!sdkInstance) throw new Error('SDK未初始化')

    try {
      isLoading.value = true

      // 先导入选区数据到 storage
      await sdkInstance.importSelections(selections)

      // 再高亮显示
      const scrollIndex = enableAutoScroll ? 0 : -1
      await sdkInstance.highlightSelections(selections, scrollIndex)

      // 刷新当前选区列表
      await loadCurrentSelections()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '恢复选区失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除所有高亮
   */
  const clearAllSelections = () => {
    sdkInstance?.clearHighlight()
    // 重置导航索引
    navigationIndex.value = -1
  }

  /**
   * 删除选区
   */
  const deleteSelection = async (selectionId: string) => {
    if (!sdkInstance) throw new Error('SDK未初始化')

    try {
      await sdkInstance.deleteSelection(selectionId)
      await loadCurrentSelections()
      options.onSelectionDeleted?.(selectionId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除选区失败'
      throw err
    }
  }

  /**
   * 清空所有选区数据
   */
  const clearAllSelectionsData = async () => {
    if (!sdkInstance) throw new Error('SDK未初始化')

    try {
      await sdkInstance.clearAllSelections()
      currentSelections.value = []
      // 重置导航索引
      navigationIndex.value = -1
    } catch (err) {
      error.value = err instanceof Error ? err.message : '清空选区失败'
      throw err
    }
  }

  /**
   * 获取当前选区数组
   */
  const getCurrentSelectionsForSubmit = (): SerializedSelection[] => {
    return [...currentSelections.value]
  }

  /**
   * 获取精简选区数据
   */
  const getCurrentSelectionsSimple = (
    selections?: SerializedSelection[]
  ): SerializedSelectionSimple[] => {
    return (selections || currentSelections.value).map(convertToSimple)
  }

  /**
   * 高亮当前选中文本
   */
  const highlightCurrentSelection = (duration: number = 0) => {
    sdkInstance?.highlightSelection(duration)
  }

  /**
   * 更新容器配置
   */
  const updateContainers = (newContainers: string[]) => {
    config.containers = newContainers
    sdkInstance?.setEnabledContainers(newContainers)
  }

  /**
   * 获取 SDK 实例
   */
  const getSDKInstance = () => sdkInstance

  // ========== 导航功能 ==========

  /** 导航总数 - 使用响应式计数 */
  const navigationTotal = computed(() => activeHighlightCount.value)

  /** 当前导航高亮项 */
  const navigationCurrentHighlight = computed(() => {
    if (navigationIndex.value < 0 || !sdkInstance) return null
    const ids = sdkInstance.getAllActiveSelectionIds()
    if (navigationIndex.value >= ids.length) return null
    const id = ids[navigationIndex.value]
    const range = sdkInstance.getActiveRange(id)
    return range ? { id, text: range.toString(), range } : null
  })

  /**
   * 初始化导航高亮样式
   */
  const initNavigationStyle = (): void => {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return

    if (!navigationStyleElement) {
      navigationStyleElement = document.createElement('style')
      navigationStyleElement.id = 'selection-navigation-style'
      document.head.appendChild(navigationStyleElement)
    }

    const style = DEFAULT_CURRENT_HIGHLIGHT_STYLE
    navigationStyleElement.textContent = `
      ::highlight(${CURRENT_HIGHLIGHT_NAME}) {
        background-color: ${style.backgroundColor} !important;
        color: ${style.color || 'inherit'};
        transition: ${style.transition || 'background-color 0.15s ease'};
      }
    `

    if (!navigationHighlightInstance) {
      navigationHighlightInstance = new Highlight()
      ;(CSS as any).highlights.set(CURRENT_HIGHLIGHT_NAME, navigationHighlightInstance)
    }
  }

  /**
   * 应用当前导航高亮样式
   */
  const applyNavigationHighlight = (range: Range | null): void => {
    // 确保样式和实例已初始化
    initNavigationStyle()

    if (!navigationHighlightInstance) {
      return
    }

    // 每次都重新注册到 CSS.highlights，确保不会丢失
    ;(CSS as any).highlights.set(CURRENT_HIGHLIGHT_NAME, navigationHighlightInstance)

    // 清空并重新添加 range
    navigationHighlightInstance.clear()
    if (range) {
      try {
        navigationHighlightInstance.add(range)
      } catch (e) {
        // 静默处理
      }
    }
  }

  /**
   * 重建导航高亮
   * 在 activeRanges 变化后调用，简单逻辑：
   * 1. 如果没有正在导航，不做任何事
   * 2. 如果当前导航 ID 还存在，重新应用高亮
   * 3. 如果当前导航 ID 被删除了，重置到第一个
   */
  const rebuildNavigationHighlight = (): void => {
    if (!sdkInstance) return

    // 如果没有正在导航，不做任何事
    if (!currentNavigationId) {
      return
    }

    const sortedIds = getSortedHighlightIds()

    // 如果没有高亮了，清空导航状态
    if (sortedIds.length === 0) {
      navigationIndex.value = -1
      currentNavigationId = null
      applyNavigationHighlight(null)
      return
    }

    // 查找当前导航 ID 的新位置
    const newIndex = sortedIds.indexOf(currentNavigationId)

    if (newIndex >= 0) {
      // 当前导航 ID 还存在，更新索引并重新应用高亮
      navigationIndex.value = newIndex
      const range = sdkInstance.getActiveRange(currentNavigationId)
      if (range) {
        applyNavigationHighlight(range)
      }
    } else {
      // 当前导航 ID 被删除了，重置到第一个
      navigationIndex.value = 0
      currentNavigationId = sortedIds[0]
      const range = sdkInstance.getActiveRange(currentNavigationId)
      if (range) {
        applyNavigationHighlight(range)
      }
    }
  }

  /**
   * 获取按 DOM 顺序排序的高亮 ID 列表
   */
  const getSortedHighlightIds = (): string[] => {
    if (!sdkInstance) return []
    const ids = sdkInstance.getAllActiveSelectionIds()
    return sortHighlightIdsByDOMOrder(ids, (id) => sdkInstance!.getActiveRange(id))
  }

  /**
   * 导航到指定索引
   */
  const navigationGoToIndex = (index: number): void => {
    if (!sdkInstance) return

    // 使用排序后的 ID 列表
    const sortedIds = getSortedHighlightIds()
    if (sortedIds.length === 0) {
      navigationIndex.value = -1
      currentNavigationId = null
      return
    }

    // 循环导航
    let targetIndex = index
    if (targetIndex < 0) {
      targetIndex = sortedIds.length - 1
    } else if (targetIndex >= sortedIds.length) {
      targetIndex = 0
    }

    navigationIndex.value = targetIndex
    const id = sortedIds[targetIndex]
    // 记录当前导航的 ID，用于高亮变化后恢复位置
    currentNavigationId = id
    const range = sdkInstance.getActiveRange(id)

    if (range) {
      applyNavigationHighlight(range)
      scrollToRange(range)
    }
  }

  /**
   * 导航到下一个
   */
  const navigationGoToNext = (): void => {
    navigationGoToIndex(navigationIndex.value + 1)
  }

  /**
   * 导航到上一个
   */
  const navigationGoToPrev = (): void => {
    navigationGoToIndex(navigationIndex.value - 1)
  }

  /**
   * 导航到指定 ID
   */
  const navigationGoToId = (id: string): void => {
    if (!sdkInstance) return
    const sortedIds = getSortedHighlightIds()
    const index = sortedIds.indexOf(id)
    if (index >= 0) {
      navigationGoToIndex(index)
    }
  }

  /**
   * 重置导航
   */
  const navigationReset = (): void => {
    navigationIndex.value = -1
    currentNavigationId = null
    applyNavigationHighlight(null)
  }

  /**
   * 清理导航资源
   */
  const cleanupNavigation = (): void => {
    // 清除防抖定时器
    if (navigationRestoreTimer) {
      clearTimeout(navigationRestoreTimer)
      navigationRestoreTimer = null
    }
    if (navigationHighlightInstance) {
      navigationHighlightInstance.clear()
      if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
        ;(CSS as any).highlights.delete(CURRENT_HIGHLIGHT_NAME)
      }
      navigationHighlightInstance = null
    }
    if (navigationStyleElement) {
      navigationStyleElement.remove()
      navigationStyleElement = null
    }
  }

  // ========== 生命周期 ==========

  onMounted(() => {
    initializeSDK()
  })

  onUnmounted(() => {
    cleanupNavigation()
    if (sdkInstance) {
      sdkInstance.destroy()
      sdkInstance = null
    }
  })

  // ========== 返回接口 ==========
  return {
    // 状态
    isInitialized: isInitialized as Ref<boolean>,
    currentSelections: currentSelections as Ref<SerializedSelection[]>,
    isLoading: isLoading as Ref<boolean>,
    error: error as Ref<string | null>,

    // 配置
    config,

    // 选区类型
    availableTypes: config.selectionStyles,
    getTypeConfig: (type: string) => config.selectionStyles.find(t => t.type === type),

    // 核心方法
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData,
    getCurrentSelectionsForSubmit,
    getCurrentSelectionsSimple,
    highlightCurrentSelection,
    updateContainers,
    loadCurrentSelections,

    // 导航功能
    navigation: {
      currentIndex: navigationIndex as Ref<number>,
      total: navigationTotal,
      currentHighlight: navigationCurrentHighlight,
      goToNext: navigationGoToNext,
      goToPrev: navigationGoToPrev,
      goToIndex: navigationGoToIndex,
      goToId: navigationGoToId,
      reset: navigationReset
    },

    // 高级接口
    getSDKInstance
  }
}
