/**
 * 主要API接口类型定义
 */

import type {
  SerializedSelection,
  SerializedSelectionSimple,
  RestoreResult,
  SelectionStats,
  DebugLogEntry,
} from './core';
import type {
  SelectionRestoreOptions,
  HighlightStyle,
  SelectionTypeConfig,
} from './options';
import type { SelectionInteractionEvent } from './events';

// 主要API接口
export interface SelectionRestoreAPI {
  /** 序列化当前选区 */
  serialize(id?: string): Promise<SerializedSelection | null>;
  /** 恢复选区 */
  restore(data: SerializedSelection | string, clearPrevious?: boolean, autoScroll?: boolean): Promise<RestoreResult>;
  /** 恢复选区但不清除之前的高亮 */
  restoreWithoutClear(data: SerializedSelection | string, autoScroll?: boolean): Promise<RestoreResult>;
  /** 获取所有保存的选区 */
  getAllSelections(): Promise<SerializedSelection[]>;
  /** 删除选区 */
  deleteSelection(id: string): Promise<void>;
  /** 更新选区数据 */
  updateSelection(id: string, updates: Partial<SerializedSelection>): Promise<void>;
  /** 导入选区数据到 storage */
  importSelections(selections: SerializedSelection[]): Promise<{
    success: number;
    total: number;
    errors: string[];
  }>;
  /** 清空所有选区 */
  clearAllSelections(): Promise<void>;
  /** 获取统计信息 */
  getStats(): Promise<SelectionStats>;
  /** 设置高亮样式 */
  setHighlightStyle(style: HighlightStyle): void;
  /** 高亮当前选区 */
  highlightSelection(duration?: number): void;
  /** 批量高亮传入的选区数据（使用SDK范围验证） */
  highlightSelections(selections: SerializedSelection[], scrollToIndex?: number): Promise<{
    success: number;
    total: number;
    errors: string[];
    results: Array<{ id: string; success: boolean; layer?: number; layerName?: string; error?: string; }>
  }>;
  /** 批量高亮所有已保存的选区（使用SDK范围验证） */
  highlightAllSelections(scrollToIndex?: number): Promise<{ success: number; total: number; errors: string[] }>;
  /** 清除所有高亮 */
  clearHighlight(): void;
  /** 设置选区生效范围 */
  setEnabledContainers(containers: string[]): void;
  /** 设置选区豁免区域 */
  setDisabledContainers(containers: string[]): void;
  /** 添加生效容器 */
  addEnabledContainer(container: string): void;
  /** 移除生效容器 */
  removeEnabledContainer(container: string): void;
  /** 添加豁免容器 */
  addDisabledContainer(container: string): void;
  /** 移除豁免容器 */
  removeDisabledContainer(container: string): void;
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
  /** 根据文本高亮指定容器中的所有匹配文本 */
  highlightTextInContainers(
    text: string | string[],
    type: string,
    containers: string[],
    options?: {
      onInteraction?: (event: SelectionInteractionEvent, instance: any) => void;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxMatches?: number;
      /** 自定义过滤函数，可用于过滤掉与已有选区重叠的匹配项 */
      filterMatches?: (items: any[], keyword: string) => any[];
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
  getHighlighter(): import('../highlighter/css-highlighter').CSSBasedHighlighter;
  /** 检测指定坐标点的所有选区 */
  detectAllSelectionsAtPoint(x: number, y: number): Array<{
    selectionId: string;
    text: string;
    selectionData: SerializedSelection | null;
  }>;
  /** 获取所有保存的选区（精简版本） */
  getAllSelectionsSimple(): Promise<SerializedSelectionSimple[]>;
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
  /** 导出所有选区数据为 JSON 字符串 */
  exportData(): Promise<string>;
  /** 从 JSON 字符串导入选区数据 */
  importData(jsonData: string): Promise<number>;
  /** 设置配置选项 */
  setOptions(options: Partial<SelectionRestoreOptions>): void;
  /** 获取当前配置选项 */
  getOptions(): Required<SelectionRestoreOptions>;
  /** 销毁实例 */
  destroy(): void;
}
