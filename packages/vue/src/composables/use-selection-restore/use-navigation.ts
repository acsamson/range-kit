/**
 * 导航功能模块
 * 从 use-selection-restore 抽离的导航逻辑
 * 内部模块，不对外导出
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { SelectionRestore } from 'range-kit'
import { scrollToRange, sortHighlightIdsByDOMOrder } from '../../utils/scroll'
import {
  DEFAULT_CURRENT_HIGHLIGHT_STYLE,
  CURRENT_HIGHLIGHT_NAME
} from '../use-highlight-navigation/constants'

/**
 * 导航返回类型
 */
export interface NavigationReturn {
  currentIndex: Ref<number>
  total: ComputedRef<number>
  currentHighlight: ComputedRef<{ id: string; text: string; range: Range } | null>
  goToNext: () => void
  goToPrev: () => void
  goToIndex: (index: number) => void
  goToId: (id: string) => void
  reset: () => void
}

/**
 * 导航配置
 */
export interface NavigationConfig {
  getInstance: () => SelectionRestore | null
  activeHighlightCount: Ref<number>
}

/**
 * 创建导航功能
 * 内部函数，用于 useSelectionRestore
 */
export function createNavigation(config: NavigationConfig): {
  navigation: NavigationReturn
  onActiveRangesChange: () => void
  cleanup: () => void
} {
  const { getInstance, activeHighlightCount } = config

  // ========== 状态 ==========
  const navigationIndex = ref<number>(-1)
  /** 当前导航的高亮 ID - 用于在高亮变化后恢复位置 */
  let currentNavigationId: string | null = null
  let navigationHighlightInstance: Highlight | null = null
  let navigationStyleElement: HTMLStyleElement | null = null
  /** 防抖定时器 - 用于等待批量高亮操作完成 */
  let navigationRestoreTimer: ReturnType<typeof setTimeout> | null = null

  // ========== 计算属性 ==========

  /** 导航总数 - 使用响应式计数 */
  const navigationTotal = computed(() => activeHighlightCount.value)

  /** 当前导航高亮项 */
  const navigationCurrentHighlight = computed(() => {
    const instance = getInstance()
    if (navigationIndex.value < 0 || !instance) return null
    // 使用排序后的 ID 列表，保持与导航方法一致
    const sortedIds = getSortedHighlightIds()
    if (navigationIndex.value >= sortedIds.length) return null
    const id = sortedIds[navigationIndex.value]
    const range = instance.getActiveRange(id)
    return range ? { id, text: range.toString(), range } : null
  })

  // ========== CSS Highlight 样式管理 ==========

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
      ;(CSS as unknown as { highlights: Map<string, Highlight> }).highlights.set(
        CURRENT_HIGHLIGHT_NAME,
        navigationHighlightInstance
      )
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
    ;(CSS as unknown as { highlights: Map<string, Highlight> }).highlights.set(
      CURRENT_HIGHLIGHT_NAME,
      navigationHighlightInstance
    )

    // 清空并重新添加 range
    navigationHighlightInstance.clear()
    if (range) {
      try {
        navigationHighlightInstance.add(range)
      } catch {
        // 静默处理
      }
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 获取按 DOM 顺序排序的高亮 ID 列表
   */
  const getSortedHighlightIds = (): string[] => {
    const instance = getInstance()
    if (!instance) return []
    const ids = instance.getAllActiveSelectionIds()
    return sortHighlightIdsByDOMOrder(ids, (id) => instance.getActiveRange(id))
  }

  /**
   * 重建导航高亮
   * 在 activeRanges 变化后调用
   * 高亮变化时自动初始化或恢复导航位置
   */
  const rebuildNavigationHighlight = (): void => {
    const instance = getInstance()
    if (!instance) return

    const sortedIds = getSortedHighlightIds()

    // 如果没有高亮了，清空导航状态
    if (sortedIds.length === 0) {
      navigationIndex.value = -1
      currentNavigationId = null
      applyNavigationHighlight(null)
      return
    }

    // 如果没有正在导航，自动初始化到第一个位置
    if (!currentNavigationId) {
      navigationIndex.value = 0
      currentNavigationId = sortedIds[0]
      const range = instance.getActiveRange(currentNavigationId)
      if (range) {
        applyNavigationHighlight(range)
      }
      return
    }

    // 查找当前导航 ID 的新位置
    const newIndex = sortedIds.indexOf(currentNavigationId)

    if (newIndex >= 0) {
      // 当前导航 ID 还存在，更新索引并重新应用高亮
      navigationIndex.value = newIndex
      const range = instance.getActiveRange(currentNavigationId)
      if (range) {
        applyNavigationHighlight(range)
      }
    } else {
      // 当前导航 ID 被删除了，重置到第一个
      navigationIndex.value = 0
      currentNavigationId = sortedIds[0]
      const range = instance.getActiveRange(currentNavigationId)
      if (range) {
        applyNavigationHighlight(range)
      }
    }
  }

  // ========== 导航方法 ==========

  /**
   * 导航到指定索引
   */
  const navigationGoToIndex = (index: number): void => {
    const instance = getInstance()
    if (!instance) return

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
    const range = instance.getActiveRange(id)

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
    const instance = getInstance()
    if (!instance) return
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
   * 活跃 Range 变化时的回调
   * 使用防抖等待批量操作完成后重建导航高亮
   */
  const onActiveRangesChange = (): void => {
    if (navigationRestoreTimer) {
      clearTimeout(navigationRestoreTimer)
    }

    navigationRestoreTimer = setTimeout(() => {
      navigationRestoreTimer = null
      rebuildNavigationHighlight()
    }, 50)
  }

  /**
   * 清理导航资源
   */
  const cleanup = (): void => {
    // 清除防抖定时器
    if (navigationRestoreTimer) {
      clearTimeout(navigationRestoreTimer)
      navigationRestoreTimer = null
    }
    if (navigationHighlightInstance) {
      navigationHighlightInstance.clear()
      if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
        ;(CSS as unknown as { highlights: Map<string, Highlight> }).highlights.delete(
          CURRENT_HIGHLIGHT_NAME
        )
      }
      navigationHighlightInstance = null
    }
    if (navigationStyleElement) {
      navigationStyleElement.remove()
      navigationStyleElement = null
    }
  }

  return {
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
    onActiveRangesChange,
    cleanup
  }
}
