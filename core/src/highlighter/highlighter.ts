/**
 * Highlighter - 高亮管理器
 *
 * 渲染层，负责 DOM 高亮绘制
 * 只接收 Range，不关心来源
 *
 * @example
 * ```typescript
 * import { Highlighter } from '@range-kit/core';
 *
 * const highlighter = new Highlighter();
 *
 * // 高亮 Range
 * const id = highlighter.draw(range, { backgroundColor: '#ffeb3b' });
 *
 * // 清除高亮
 * highlighter.clear(id);
 * ```
 */

import type {
  IHighlighter,
  IEventfulHighlighter,
  HighlightStyle,
  HighlightEventType,
  HighlightEventListener,
  HighlighterOptions,
} from './types';

import { CSSPainter, isHighlightSupported } from './painters';

/**
 * 默认高亮样式
 */
const DEFAULT_STYLE: HighlightStyle = {
  backgroundColor: '#fff8e1',
  textDecoration: 'none',
};

/**
 * 高亮管理器
 *
 * 职责：DOM 高亮绘制
 * 特性：只接收 Range，不关心来源
 */
export class Highlighter implements IEventfulHighlighter {
  private painter: IEventfulHighlighter;
  private defaultStyle: HighlightStyle;

  constructor(options?: HighlighterOptions) {
    this.defaultStyle = options?.defaultStyle ?? DEFAULT_STYLE;
    this.painter = new CSSPainter();
    this.painter.setDefaultStyle(this.defaultStyle);
  }

  // ========== 核心 API ==========

  /**
   * 绘制高亮
   *
   * @param range - 要高亮的 Range
   * @param style - 可选的样式
   * @returns 高亮 ID
   */
  draw(range: Range, style?: HighlightStyle): string {
    return this.painter.highlight(range, style);
  }

  /**
   * 使用类型绘制高亮
   *
   * @param range - 要高亮的 Range
   * @param type - 高亮类型
   * @param autoScroll - 是否自动滚动
   * @returns 高亮 ID
   */
  drawWithType(range: Range, type: string, autoScroll: boolean = true): string {
    return this.painter.highlightWithType(range, type, autoScroll);
  }

  /**
   * 清除高亮
   *
   * @param id - 可选的高亮 ID，不传则清除所有
   */
  clear(id?: string): void {
    if (id) {
      this.painter.clearHighlightById(id);
    } else {
      this.painter.clearHighlight();
    }
  }

  /**
   * 清除指定类型的高亮
   *
   * @param type - 高亮类型
   */
  clearByType(type: string): void {
    this.painter.clearHighlightByType(type);
  }

  // ========== 样式管理 ==========

  /**
   * 注册类型样式
   */
  registerStyle(type: string, style: HighlightStyle): void {
    this.painter.registerTypeStyle(type, style);
  }

  /**
   * 设置默认样式
   */
  setDefaultStyle(style: HighlightStyle): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
    this.painter.setDefaultStyle(this.defaultStyle);
  }

  // ========== 滚动 ==========

  /**
   * 滚动到 Range 位置
   */
  scrollTo(range: Range): void {
    this.painter.scrollToRange(range);
  }

  // ========== 状态查询 ==========

  /**
   * 获取活跃高亮数量
   */
  getCount(): number {
    return this.painter.getActiveHighlightCount();
  }

  /**
   * 检查是否有活跃高亮
   */
  hasHighlights(): boolean {
    return this.painter.hasActiveHighlights();
  }

  // ========== 事件接口 ==========

  /**
   * 添加事件监听器
   */
  on(eventType: HighlightEventType, listener: HighlightEventListener): void {
    this.painter.on(eventType, listener);
  }

  /**
   * 移除事件监听器
   */
  off(eventType: HighlightEventType, listener: HighlightEventListener): void {
    this.painter.off(eventType, listener);
  }

  // ========== 销毁 ==========

  /**
   * 销毁高亮器
   */
  destroy(): void {
    this.painter.destroy();
  }

  // ========== 兼容旧 API ==========

  highlight(range: Range, style?: HighlightStyle): string {
    return this.draw(range, style);
  }

  highlightWithType(range: Range, type: string, autoScroll?: boolean): string {
    return this.drawWithType(range, type, autoScroll);
  }

  clearHighlight(): void {
    this.clear();
  }

  clearHighlightById(highlightId: string): void {
    this.clear(highlightId);
  }

  clearHighlightByType(type: string): void {
    this.clearByType(type);
  }

  registerTypeStyle(type: string, style: HighlightStyle): void {
    this.registerStyle(type, style);
  }

  createHighlightStyle(style: HighlightStyle): string {
    return this.painter.createHighlightStyle(style);
  }

  scrollToRange(range: Range): void {
    this.scrollTo(range);
  }

  getActiveHighlightCount(): number {
    return this.getCount();
  }

  hasActiveHighlights(): boolean {
    return this.hasHighlights();
  }
}

/**
 * 创建 Highlighter 实例的工厂函数
 */
export function createHighlighter(options?: HighlighterOptions): Highlighter {
  return new Highlighter(options);
}

export { isHighlightSupported };
