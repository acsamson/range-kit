/**
 * Highlighter 模块
 *
 * 渲染层，负责 DOM 高亮绘制
 * 只接收 Range，不关心来源
 *
 * @example
 * ```typescript
 * import { Highlighter } from '@range-kit/core';
 *
 * const highlighter = new Highlighter();
 * const id = highlighter.draw(range);
 * highlighter.clear(id);
 * ```
 */

// 主类导出
export { Highlighter, createHighlighter, isHighlightSupported } from './highlighter';

// 绘制器导出
export { CSSPainter } from './painters';

// 类型导出
export type {
  IHighlighter,
  IEventfulHighlighter,
  HighlightStyle,
  HighlightEventType,
  HighlightEventData,
  HighlightEventListener,
  HighlighterOptions,
} from './types';

export { HighlightEventType as HighlightEvent } from './types';
