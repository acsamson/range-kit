/**
 * 通用交互类型定义
 * 用于 useSelectionRestore 和 useSearchHighlight 等 hooks
 */

/**
 * 交互类型
 */
export type InteractionType = 'click' | 'hover' | 'dblclick' | 'contextmenu'

/**
 * 基础交互事件
 * 所有交互事件的公共字段
 */
export interface BaseInteractionEvent {
  /** 交互类型 */
  type: InteractionType
  /** 原始鼠标事件 */
  originalEvent: MouseEvent
}

/**
 * 计算位置的辅助函数
 * UI 层使用，根据 Range 或 MouseEvent 计算弹窗位置
 */
export interface PositionRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 从 Range 获取位置
 */
export const getPositionFromRange = (range: Range | null): PositionRect | null => {
  if (!range) return null
  const rects = range.getClientRects()
  if (rects.length === 0) return null
  const rect = rects[0]
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

/**
 * 从鼠标事件获取位置（降级方案）
 */
export const getPositionFromMouseEvent = (
  e: MouseEvent,
  offsetX: number = 50,
  offsetY: number = 20,
  defaultWidth: number = 100,
  defaultHeight: number = 20
): PositionRect => {
  return {
    x: e.clientX - offsetX,
    y: e.clientY - offsetY,
    width: defaultWidth,
    height: defaultHeight
  }
}

/**
 * 获取交互位置（优先使用 Range，降级使用鼠标位置）
 */
export const getInteractionPosition = (
  range: Range | null,
  e: MouseEvent
): PositionRect => {
  return getPositionFromRange(range) || getPositionFromMouseEvent(e)
}
