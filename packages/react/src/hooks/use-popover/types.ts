import type { Placement } from '@floating-ui/react'

/**
 * Popover 中显示的选区项类型
 */
export type PopoverItemType = 'saved' | 'search' | 'new'

/**
 * Popover 中显示的选区项
 */
export interface PopoverItem {
  /** 唯一标识 */
  id: string
  /** 项类型 */
  itemType: PopoverItemType
  /** 文本内容 */
  text?: string
  /** 样式类型 */
  styleType?: string
  /** 关联的 Range（新选区时使用） */
  range?: Range
  /** 原始选区数据（已保存选区时使用） */
  selectionData?: Record<string, unknown>
}

/**
 * 位置信息
 */
export interface PopoverPosition {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Popover 数据
 */
export interface PopoverData {
  /** 显示位置 */
  position: PopoverPosition | null
  /** 选区项列表 */
  items: PopoverItem[]
  /** 时间戳 */
  timestamp?: number
  /** 词典配置（可选） */
  dictionaryConfig?: {
    title: string
    contentTemplate: string
    showKeyword: boolean
  }
}

/**
 * usePopover 配置选项
 */
export interface UsePopoverOptions {
  /** 默认放置位置 */
  placement?: Placement
  /** 偏移距离 */
  offset?: number
  /** 边界内边距 */
  padding?: number
  /** 自动隐藏延迟（ms），0 表示不自动隐藏 */
  autoHideDelay?: number
  /** 点击外部时是否关闭 */
  closeOnClickOutside?: boolean
  /** 滚动时是否关闭 */
  closeOnScroll?: boolean
}

/**
 * usePopover 返回值
 */
export interface UsePopoverReturn {
  /** 是否显示 */
  visible: boolean
  /** Popover 数据 */
  data: PopoverData
  /** 浮动元素样式 */
  floatingStyles: React.CSSProperties
  /** 参考元素 ref 的 props */
  refs: {
    setReference: (node: HTMLElement | null) => void
    setFloating: (node: HTMLElement | null) => void
    reference: HTMLElement | null
    floating: HTMLElement | null
  }
  /** 显示 Popover */
  show: (data: Omit<PopoverData, 'timestamp'> & { timestamp?: number }) => void
  /** 隐藏 Popover */
  hide: () => void
  /** 延迟隐藏 */
  hideDelayed: (delay?: number) => void
  /** 取消延迟隐藏 */
  cancelHide: () => void
  /** 更新位置 */
  update: () => void
  /** Floating UI 的 getReferenceProps */
  getReferenceProps: () => Record<string, unknown>
  /** Floating UI 的 getFloatingProps */
  getFloatingProps: () => Record<string, unknown>
  /** 是否已定位完成 (Floating UI) */
  isPositioned: boolean
}
