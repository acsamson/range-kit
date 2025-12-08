/**
 * 高亮导航 Hook 类型定义
 */

import type { Ref, ComputedRef } from 'vue'
import type { SelectionRestoreAPI } from 'range-kit'

/**
 * 高亮项接口
 * 表示一个可导航的高亮项
 */
export interface NavigableHighlight {
  /** 高亮项唯一标识 */
  id: string
  /** 高亮文本内容 */
  text: string
  /** 高亮对应的 Range 对象 */
  range?: Range
  /** 高亮类型 */
  type?: string
  /** 额外数据 */
  data?: any
}

/**
 * 当前高亮样式配置
 */
export interface CurrentHighlightStyle {
  /** 背景颜色（默认橙色 #ff9632，类似 Chrome 搜索高亮） */
  backgroundColor?: string
  /** 文字颜色 */
  color?: string
  /** 边框 */
  border?: string
  /** 边框圆角 */
  borderRadius?: string
  /** 过渡动画 */
  transition?: string
}

/**
 * 高亮导航配置选项
 */
export interface UseHighlightNavigationOptions {
  /**
   * 获取 range-kit 实例的函数
   * 导航功能会从实例读取所有活跃的高亮 Range
   */
  getInstance: () => SelectionRestoreAPI | null

  /**
   * 当前高亮项的样式配置
   * 默认为橙色背景（类似 Chrome 搜索高亮）
   */
  currentHighlightStyle?: CurrentHighlightStyle

  /**
   * 高亮样式变化时的回调
   * @param highlightId - 高亮项 ID
   * @param isCurrent - 是否为当前高亮
   */
  onHighlightStyleChange?: (highlightId: string, isCurrent: boolean) => void

  /**
   * 导航时的回调
   * @param highlight - 当前高亮项
   * @param index - 当前索引
   */
  onNavigate?: (highlight: NavigableHighlight, index: number) => void

  /**
   * 是否循环导航
   * 当到达末尾时是否跳转到开头，反之亦然
   * 默认为 true
   */
  loop?: boolean

  /**
   * 导航时是否自动滚动到视图
   * 默认为 true
   */
  autoScroll?: boolean
}

/**
 * 高亮导航 Hook 返回值
 */
export interface UseHighlightNavigationReturn {
  /** 当前高亮索引（-1 表示未选中任何高亮） */
  currentIndex: Ref<number>
  /** 高亮项总数 */
  total: ComputedRef<number>
  /** 当前高亮项（如果有） */
  currentHighlight: ComputedRef<NavigableHighlight | null>
  /** 是否有上一个高亮 */
  hasPrev: ComputedRef<boolean>
  /** 是否有下一个高亮 */
  hasNext: ComputedRef<boolean>
  /** 跳转到下一个高亮 */
  goToNext: () => void
  /** 跳转到上一个高亮 */
  goToPrev: () => void
  /** 跳转到指定索引的高亮 */
  goToIndex: (index: number) => void
  /** 跳转到指定 ID 的高亮 */
  goToId: (id: string) => void
  /** 重置导航状态（回到未选中状态） */
  reset: () => void
  /** 刷新高亮列表（当外部数据变化时调用） */
  refresh: () => void
}
