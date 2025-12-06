/**
 * facade/helpers 共享类型定义
 * 避免模块间的循环依赖
 */

/**
 * 高亮范围信息
 */
export interface HighlightedRange {
  highlightId: string;
  range: Range;
  text: string;
}

/**
 * 高亮交互事件
 */
export interface HighlightInteractionEvent {
  type: 'hover' | 'click' | 'doubleclick' | 'contextmenu';
  selection: {
    text: string; // 当前点击的文本
    overlappedTexts?: string[] | undefined; // 该位置所有重叠的文本（包括当前文本）
  };
  originalEvent: MouseEvent;
}

/**
 * 高亮事件处理器选项
 */
export interface HighlightEventHandlerOptions {
  /** 交互事件回调 */
  onInteraction?: (event: HighlightInteractionEvent, instance: unknown) => void;
}
