/**
 * Highlighter 模块类型定义
 *
 * 渲染层，负责 DOM 高亮绘制
 * 只接收 Range，不关心来源
 */

/**
 * 高亮样式
 */
export interface HighlightStyle {
  /** 背景颜色 */
  backgroundColor?: string;
  /** 文字颜色 */
  color?: string;
  /** 文字装饰 */
  textDecoration?: string;
  /** 文字装饰样式 */
  textDecorationStyle?: string;
  /** 文字装饰颜色 */
  textDecorationColor?: string;
  /** 文字装饰粗细 */
  textDecorationThickness?: string;
  /** 下划线偏移 */
  textUnderlineOffset?: string;
  /** 文字阴影 */
  textShadow?: string;
  /** 字体粗细 */
  fontWeight?: string;
  /** 不透明度 */
  opacity?: number;
  /** 边框 */
  border?: string;
  /** 边框圆角 */
  borderRadius?: string;
  /** 内边距 */
  padding?: string;
  /** 盒阴影 */
  boxShadow?: string;
  /** 过渡效果 */
  transition?: string;
}

/**
 * 高亮事件类型
 */
export enum HighlightEventType {
  /** 高亮添加 */
  ADDED = 'added',
  /** 高亮移除 */
  REMOVED = 'removed',
  /** 高亮清除 */
  CLEARED = 'cleared',
  /** 样式变更 */
  STYLE_CHANGED = 'style_changed',
}

/**
 * 高亮事件数据
 */
export interface HighlightEventData {
  /** 事件类型 */
  type: HighlightEventType;
  /** 时间戳 */
  timestamp: number;
  /** 高亮 ID */
  highlightId?: string;
  /** 高亮类型 */
  highlightType?: string;
  /** Range */
  range?: Range;
}

/**
 * 高亮事件监听器
 */
export type HighlightEventListener = (data: HighlightEventData) => void;

/**
 * 高亮器配置选项
 */
export interface HighlighterOptions {
  /** 默认样式 */
  defaultStyle?: HighlightStyle;
}

/**
 * 高亮器接口
 */
export interface IHighlighter {
  /**
   * 高亮 Range
   * @param range - 要高亮的 Range
   * @param style - 可选的样式
   * @returns 高亮 ID
   */
  highlight(range: Range, style?: HighlightStyle): string;

  /**
   * 使用类型高亮 Range
   * @param range - 要高亮的 Range
   * @param type - 高亮类型
   * @param autoScroll - 是否自动滚动到选区位置
   * @returns 高亮 ID
   */
  highlightWithType(range: Range, type: string, autoScroll?: boolean): string;

  /**
   * 清除所有高亮
   */
  clearHighlight(): void;

  /**
   * 清除指定 ID 的高亮
   * @param highlightId - 高亮 ID
   */
  clearHighlightById(highlightId: string): void;

  /**
   * 清除指定类型的高亮
   * @param type - 高亮类型
   */
  clearHighlightByType(type: string): void;

  /**
   * 注册类型样式
   * @param type - 类型名称
   * @param style - 样式
   */
  registerTypeStyle(type: string, style: HighlightStyle): void;

  /**
   * 设置默认样式
   * @param style - 样式
   */
  setDefaultStyle(style: HighlightStyle): void;

  /**
   * 创建高亮样式字符串
   * @param style - 样式
   * @returns CSS 样式字符串
   */
  createHighlightStyle(style: HighlightStyle): string;

  /**
   * 滚动到 Range 位置
   * @param range - Range
   */
  scrollToRange(range: Range): void;

  /**
   * 获取活跃高亮数量
   */
  getActiveHighlightCount(): number;

  /**
   * 检查是否有活跃高亮
   */
  hasActiveHighlights(): boolean;

  /**
   * 销毁高亮器
   */
  destroy(): void;
}

/**
 * 支持事件的高亮器接口
 */
export interface IEventfulHighlighter extends IHighlighter {
  /**
   * 添加事件监听器
   * @param eventType - 事件类型
   * @param listener - 监听器
   */
  on(eventType: HighlightEventType, listener: HighlightEventListener): void;

  /**
   * 移除事件监听器
   * @param eventType - 事件类型
   * @param listener - 监听器
   */
  off(eventType: HighlightEventType, listener: HighlightEventListener): void;
}
