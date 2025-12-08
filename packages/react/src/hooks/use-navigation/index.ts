/**
 * 导航功能模块
 * 从 use-selection-restore 抽离的导航逻辑
 * 内部模块
 */

import { useCallback, useMemo, useRef } from 'react'
import type { SelectionRestore } from 'range-kit'
import { sortHighlightIdsByDOMOrder, scrollToRange } from '../../utils/scroll'
import {
  DEFAULT_CURRENT_HIGHLIGHT_STYLE,
  CURRENT_HIGHLIGHT_NAME
} from './constants'
import type { NavigationReturn } from './types'

export * from './types'
export * from './constants'

/**
 * 导航配置
 */
export interface NavigationConfig {
  getInstance: () => SelectionRestore | null
  activeHighlightCount: number
  navigationIndex: number
  setNavigationIndex: (index: number) => void
}

/**
 * 创建导航功能 hook
 * 内部函数，用于 useSelectionRestore
 */
export function useNavigation(config: NavigationConfig): {
  navigation: NavigationReturn
  onActiveRangesChange: () => void
  cleanup: () => void
} {
  const { getInstance, activeHighlightCount, navigationIndex, setNavigationIndex } = config

  // ========== Refs ==========
  /** 当前导航的高亮 ID - 用于在高亮变化后恢复位置 */
  const currentNavigationIdRef = useRef<string | null>(null)
  const navigationHighlightInstanceRef = useRef<Highlight | null>(null)
  const navigationStyleElementRef = useRef<HTMLStyleElement | null>(null)
  /** 防抖定时器 - 用于等待批量高亮操作完成 */
  const navigationRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ========== CSS Highlight 样式管理 ==========

  /**
   * 初始化导航高亮样式
   */
  const initNavigationStyle = useCallback((): void => {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return

    if (!navigationStyleElementRef.current) {
      navigationStyleElementRef.current = document.createElement('style')
      navigationStyleElementRef.current.id = 'selection-navigation-style'
      document.head.appendChild(navigationStyleElementRef.current)
    }

    const style = DEFAULT_CURRENT_HIGHLIGHT_STYLE
    navigationStyleElementRef.current.textContent = `
      ::highlight(${CURRENT_HIGHLIGHT_NAME}) {
        background-color: ${style.backgroundColor} !important;
        color: ${style.color || 'inherit'};
        transition: ${style.transition || 'background-color 0.15s ease'};
      }
    `

    if (!navigationHighlightInstanceRef.current) {
      navigationHighlightInstanceRef.current = new Highlight()
      ;(CSS as unknown as { highlights: Map<string, Highlight> }).highlights.set(
        CURRENT_HIGHLIGHT_NAME,
        navigationHighlightInstanceRef.current
      )
    }
  }, [])

  /**
   * 应用当前导航高亮样式
   */
  const applyNavigationHighlight = useCallback((range: Range | null): void => {
    // 确保样式和实例已初始化
    initNavigationStyle()

    if (!navigationHighlightInstanceRef.current) {
      return
    }

    // 每次都重新注册到 CSS.highlights，确保不会丢失
    ;(CSS as unknown as { highlights: Map<string, Highlight> }).highlights.set(
      CURRENT_HIGHLIGHT_NAME,
      navigationHighlightInstanceRef.current
    )

    // 清空并重新添加 range
    navigationHighlightInstanceRef.current.clear()
    if (range) {
      try {
        navigationHighlightInstanceRef.current.add(range)
      } catch {
        // 静默处理
      }
    }
  }, [initNavigationStyle])

  // ========== 辅助方法 ==========

  /**
   * 获取按 DOM 顺序排序的高亮 ID 列表
   */
  const getSortedHighlightIds = useCallback((): string[] => {
    const instance = getInstance()
    if (!instance) return []
    const ids = instance.getAllActiveSelectionIds()
    return sortHighlightIdsByDOMOrder(ids, (id) => instance.getActiveRange(id))
  }, [getInstance])

  /**
   * 重建导航高亮
   * 在 activeRanges 变化后调用
   */
  const rebuildNavigationHighlight = useCallback((): void => {
    const instance = getInstance()
    if (!instance) return

    const sortedIds = getSortedHighlightIds()

    // 如果没有高亮了，清空导航状态
    if (sortedIds.length === 0) {
      setNavigationIndex(-1)
      currentNavigationIdRef.current = null
      applyNavigationHighlight(null)
      return
    }

    // 如果没有正在导航，自动初始化到第一个位置
    if (!currentNavigationIdRef.current) {
      setNavigationIndex(0)
      currentNavigationIdRef.current = sortedIds[0]
      const range = instance.getActiveRange(currentNavigationIdRef.current)
      if (range) {
        applyNavigationHighlight(range)
      }
      return
    }

    // 查找当前导航 ID 的新位置
    const newIndex = sortedIds.indexOf(currentNavigationIdRef.current)

    if (newIndex >= 0) {
      // 当前导航 ID 还存在，更新索引并重新应用高亮
      setNavigationIndex(newIndex)
      const range = instance.getActiveRange(currentNavigationIdRef.current)
      if (range) {
        applyNavigationHighlight(range)
      }
    } else {
      // 当前导航 ID 被删除了，重置到第一个
      setNavigationIndex(0)
      currentNavigationIdRef.current = sortedIds[0]
      const range = instance.getActiveRange(currentNavigationIdRef.current)
      if (range) {
        applyNavigationHighlight(range)
      }
    }
  }, [getInstance, getSortedHighlightIds, setNavigationIndex, applyNavigationHighlight])

  // ========== 导航方法 ==========

  /**
   * 导航到指定索引
   */
  const navigationGoToIndex = useCallback((index: number): void => {
    const instance = getInstance()
    if (!instance) return

    // 使用排序后的 ID 列表
    const sortedIds = getSortedHighlightIds()
    if (sortedIds.length === 0) {
      setNavigationIndex(-1)
      currentNavigationIdRef.current = null
      return
    }

    // 循环导航
    let targetIndex = index
    if (targetIndex < 0) {
      targetIndex = sortedIds.length - 1
    } else if (targetIndex >= sortedIds.length) {
      targetIndex = 0
    }

    setNavigationIndex(targetIndex)
    const id = sortedIds[targetIndex]
    // 记录当前导航的 ID，用于高亮变化后恢复位置
    currentNavigationIdRef.current = id
    const range = instance.getActiveRange(id)

    if (range) {
      applyNavigationHighlight(range)
      scrollToRange(range)
    }
  }, [getInstance, getSortedHighlightIds, setNavigationIndex, applyNavigationHighlight])

  /**
   * 导航到下一个
   */
  const navigationGoToNext = useCallback((): void => {
    navigationGoToIndex(navigationIndex + 1)
  }, [navigationGoToIndex, navigationIndex])

  /**
   * 导航到上一个
   */
  const navigationGoToPrev = useCallback((): void => {
    navigationGoToIndex(navigationIndex - 1)
  }, [navigationGoToIndex, navigationIndex])

  /**
   * 导航到指定 ID
   */
  const navigationGoToId = useCallback((id: string): void => {
    const sortedIds = getSortedHighlightIds()
    const index = sortedIds.indexOf(id)
    if (index >= 0) {
      navigationGoToIndex(index)
    }
  }, [getSortedHighlightIds, navigationGoToIndex])

  /**
   * 重置导航
   */
  const navigationReset = useCallback((): void => {
    setNavigationIndex(-1)
    currentNavigationIdRef.current = null
    applyNavigationHighlight(null)
  }, [setNavigationIndex, applyNavigationHighlight])

  /**
   * 活跃 Range 变化时的回调
   * 使用防抖等待批量操作完成后重建导航高亮
   */
  const onActiveRangesChange = useCallback((): void => {
    if (navigationRestoreTimerRef.current) {
      clearTimeout(navigationRestoreTimerRef.current)
    }

    navigationRestoreTimerRef.current = setTimeout(() => {
      navigationRestoreTimerRef.current = null
      rebuildNavigationHighlight()
    }, 50)
  }, [rebuildNavigationHighlight])

  /**
   * 清理导航资源
   */
  const cleanup = useCallback((): void => {
    // 清除防抖定时器
    if (navigationRestoreTimerRef.current) {
      clearTimeout(navigationRestoreTimerRef.current)
      navigationRestoreTimerRef.current = null
    }
    if (navigationHighlightInstanceRef.current) {
      navigationHighlightInstanceRef.current.clear()
      if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
        ;(CSS as unknown as { highlights: Map<string, Highlight> }).highlights.delete(
          CURRENT_HIGHLIGHT_NAME
        )
      }
      navigationHighlightInstanceRef.current = null
    }
    if (navigationStyleElementRef.current) {
      navigationStyleElementRef.current.remove()
      navigationStyleElementRef.current = null
    }
  }, [])

  // ========== 计算当前高亮项 ==========
  const currentHighlight = useMemo(() => {
    const instance = getInstance()
    if (navigationIndex < 0 || !instance) return null
    const sortedIds = getSortedHighlightIds()
    if (navigationIndex >= sortedIds.length) return null
    const id = sortedIds[navigationIndex]
    const range = instance.getActiveRange(id)
    return range ? { id, text: range.toString(), range } : null
  }, [getInstance, navigationIndex, getSortedHighlightIds])

  // ========== 返回值 ==========
  const navigation = useMemo<NavigationReturn>(() => ({
    currentIndex: navigationIndex,
    total: activeHighlightCount,
    currentHighlight,
    goToNext: navigationGoToNext,
    goToPrev: navigationGoToPrev,
    goToIndex: navigationGoToIndex,
    goToId: navigationGoToId,
    reset: navigationReset
  }), [navigationIndex, activeHighlightCount, currentHighlight, navigationGoToNext, navigationGoToPrev, navigationGoToIndex, navigationGoToId, navigationReset])

  return {
    navigation,
    onActiveRangesChange,
    cleanup
  }
}
