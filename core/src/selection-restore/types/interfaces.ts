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
import type { HighlightStyle } from './options';

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

// 高亮器接口
export interface Highlighter {
  /** 高亮选区，返回高亮ID */
  highlight(range: Range, style?: HighlightStyle): string;
  /** 支持类型和滚动控制的高亮选区方法 */
  highlightWithType?(range: Range, type: string, autoScroll?: boolean): string;
  /** 清除所有高亮 */
  clearHighlight(): void;
  /** 清除指定高亮 */
  clearHighlightById?(highlightId: string): void;
  /** 创建高亮样式 */
  createHighlightStyle(style: HighlightStyle): string;
  /** 滚动到指定范围位置 */
  scrollToRange?(range: Range): void;
}
