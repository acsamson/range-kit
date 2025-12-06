/**
 * 选区高亮管理器包装类
 * 负责选区的高亮显示
 */

import { Highlighter as HighlighterImpl, createHighlighter as createHighlighterImpl } from '../../highlighter';
import type { Highlighter, HighlightStyle } from '../../types';
import { logSuccess, logDebug, logInfo } from '../../common/debug';

/**
 * 默认高亮样式
 */
const DEFAULT_HIGHLIGHT_STYLE: HighlightStyle = {
  backgroundColor: '#fff8e1',
  border: 'none',
  borderRadius: '2px',
  padding: '1px 0',
  boxShadow: 'none',
  transition: 'all 0.2s ease',
};

/**
 * 高亮器配置选项
 */
export interface HighlighterOptions {
  /** 默认样式 */
  defaultStyle?: HighlightStyle;
  /** 自定义高亮器实例（用于依赖注入） */
  highlighter?: Highlighter;
}

/**
 * 创建高亮器实例的工厂函数
 *
 * 支持依赖注入，可传入自定义 Highlighter 实现
 *
 * @example
 * ```typescript
 * // 使用默认 CSSBasedHighlighter
 * const highlighter = createHighlighter();
 *
 * // 使用自定义高亮器
 * const customHighlighter = new MyCustomHighlighter();
 * const highlighter = createHighlighter({ highlighter: customHighlighter });
 * ```
 */
export function createHighlighter(options?: HighlighterOptions): Highlighter {
  if (options?.highlighter) {
    return options.highlighter;
  }
  return createHighlighterImpl();
}

/**
 * 选区高亮管理器 - 负责选区的高亮显示
 *
 * 这是一个适配器/包装器类，提供统一的高亮操作接口。
 * 支持依赖注入，可以传入任意实现 Highlighter 接口的实例。
 */
export class SelectionHighlighter implements Highlighter {
  private highlighter: Highlighter;
  private defaultStyle: HighlightStyle;

  /**
   * 创建选区高亮管理器
   *
   * @param options - 配置选项，可传入默认样式或自定义高亮器
   */
  constructor(options?: HighlighterOptions | HighlightStyle) {
    // 兼容旧版 API：直接传入 HighlightStyle
    const opts: HighlighterOptions = options && 'highlighter' in options
      ? options
      : { defaultStyle: options as HighlightStyle | undefined };

    this.highlighter = opts.highlighter ?? createHighlighter();
    this.defaultStyle = opts.defaultStyle ?? DEFAULT_HIGHLIGHT_STYLE;
    this.highlighter.setDefaultStyle(this.defaultStyle);
  }

  // ========== Highlighter 接口实现 ==========

  /**
   * 高亮 Range
   */
  highlight(range: Range, style?: HighlightStyle): string {
    const highlightId = this.highlighter.highlight(range, style);

    logSuccess('highlighter', 'Range高亮成功', {
      highlightId,
      text: range.toString().substring(0, 50) + '...',
    });

    return highlightId;
  }

  /**
   * 使用类型高亮 Range
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
   * 清除所有高亮
   */
  clearHighlight(): void {
    this.highlighter.clearHighlight();
    logDebug('highlighter', '所有高亮已清除');
  }

  /**
   * 清除指定 ID 的高亮
   */
  clearHighlightById(highlightId: string): void {
    this.highlighter.clearHighlightById(highlightId);
    logDebug('highlighter', `高亮已清除: ${highlightId}`);
  }

  /**
   * 清除指定类型的所有高亮
   */
  clearHighlightByType(type: string): void {
    this.highlighter.clearHighlightByType(type);
    logDebug('highlighter', `类型高亮已清除: ${type}`);
  }

  /**
   * 注册类型样式
   */
  registerTypeStyle(type: string, style: HighlightStyle): void {
    this.highlighter.registerTypeStyle(type, style);
    logInfo('highlighter', `注册类型样式: ${type}`, style);
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
   * 创建高亮样式字符串
   */
  createHighlightStyle(style: HighlightStyle): string {
    return this.highlighter.createHighlightStyle(style);
  }

  /**
   * 滚动到指定 Range 位置
   */
  scrollToRange(range: Range): void {
    this.highlighter.scrollToRange(range);
  }

  /**
   * 获取当前活跃高亮数量
   */
  getActiveHighlightCount(): number {
    return this.highlighter.getActiveHighlightCount();
  }

  /**
   * 检查是否有活跃高亮
   */
  hasActiveHighlights(): boolean {
    return this.highlighter.hasActiveHighlights();
  }

  /**
   * 销毁高亮器
   */
  destroy(): void {
    this.highlighter.destroy();
    logInfo('highlighter', '高亮器已销毁');
  }

  // ========== 扩展方法（非 Highlighter 接口） ==========

  /**
   * 获取底层高亮器实例
   *
   * 注意：此方法返回具体实现，可能破坏抽象。
   * 建议仅在需要访问底层特性时使用。
   */
  getHighlighter(): Highlighter {
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
}
