/**
 * 选区管理器内部类型定义
 *
 * 提供管理器模块间共享的类型接口
 */

import { SelectionRestoreOptions, SelectionTypeConfig, HighlightStyle, Highlighter } from '../types';

/**
 * 性能优化：缓存的Range边界信息
 */
export interface CachedRangeInfo {
  /** 选区ID */
  id: string;
  /** Range对象 */
  range: Range;
  /** 客户端矩形列表 */
  rects: DOMRectList;
  /** 最后更新时间戳 */
  lastUpdated: number;
  /** 总边界矩形，用于快速排除检测 */
  boundingRect: DOMRect;
}

/**
 * 性能配置常量
 */
export const PERFORMANCE_CONFIG = {
  /** 缓存过期时间（毫秒） */
  CACHE_EXPIRE_TIME: 3000,
  /** 鼠标移动防抖间隔（约60fps） */
  MOUSE_MOVE_DEBOUNCE: 16,
  /** 检测节流间隔 */
  DETECTION_THROTTLE: 50,
  /** 最大缓存数量 */
  MAX_CACHE_SIZE: 50,
} as const;

/**
 * 活跃Range变化事件数据
 */
export interface ActiveRangesChangeData {
  /** 当前活跃Range数量 */
  count: number;
  /** 活跃Range的ID列表 */
  ids: string[];
}

/**
 * 选区管理器上下文
 * 提供各模块间共享的状态和依赖
 */
export interface SelectionManagerContext {
  /** 高亮器实例（接口类型，支持依赖注入） */
  highlighter: Highlighter;
  /** 配置选项 */
  options: Required<SelectionRestoreOptions>;
  /** 已注册的类型配置映射 */
  registeredTypes: Map<string, SelectionTypeConfig>;
  /** 选区高亮ID映射 */
  selectionHighlights: Map<string, string>;
  /** 获取类型对应的样式 */
  getStyleForType: (type: string) => HighlightStyle;
  /** 清除选区高亮 */
  clearSelectionHighlight: (id: string) => void;
}

/**
 * 检测到的选区信息
 */
export interface DetectedSelectionInfo {
  /** 选区ID */
  selectionId: string;
  /** 选区文本 */
  text: string;
  /** 序列化的选区数据 */
  selectionData: import('../types').SerializedSelection;
}
