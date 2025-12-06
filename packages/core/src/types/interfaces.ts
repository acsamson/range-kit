/**
 * 接口类型定义 - 序列化器、恢复器、存储、高亮器
 */

import type {
  SerializedSelection,
  RestoreResult,
  SelectionStats,
  RestoreStatus,
  ContainerConfig,
} from './core';
// 从 styles.ts 导入，避免与 options.ts 的循环依赖
import type { HighlightStyle } from './styles';

// 恢复层级函数类型
export type RestoreLayerFunction = (
  data: SerializedSelection,
  containerConfig?: ContainerConfig,
) => Promise<boolean> | boolean;

// 序列化器接口
export interface Serializer {
  /** 序列化选区 */
  serialize(id?: string): SerializedSelection | null;
}

// 恢复器接口
export interface Restorer {
  /** 恢复选区 */
  restore(data: SerializedSelection | string): Promise<RestoreResult>;
}

// 存储接口
export interface Storage {
  /** 保存数据 */
  save(key: string, data: SerializedSelection): Promise<void>;
  /** 获取数据 */
  get(key: string): Promise<SerializedSelection | null>;
  /** 获取所有数据 */
  getAll(): Promise<SerializedSelection[]>;
  /** 删除数据 */
  delete(key: string): Promise<void>;
  /** 清空所有数据 */
  clear(): Promise<void>;
  /** 获取统计信息 */
  getStats(): Promise<SelectionStats>;
  /** 导出数据 */
  exportData?(): Promise<string>;
  /** 导入数据 */
  importData?(jsonData: string): Promise<number>;
  /** 关闭存储连接 */
  close?(): void;
}

/**
 * 高亮器接口
 *
 * 定义了高亮器的核心契约，支持多种实现方式：
 * - CSSBasedHighlighter: 基于 CSS Highlights API（推荐，不修改 DOM）
 * - FallbackHighlighter: 降级方案，使用 <mark> 标签
 *
 * 使用示例：
 * ```typescript
 * const highlighter: Highlighter = createHighlighter();
 * const id = highlighter.highlightWithType(range, 'comment', true);
 * highlighter.clearHighlightById(id);
 * ```
 */
export interface Highlighter {
  // ========== 核心高亮方法 ==========

  /** 使用默认样式高亮选区，返回高亮 ID */
  highlight(range: Range, style?: HighlightStyle): string;

  /** 使用指定类型高亮选区，返回高亮 ID */
  highlightWithType(range: Range, type: string, autoScroll?: boolean): string;

  // ========== 清除方法 ==========

  /** 清除所有高亮 */
  clearHighlight(): void;

  /** 清除指定 ID 的高亮 */
  clearHighlightById(highlightId: string): void;

  /** 清除指定类型的所有高亮 */
  clearHighlightByType(type: string): void;

  // ========== 样式管理 ==========

  /** 注册类型对应的高亮样式 */
  registerTypeStyle(type: string, style: HighlightStyle): void;

  /** 设置默认高亮样式 */
  setDefaultStyle(style: HighlightStyle): void;

  /** 创建高亮样式字符串（用于 CSS 规则） */
  createHighlightStyle(style: HighlightStyle): string;

  // ========== 导航和滚动 ==========

  /** 滚动到指定 Range 位置 */
  scrollToRange(range: Range): void;

  // ========== 状态查询 ==========

  /** 获取当前活跃高亮数量 */
  getActiveHighlightCount(): number;

  /** 检查是否有活跃高亮 */
  hasActiveHighlights(): boolean;

  // ========== 生命周期 ==========

  /** 销毁高亮器，清理资源 */
  destroy(): void;
}

/**
 * 高亮事件类型
 */
export enum HighlightEventType {
  /** 高亮被添加 */
  ADDED = 'highlight:added',
  /** 高亮被移除 */
  REMOVED = 'highlight:removed',
  /** 高亮样式变化 */
  STYLE_CHANGED = 'highlight:style-changed',
  /** 所有高亮被清除 */
  CLEARED = 'highlight:cleared',
}

/**
 * 高亮事件数据
 */
export interface HighlightEventData {
  /** 事件类型 */
  type: HighlightEventType;
  /** 高亮 ID（如适用） */
  highlightId?: string;
  /** 高亮类型（如适用） */
  highlightType?: string;
  /** Range 对象（如适用） */
  range?: Range;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 高亮事件监听器
 */
export type HighlightEventListener = (event: HighlightEventData) => void;

/**
 * 支持事件的高亮器接口（扩展基础接口）
 */
export interface EventfulHighlighter extends Highlighter {
  /** 添加事件监听器 */
  on(eventType: HighlightEventType, listener: HighlightEventListener): void;
  /** 移除事件监听器 */
  off(eventType: HighlightEventType, listener: HighlightEventListener): void;
}
