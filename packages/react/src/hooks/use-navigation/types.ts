/**
 * 高亮导航类型定义
 */

/**
 * 当前高亮样式
 */
export interface CurrentHighlightStyle {
  backgroundColor?: string
  color?: string
  border?: string
  borderRadius?: string
  transition?: string
}

/**
 * 导航返回类型
 */
export interface NavigationReturn {
  currentIndex: number
  total: number
  currentHighlight: { id: string; text: string; range: Range } | null
  goToNext: () => void
  goToPrev: () => void
  goToIndex: (index: number) => void
  goToId: (id: string) => void
  reset: () => void
}
