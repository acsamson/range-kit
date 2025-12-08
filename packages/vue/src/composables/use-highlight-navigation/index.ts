/**
 * 高亮导航 Hook
 * 提供通用的高亮项导航功能，支持上下切换、跳转指定位置、当前高亮样式等
 * 直接从 Kit 读取高亮数据，统一管理所有高亮的导航
 */

import { ref, computed, onUnmounted } from 'vue'
import type {
  UseHighlightNavigationOptions,
  UseHighlightNavigationReturn,
  NavigableHighlight
} from './types'
import {
  DEFAULT_CURRENT_HIGHLIGHT_STYLE,
  CURRENT_HIGHLIGHT_NAME
} from './constants'

/**
 * 高亮导航 Hook
 * @param options - 配置选项
 * @returns 导航状态和方法
 */
export function useHighlightNavigation(
  options: UseHighlightNavigationOptions
): UseHighlightNavigationReturn {
  const {
    getInstance,
    currentHighlightStyle = DEFAULT_CURRENT_HIGHLIGHT_STYLE,
    onHighlightStyleChange,
    onNavigate,
    loop = true,
    autoScroll = true
  } = options

  // ========== 状态 ==========

  /** 当前高亮索引 */
  const currentIndex = ref<number>(-1)

  /** 缓存的高亮列表 */
  const highlightList = ref<NavigableHighlight[]>([])

  /** CSS Highlight API 实例（用于当前高亮样式） */
  let currentHighlightInstance: Highlight | null = null

  /** 样式元素 */
  let styleElement: HTMLStyleElement | null = null

  // ========== 计算属性 ==========

  /** 高亮项总数 */
  const total = computed(() => highlightList.value.length)

  /** 当前高亮项 */
  const currentHighlight = computed<NavigableHighlight | null>(() => {
    if (currentIndex.value < 0 || currentIndex.value >= highlightList.value.length) {
      return null
    }
    return highlightList.value[currentIndex.value]
  })

  /** 是否有上一个高亮 */
  const hasPrev = computed(() => {
    if (loop) return total.value > 0
    return currentIndex.value > 0
  })

  /** 是否有下一个高亮 */
  const hasNext = computed(() => {
    if (loop) return total.value > 0
    return currentIndex.value < total.value - 1
  })

  // ========== 样式管理 ==========

  /**
   * 初始化 CSS Highlight API 样式
   */
  const initializeHighlightStyle = (): void => {
    // 检查 CSS Highlight API 支持
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) {
      console.warn('[useHighlightNavigation] CSS Highlight API 不支持')
      return
    }

    // 创建样式元素
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'highlight-navigation-style'
      document.head.appendChild(styleElement)
    }

    // 设置当前高亮样式
    const style = { ...DEFAULT_CURRENT_HIGHLIGHT_STYLE, ...currentHighlightStyle }
    styleElement.textContent = `
      ::highlight(${CURRENT_HIGHLIGHT_NAME}) {
        background-color: ${style.backgroundColor} !important;
        color: ${style.color || 'inherit'};
        border: ${style.border || 'none'};
        border-radius: ${style.borderRadius || '2px'};
        transition: ${style.transition || 'background-color 0.15s ease'};
      }
    `

    // 创建 Highlight 实例
    if (!currentHighlightInstance) {
      currentHighlightInstance = new Highlight()
      ;(CSS as any).highlights.set(CURRENT_HIGHLIGHT_NAME, currentHighlightInstance)
    }
  }

  /**
   * 应用当前高亮样式到指定的 Range
   */
  const applyCurrentHighlightStyle = (highlight: NavigableHighlight | null): void => {
    if (!currentHighlightInstance) {
      initializeHighlightStyle()
    }

    if (!currentHighlightInstance) return

    // 清除之前的高亮
    currentHighlightInstance.clear()

    // 如果没有当前高亮，直接返回
    if (!highlight || !highlight.range) return

    try {
      // 添加当前高亮的 Range
      currentHighlightInstance.add(highlight.range)
    } catch (error) {
      console.warn('[useHighlightNavigation] 应用当前高亮样式失败:', error)
    }
  }

  /**
   * 清理样式资源
   */
  const cleanupStyles = (): void => {
    if (currentHighlightInstance) {
      currentHighlightInstance.clear()
      if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
        ;(CSS as any).highlights.delete(CURRENT_HIGHLIGHT_NAME)
      }
      currentHighlightInstance = null
    }

    if (styleElement) {
      styleElement.remove()
      styleElement = null
    }
  }

  // ========== 核心方法 ==========

  /**
   * 从 Kit 获取高亮列表
   * 直接读取 Kit 内部的 activeRanges
   */
  const getHighlightsFromKit = (): NavigableHighlight[] => {
    const instance = getInstance()
    if (!instance) {
      return []
    }

    const selectionIds = instance.getAllActiveSelectionIds()
    const highlights: NavigableHighlight[] = []

    for (const id of selectionIds) {
      const range = instance.getActiveRange(id)
      if (range) {
        highlights.push({
          id,
          text: range.toString(),
          range
        })
      }
    }

    return highlights
  }

  /**
   * 刷新高亮列表
   */
  const refresh = (): void => {
    highlightList.value = getHighlightsFromKit()

    // 如果当前索引超出范围，重置
    if (currentIndex.value >= highlightList.value.length) {
      currentIndex.value = highlightList.value.length > 0 ? 0 : -1
    }
  }

  /**
   * 将 Range 滚动到视图中
   */
  const scrollRangeIntoView = (range: Range): void => {
    try {
      const rect = range.getBoundingClientRect()

      // 检查是否在视口内
      const isInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      )

      if (!isInViewport) {
        // 创建临时元素用于滚动
        const tempSpan = document.createElement('span')
        range.insertNode(tempSpan)

        tempSpan.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })

        // 移除临时元素
        tempSpan.parentNode?.removeChild(tempSpan)

        // 重新规范化 Range
        range.commonAncestorContainer.normalize()
      }
    } catch (error) {
      console.warn('[useHighlightNavigation] 滚动到高亮位置失败:', error)
    }
  }

  // ========== 导航方法 ==========

  /**
   * 跳转到指定索引
   */
  const goToIndex = (index: number): void => {
    // 刷新列表
    refresh()

    if (highlightList.value.length === 0) {
      currentIndex.value = -1
      return
    }

    // 处理循环导航
    let targetIndex = index
    if (loop) {
      if (targetIndex < 0) {
        targetIndex = highlightList.value.length - 1
      } else if (targetIndex >= highlightList.value.length) {
        targetIndex = 0
      }
    } else {
      // 非循环模式，限制在有效范围内
      targetIndex = Math.max(0, Math.min(targetIndex, highlightList.value.length - 1))
    }

    const prevIndex = currentIndex.value
    currentIndex.value = targetIndex

    const highlight = highlightList.value[targetIndex]

    // 应用当前高亮样式
    applyCurrentHighlightStyle(highlight)

    // 通知样式变化
    if (onHighlightStyleChange) {
      // 移除前一个高亮的当前样式
      if (prevIndex >= 0 && prevIndex < highlightList.value.length) {
        onHighlightStyleChange(highlightList.value[prevIndex].id, false)
      }
      // 添加当前高亮的样式
      onHighlightStyleChange(highlight.id, true)
    }

    // 触发导航回调
    if (onNavigate) {
      onNavigate(highlight, targetIndex)
    }

    // 自动滚动到视图
    if (autoScroll && highlight && highlight.range) {
      scrollRangeIntoView(highlight.range)
    }
  }

  /**
   * 跳转到下一个高亮
   */
  const goToNext = (): void => {
    if (highlightList.value.length === 0) {
      refresh()
    }

    if (highlightList.value.length === 0) return

    const nextIndex = currentIndex.value + 1
    goToIndex(nextIndex)
  }

  /**
   * 跳转到上一个高亮
   */
  const goToPrev = (): void => {
    if (highlightList.value.length === 0) {
      refresh()
    }

    if (highlightList.value.length === 0) return

    const prevIndex = currentIndex.value - 1
    goToIndex(prevIndex)
  }

  /**
   * 跳转到指定 ID 的高亮
   */
  const goToId = (id: string): void => {
    refresh()

    const index = highlightList.value.findIndex(h => h.id === id)
    if (index >= 0) {
      goToIndex(index)
    }
  }

  /**
   * 重置导航状态
   */
  const reset = (): void => {
    const prevIndex = currentIndex.value
    currentIndex.value = -1

    // 清除当前高亮样式
    applyCurrentHighlightStyle(null)

    // 通知样式变化
    if (onHighlightStyleChange && prevIndex >= 0 && prevIndex < highlightList.value.length) {
      onHighlightStyleChange(highlightList.value[prevIndex].id, false)
    }
  }

  // ========== 生命周期 ==========

  // 组件卸载时清理
  onUnmounted(() => {
    cleanupStyles()
  })

  // 初始化
  initializeHighlightStyle()

  // ========== 返回接口 ==========
  return {
    currentIndex,
    total,
    currentHighlight,
    hasPrev,
    hasNext,
    goToNext,
    goToPrev,
    goToIndex,
    goToId,
    reset,
    refresh
  }
}

// 导出类型
export * from './types'
export * from './constants'
