import { CSSBasedHighlighter } from '../highlighter/css-highlighter';
import { HighlightStyle } from '../types';
import { logSuccess, logDebug, logInfo } from '../debug/logger';

/**
 * 选区高亮管理器 - 负责选区的高亮显示
 */
export class SelectionHighlighter {
  private highlighter: CSSBasedHighlighter;
  private defaultStyle: HighlightStyle;

  constructor(defaultStyle?: HighlightStyle) {
    this.highlighter = new CSSBasedHighlighter();
    this.defaultStyle = defaultStyle || {
      backgroundColor: '#fff8e1',
      border: 'none',
      borderRadius: '2px',
      padding: '1px 0',
      boxShadow: 'none',
      transition: 'all 0.2s ease',
    };
    this.highlighter.setDefaultStyle(this.defaultStyle);
  }

  /**
   * 高亮Range
   */
  highlight(range: Range, autoScroll: boolean = true): string {
    const highlightId = this.highlighter.highlight(range);

    if (autoScroll && this.highlighter.scrollToRange) {
      this.highlighter.scrollToRange(range);
    }

    logSuccess('highlighter', 'Range高亮成功', {
      highlightId,
      text: range.toString().substring(0, 50) + '...',
    });

    return highlightId;
  }

  /**
   * 使用类型高亮Range
   */
  highlightWithType(range: Range, type: string, autoScroll: boolean = true): string {
    const highlightId = this.highlighter.highlightWithType(range, type, autoScroll);

    logSuccess('highlighter', '类型化高亮成功', {
      highlightId,
      type,
      text: range.toString().substring(0, 50) + '...',
    });

    return highlightId;
  }

  /**
   * 注册类型样式
   */
  registerTypeStyle(type: string, style: HighlightStyle): void {
    this.highlighter.registerTypeStyle(type, style);
    logInfo('highlighter', `注册类型样式: ${type}`, style);
  }

  /**
   * 清除所有高亮
   */
  clearHighlight(): void {
    this.highlighter.clearHighlight();
    logDebug('highlighter', '所有高亮已清除');
  }

  /**
   * 设置默认样式
   */
  setDefaultStyle(style: HighlightStyle): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
    this.highlighter.setDefaultStyle(this.defaultStyle);
    logInfo('highlighter', '默认样式已更新', this.defaultStyle);
  }

  /**
   * 获取高亮器实例
   */
  getHighlighter(): CSSBasedHighlighter {
    return this.highlighter;
  }

  /**
   * 获取预设样式
   */
  getPresetStyles(): Record<string, HighlightStyle> {
    return {
      default: this.defaultStyle,
      blue: {
        backgroundColor: '#e3f2fd',
        border: '2px solid #2196f3',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 0 8px rgba(33, 150, 243, 0.3)',
        transition: 'all 0.3s ease',
      },
      red: {
        backgroundColor: '#ffebee',
        border: '2px solid #f44336',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 0 8px rgba(244, 67, 54, 0.3)',
        transition: 'all 0.3s ease',
      },
      green: {
        backgroundColor: '#e8f5e8',
        border: '2px solid #4caf50',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)',
        transition: 'all 0.3s ease',
      },
    };
  }

  /**
   * 销毁高亮器
   */
  destroy(): void {
    this.highlighter.destroy();
    logInfo('highlighter', '高亮器已销毁');
  }
}
