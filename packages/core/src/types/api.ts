/**
 * 主要API接口类型定义
 *
 * 无状态设计（Stateless）：
 * - Kit 只负责 Range <-> JSON 的转换和 DOM 操作
 * - 不包含内置存储功能，数据持久化由应用层负责
 */

import type {
  SerializedSelection,
  RestoreResult,
  DebugLogEntry,
} from './core';
import type {
  SelectionRestoreOptions,
  HighlightStyle,
  SelectionTypeConfig,
} from './options';
import type { SelectionInteractionEvent, SelectionInstance } from './events';

// 主要API接口（无状态设计）
export interface SelectionRestoreAPI {
  /** 序列化当前选区（不自动存储，由应用层决定存储方式） */
  serialize(id?: string): Promise<SerializedSelection | null>;
  /** 恢复选区（必须传入完整的 SerializedSelection 对象） */
  restore(data: SerializedSelection, clearPrevious?: boolean, autoScroll?: boolean): Promise<RestoreResult>;
  /** 恢复选区但不清除之前的高亮 */
  restoreWithoutClear(data: SerializedSelection, autoScroll?: boolean): Promise<RestoreResult>;
  /** 获取当前内存中活跃的选区（非持久化存储） */
  getAllSelections(): Promise<SerializedSelection[]>;
  /** 从内存中移除选区实例（同时清除其高亮和活跃 Range） */
  removeSelection(selectionId: string): void;
  /** 设置高亮样式 */
  setHighlightStyle(style: HighlightStyle): void;
  /** 高亮当前选区 */
  highlightSelection(duration?: number): void;
  /** 批量高亮传入的选区数据（使用Kit范围验证） */
  highlightSelections(selections: SerializedSelection[], scrollToIndex?: number): Promise<{
    success: number;
    total: number;
    errors: string[];
    results: Array<{ id: string; success: boolean; layer?: number; layerName?: string; error?: string; }>
  }>;
  /** 批量高亮所有已保存的选区（使用Kit范围验证） */
  highlightAllSelections(scrollToIndex?: number): Promise<{ success: number; total: number; errors: string[] }>;
  /** 清除所有高亮 */
  clearHighlight(): void;
  /** 设置算法检测的根节点ID */
  setRootNodeId(rootNodeId: string | null): void;
  /** 获取当前设置的根节点ID */
  getRootNodeId(): string | undefined;
  /** 获取调试日志 */
  getDebugLogs(): DebugLogEntry[];
  /** 根据分类获取调试日志 */
  getDebugLogsByCategory(category: string): DebugLogEntry[];
  /** 清空调试日志 */
  clearDebugLogs(): void;
  /** 订阅调试日志更新 */
  subscribeToDebugLogs(callback: (entry: DebugLogEntry) => void): () => void;
  /** 导出调试日志 */
  exportDebugLogs(): string;
  /**
   * 根据文本高亮指定容器中的所有匹配文本
   *
   * 注意：filterMatches 回调中的 items 类型为 SearchMatchItem[]，
   * 详见 facade/helpers/text-highlight-manager.ts
   */
  highlightTextInContainers(
    text: string | string[],
    type: string,
    containers: string[],
    options?: {
      onInteraction?: (event: SelectionInteractionEvent, instance: SelectionInstance) => void;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxMatches?: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 回调类型需与内部实现 SearchMatchItem 兼容
      filterMatches?: (items: unknown[], keyword: string) => unknown[];
    }
  ): Promise<{
    success: number;
    total: number;
    highlightIds: string[];
    errors: string[];
  }>;
  /** 清除指定容器中特定文本的高亮 */
  clearTextHighlights(text?: string, containers?: string[]): void;
  /** 获取当前选区信息 */
  getCurrentSelection(): {
    selection: Selection | null;
    range: Range | null;
    text: string;
    isValid: boolean;
    isEmpty: boolean;
  };
  /** 检查当前是否有有效选区 */
  hasValidSelection(): boolean;
  /** 获取当前选区的文本内容 */
  getCurrentSelectionText(): string;
  /** 获取当前选区的Range对象 */
  getCurrentSelectionRange(): Range | null;
  /** 获取高亮器实例（用于多选区高亮） */
  getHighlighter(): import('./interfaces').Highlighter;
  /** 检测指定坐标点的所有选区 */
  detectAllSelectionsAtPoint(x: number, y: number): Array<{
    selectionId: string;
    text: string;
    selectionData: SerializedSelection | null;
  }>;
  /** 注册新的选区类型 */
  registerSelectionType(config: SelectionTypeConfig): void;
  /** 获取已注册的选区类型配置 */
  getRegisteredType(type: string): SelectionTypeConfig | undefined;
  /** 获取所有注册的选区类型配置 */
  getAllRegisteredTypes(): SelectionTypeConfig[];
  /** 仅恢复 Range（不应用高亮） */
  restoreRangeOnly(data: SerializedSelection): Promise<RestoreResult>;
  /** 获取已注册的活跃 Range */
  getActiveRange(selectionId: string): Range | undefined;
  /** 获取所有活跃选区的 ID 列表 */
  getAllActiveSelectionIds(): string[];
  /** 批量高亮所有选区（不滚动） */
  highlightAllSelectionsWithoutScroll(): Promise<{ success: number; total: number; errors: string[] }>;
  /** 批量高亮所有选区（滚动到最后一个） */
  highlightAllSelectionsScrollToLast(): Promise<{ success: number; total: number; errors: string[] }>;
  /** 批量高亮所有选区（滚动到中间） */
  highlightAllSelectionsScrollToMiddle(): Promise<{ success: number; total: number; errors: string[] }>;
  /** 设置配置选项 */
  setOptions(options: Partial<SelectionRestoreOptions>): void;
  /** 获取当前配置选项 */
  getOptions(): Required<SelectionRestoreOptions>;
  /** 销毁实例 */
  destroy(): void;
}
