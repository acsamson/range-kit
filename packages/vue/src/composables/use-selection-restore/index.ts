import { ref, reactive, onMounted, onUnmounted, type Ref } from 'vue'
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
} from '@l2c/range-kit-core'

import type {
  UseSelectionRestoreOptions,
  UseSelectionRestoreReturn,
  SelectionActionEvent,
  SelectionActionType
} from './types'
import { DEFAULT_SELECTION_STYLE, DEFAULT_SELECTION_TYPES } from './constants'
import { convertToSimple } from '../../utils/convert'
import { createNavigation } from './use-navigation'

// 导出类型供外部使用
export * from './types'
export { convertToSimple, convertToSimple as convertSelectionsToSimple } from '../../utils/convert'

/**
 * Range SDK 选区恢复功能 Hook
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
  const activeHighlightCount = ref<number>(0)

  // 创建导航功能
  const {
    navigation,
    onActiveRangesChange,
    cleanup: cleanupNavigation
  } = createNavigation({
    getSDKInstance: () => sdkInstance,
    activeHighlightCount
  })

  // ========== 事件转换 ==========

  /**
   * 将 SDK 的 SelectionBehaviorEvent 转换为统一的 SelectionActionEvent
   */
  const convertBehaviorToAction = (event: SelectionBehaviorEvent): SelectionActionEvent => {
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

  // ========== SDK 初始化 ==========

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
        onSelectionBehavior: (event: SelectionBehaviorEvent) => {
          if (options.onSelectionAction) {
            options.onSelectionAction(convertBehaviorToAction(event))
          }
        },
        onSelectionInteraction: (event: SelectionInteractionEvent, instance: SelectionInstance) => {
          if (options.onSelectionAction) {
            options.onSelectionAction(convertInteractionToAction(event, instance))
          }
        },
        onActiveRangesChange: (event) => {
          activeHighlightCount.value = event.count
          onActiveRangesChange()
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
   * 刷新当前选区列表（从内存状态）
   * SDK 是无状态的，选区由 Hook 本地管理
   */
  const loadCurrentSelections = async () => {
    // SDK 是无状态的，选区数据由本地 currentSelections 管理
    // 此方法保留是为了 API 兼容性
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

      // 设置选区类型
      serializedSelection.type = type

      // 将选区添加到本地状态管理
      const existingIndex = currentSelections.value.findIndex(s => s.id === serializedSelection.id)
      if (existingIndex >= 0) {
        currentSelections.value[existingIndex] = serializedSelection
      } else {
        currentSelections.value.push(serializedSelection)
      }

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
   * 高亮选区并将数据保存到本地状态
   */
  const restoreSelections = async (
    selections: SerializedSelection[],
    enableAutoScroll: boolean = false
  ) => {
    if (!sdkInstance) throw new Error('SDK未初始化')

    try {
      isLoading.value = true

      // 将选区数据保存到本地状态
      selections.forEach(selection => {
        const existingIndex = currentSelections.value.findIndex(s => s.id === selection.id)
        if (existingIndex >= 0) {
          currentSelections.value[existingIndex] = selection
        } else {
          currentSelections.value.push(selection)
        }
      })

      // 高亮显示
      const scrollIndex = enableAutoScroll ? 0 : -1
      await sdkInstance.highlightSelections(selections, scrollIndex)
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
    navigation.reset()
  }

  /**
   * 删除选区
   */
  const deleteSelection = async (selectionId: string) => {
    if (!sdkInstance) throw new Error('SDK未初始化')

    try {
      // 从本地状态中移除
      const index = currentSelections.value.findIndex(s => s.id === selectionId)
      if (index >= 0) {
        currentSelections.value.splice(index, 1)
      }
      // 清除高亮（重新高亮剩余的选区）
      sdkInstance.clearHighlight()
      if (currentSelections.value.length > 0) {
        await sdkInstance.highlightSelections(currentSelections.value, -1)
      }
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
      sdkInstance.clearHighlight()
      currentSelections.value = []
      navigation.reset()
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
    navigation,

    // 高级接口
    getSDKInstance
  }
}
