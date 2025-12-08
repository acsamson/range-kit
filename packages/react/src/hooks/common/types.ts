/**
 * 通用交互类型定义
 */

/**
 * 交互类型
 */
export type InteractionType = 'click' | 'hover' | 'dblclick' | 'contextmenu'

/**
 * 基础交互事件
 */
export interface BaseInteractionEvent {
  /** 交互类型 */
  type: InteractionType
  /** 原始鼠标事件 */
  originalEvent: MouseEvent
}

export interface PositionRect {
  x: number
  y: number
  width: number
  height: number
}

export const getPositionFromRange = (range: Range | null): PositionRect | null => {
  if (!range) return null
  const rects = range.getClientRects()
  if (rects.length === 0) return null
  const rect = rects[0]
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

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

export const getInteractionPosition = (
  range: Range | null,
  e: MouseEvent
): PositionRect => {
  return getPositionFromRange(range) || getPositionFromMouseEvent(e)
}
