/**
 * Selection Restore 主入口
 * 负责初始化各模块并提供统一的 API 接口
 */

import {
  SelectionRestoreAPI,
  SelectionRestoreOptions,
  SerializedSelection,
  SerializedSelectionSimple,
  RestoreResult,
  SelectionStats,
  HighlightStyle,
  SelectionTypeConfig,
} from './types';

import { SelectionValidator } from './core/selection-validator';
import { SelectionSerializerWrapper } from './core/selection-serializer';
import { SelectionRestorer } from './core/selection-restorer';
import { SelectionStorage } from './core/selection-storage';
import { SelectionHighlighter } from './core/selection-highlighter';
import { SelectionText } from './core/selection-text';
import { SelectionManager } from './manager/selection-manager';

import {
  logInfo,
  debugLogger,
  type DebugLogEntry,
} from './debug/logger';

import { DEFAULT_OPTIONS } from './constants';

import {
  ConfigManager,
  TextHighlightManager,
  SelectionBehaviorMonitor,
} from './helpers';

import { detectOverlappingSelections, detectRangeOverlap } from './helpers/overlap-detector';

// 导入 API 子模块
import * as CoreAPI from './api/core-api';
import * as BatchAPI from './api/batch-api';
import * as StorageAPI from './api/storage-api';
import * as SelectionAPI from './api/selection-api';

// 导出重叠检测相关
export { detectOverlappingSelections, detectRangeOverlap };
export type { OverlappedRange } from './helpers/overlap-detector';

// 简化的DebugLogEntry类型别名，用于API兼容性
type SimpleDebugLogEntry = DebugLogEntry;

/**
 * 主要的Selection Restore API实现
 */
export class SelectionRestore implements SelectionRestoreAPI {
  private validator: SelectionValidator;
  private serializer: SelectionSerializerWrapper;
  private restorer: SelectionRestorer;
  private storage: SelectionStorage;
  private highlighter: SelectionHighlighter;
  private textSearcher: SelectionText;
  private selectionManager: SelectionManager;
  private options: Required<SelectionRestoreOptions>;

  // 助手模块
  private configManager: ConfigManager;
  private textHighlightManager: TextHighlightManager;
  private selectionBehaviorMonitor: SelectionBehaviorMonitor;

  constructor(options: SelectionRestoreOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      onSelectionChange: options.onSelectionChange,
      onSelectionInteraction: options.onSelectionInteraction,
      onSelectionComplete: options.onSelectionComplete,
      onSelectionBehavior: options.onSelectionBehavior,
    } as Required<SelectionRestoreOptions>;

    // 初始化核心模块
    this.validator = new SelectionValidator({
      enabledContainers: this.options.enabledContainers,
      disabledContainers: this.options.disabledContainers,
      rootNodeId: this.options.rootNodeId,
    });

    this.serializer = new SelectionSerializerWrapper({
      contextLength: this.options.contextLength,
    });

    this.restorer = new SelectionRestorer({
      enabledContainers: this.options.enabledContainers,
      disabledContainers: this.options.disabledContainers,
      rootNodeId: this.options.rootNodeId,
    });

    this.storage = new SelectionStorage({
      storage: this.options.storage,
    });

    this.highlighter = new SelectionHighlighter(this.options.highlightStyle);
    this.textSearcher = new SelectionText();

    this.selectionManager = new SelectionManager(
      this.highlighter.getHighlighter(),
      this.options,
    );

    // 初始化助手模块
    this.configManager = new ConfigManager({
      validator: this.validator,
      restorer: this.restorer,
      serializer: this.serializer,
      options: this.options,
      setHighlightStyleFn: (style) => this.setHighlightStyle(style),
    });

    this.textHighlightManager = new TextHighlightManager({
      textSearcher: this.textSearcher,
      highlighter: this.highlighter,
      selectionManager: this.selectionManager,
    });

    this.selectionBehaviorMonitor = new SelectionBehaviorMonitor({
      enabledContainers: this.options.enabledContainers,
      onSelectionBehavior: this.options.onSelectionBehavior,
      getAllSelections: () => this.getAllSelections(),
      restoreRangeOnly: (data) => this.restoreRangeOnly(data),
      getActiveRange: (id) => this.selectionManager.getActiveRange(id),
      getAllActiveSelectionIds: () => this.selectionManager.getAllActiveSelectionIds(),
      getManagerSelections: () => this.selectionManager.getAllSelections(),
    });
    this.selectionBehaviorMonitor.initialize();

    logInfo('api', 'Selection Restore API 已初始化', this.options);
  }

  // ========== 获取依赖对象的私有方法 ==========

  private getCoreAPIDeps(): CoreAPI.CoreAPIDependencies {
    return {
      validator: this.validator,
      serializer: this.serializer,
      restorer: this.restorer,
      storage: this.storage,
      highlighter: this.highlighter,
      selectionManager: this.selectionManager,
      options: this.options,
      getRegisteredType: (type) => this.getRegisteredType(type),
    };
  }

  private getBatchAPIDeps(): BatchAPI.BatchAPIDependencies {
    return {
      validator: this.validator,
      restorer: this.restorer,
      highlighter: this.highlighter,
      selectionManager: this.selectionManager,
      options: this.options,
      getRegisteredType: (type) => this.getRegisteredType(type),
      getAllSelections: () => this.getAllSelections(),
    };
  }

  private getStorageAPIDeps(): StorageAPI.StorageAPIDependencies {
    return {
      storage: this.storage,
      selectionManager: this.selectionManager,
    };
  }

  private getSelectionAPIDeps(): SelectionAPI.SelectionAPIDependencies {
    return {
      validator: this.validator,
      highlighter: this.highlighter,
      selectionManager: this.selectionManager,
    };
  }

  // ========== 核心 API 方法 ==========

  async serialize(id?: string): Promise<SerializedSelection | null> {
    return CoreAPI.serialize(this.getCoreAPIDeps(), id);
  }

  async restore(
    data: SerializedSelection | string,
    clearPrevious: boolean = true,
    autoScroll: boolean = true,
  ): Promise<RestoreResult> {
    return CoreAPI.restore(this.getCoreAPIDeps(), data, clearPrevious, autoScroll);
  }

  async restoreWithoutClear(
    data: SerializedSelection | string,
    autoScroll: boolean = true,
  ): Promise<RestoreResult> {
    return CoreAPI.restoreWithoutClear(this.getCoreAPIDeps(), data, autoScroll);
  }

  async restoreRangeOnly(data: SerializedSelection): Promise<RestoreResult> {
    return CoreAPI.restoreRangeOnly(this.getCoreAPIDeps(), data);
  }

  // ========== 存储 API 方法 ==========

  async getAllSelections(): Promise<SerializedSelection[]> {
    return StorageAPI.getAllSelections(this.getStorageAPIDeps());
  }

  async getAllSelectionsSimple(): Promise<SerializedSelectionSimple[]> {
    return StorageAPI.getAllSelectionsSimple(this.getStorageAPIDeps());
  }

  async deleteSelection(id: string): Promise<void> {
    return StorageAPI.deleteSelection(this.getStorageAPIDeps(), id);
  }

  async clearAllSelections(): Promise<void> {
    return StorageAPI.clearAllSelections(this.getStorageAPIDeps());
  }

  async updateSelection(id: string, updates: Partial<SerializedSelection>): Promise<void> {
    return StorageAPI.updateSelection(this.getStorageAPIDeps(), id, updates);
  }

  async importSelections(selections: SerializedSelection[]): Promise<{
    success: number;
    total: number;
    errors: string[];
  }> {
    return StorageAPI.importSelections(this.getStorageAPIDeps(), selections);
  }

  async getStats(): Promise<SelectionStats> {
    return StorageAPI.getStats(this.getStorageAPIDeps());
  }

  async exportData(): Promise<string> {
    return StorageAPI.exportData(this.getStorageAPIDeps());
  }

  async importData(jsonData: string): Promise<number> {
    return StorageAPI.importData(this.getStorageAPIDeps(), jsonData);
  }

  async cleanupOldData(maxAgeInDays: number = 30): Promise<number> {
    return StorageAPI.cleanupOldData(this.getStorageAPIDeps(), maxAgeInDays);
  }

  async getCurrentPageStats(): Promise<SelectionStats> {
    return StorageAPI.getCurrentPageStats(this.getStorageAPIDeps());
  }

  // ========== 批量操作 API 方法 ==========

  async highlightSelections(
    selections: SerializedSelection[],
    scrollToIndex: number = -1,
  ): Promise<any> {
    return BatchAPI.highlightSelections(this.getBatchAPIDeps(), selections, scrollToIndex);
  }

  async highlightAllSelections(
    scrollToIndex: number = -1,
  ): Promise<{ success: number; total: number; errors: string[] }> {
    return BatchAPI.highlightAllSelections(this.getBatchAPIDeps(), scrollToIndex);
  }

  async highlightAllSelectionsWithoutScroll(): Promise<{ success: number; total: number; errors: string[] }> {
    return BatchAPI.highlightAllSelectionsWithoutScroll(this.getBatchAPIDeps());
  }

  async highlightAllSelectionsScrollToLast(): Promise<{ success: number; total: number; errors: string[] }> {
    return BatchAPI.highlightAllSelectionsScrollToLast(this.getBatchAPIDeps());
  }

  async highlightAllSelectionsScrollToMiddle(): Promise<{ success: number; total: number; errors: string[] }> {
    return BatchAPI.highlightAllSelectionsScrollToMiddle(this.getBatchAPIDeps());
  }

  // ========== 选区操作 API 方法 ==========

  setHighlightStyle(style: HighlightStyle): void {
    SelectionAPI.setHighlightStyle(this.getSelectionAPIDeps(), style, this.options);
  }

  highlightSelection(duration: number = 3000): void {
    SelectionAPI.highlightSelection(this.getSelectionAPIDeps(), duration);
  }

  clearHighlight(): void {
    SelectionAPI.clearHighlight(this.getSelectionAPIDeps());
  }

  detectAllSelectionsAtPoint(x: number, y: number): Array<{
    selectionId: string;
    text: string;
    selectionData: SerializedSelection;
  }> {
    return SelectionAPI.detectAllSelectionsAtPoint(this.getSelectionAPIDeps(), x, y);
  }

  getActiveRange(selectionId: string): Range | undefined {
    return SelectionAPI.getActiveRange(this.getSelectionAPIDeps(), selectionId);
  }

  getAllActiveSelectionIds(): string[] {
    return SelectionAPI.getAllActiveSelectionIds(this.getSelectionAPIDeps());
  }

  registerSelectionType(config: SelectionTypeConfig): void {
    SelectionAPI.registerSelectionType(this.getSelectionAPIDeps(), config);
  }

  getRegisteredType(type: string): SelectionTypeConfig | undefined {
    return SelectionAPI.getRegisteredType(this.getSelectionAPIDeps(), type);
  }

  getAllRegisteredTypes(): SelectionTypeConfig[] {
    return SelectionAPI.getAllRegisteredTypes(this.getSelectionAPIDeps());
  }

  getCurrentSelection(): {
    selection: Selection | null;
    range: Range | null;
    text: string;
    isValid: boolean;
    isEmpty: boolean;
  } {
    return SelectionAPI.getCurrentSelection(this.getSelectionAPIDeps());
  }

  hasValidSelection(): boolean {
    return SelectionAPI.hasValidSelection(this.getSelectionAPIDeps());
  }

  getCurrentSelectionText(): string {
    return SelectionAPI.getCurrentSelectionText(this.getSelectionAPIDeps());
  }

  getCurrentSelectionRange(): Range | null {
    return SelectionAPI.getCurrentSelectionRange(this.getSelectionAPIDeps());
  }

  getHighlighter() {
    return SelectionAPI.getHighlighter(this.getSelectionAPIDeps());
  }

  // ========== 文本高亮方法 ==========

  async highlightTextInContainers(
    text: string | string[],
    type: string,
    containers: string[],
    options: {
      onInteraction?: (event: any, instance: any) => void;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxMatches?: number;
      filterMatches?: (items: any[], keyword: string) => any[];
    } = {},
  ): Promise<any> {
    return await this.textHighlightManager.highlightTextInContainers(
      text,
      type,
      containers,
      options,
      this,
    );
  }

  clearTextHighlights(text?: string, containers?: string[]): void {
    this.textHighlightManager.clearTextHighlights(text, containers);
  }

  // ========== 配置管理方法 ==========

  setEnabledContainers(containers: string[]): void {
    this.configManager.setEnabledContainers(containers);
  }

  setDisabledContainers(containers: string[]): void {
    this.configManager.setDisabledContainers(containers);
  }

  setRootNodeId(rootNodeId: string | null): void {
    this.configManager.setRootNodeId(rootNodeId);
  }

  getRootNodeId(): string | undefined {
    return this.configManager.getRootNodeId();
  }

  addEnabledContainer(container: string): void {
    this.configManager.addEnabledContainer(container);
  }

  removeEnabledContainer(container: string): void {
    this.configManager.removeEnabledContainer(container);
  }

  addDisabledContainer(container: string): void {
    this.configManager.addDisabledContainer(container);
  }

  removeDisabledContainer(container: string): void {
    this.configManager.removeDisabledContainer(container);
  }

  setOptions(options: Partial<SelectionRestoreOptions>): void {
    this.configManager.setOptions(options);
  }

  getOptions(): Required<SelectionRestoreOptions> {
    return this.configManager.getOptions();
  }

  // ========== 调试日志方法 ==========

  getDebugLogs(): SimpleDebugLogEntry[] {
    return debugLogger.getLogs();
  }

  getDebugLogsByCategory(category: string): SimpleDebugLogEntry[] {
    return debugLogger.getLogsByCategory(category);
  }

  clearDebugLogs(): void {
    debugLogger.clear();
  }

  subscribeToDebugLogs(callback: (entry: SimpleDebugLogEntry) => void): () => void {
    return debugLogger.subscribe(callback);
  }

  exportDebugLogs(): string {
    return debugLogger.exportLogs();
  }

  // ========== 销毁方法 ==========

  destroy(): void {
    this.selectionBehaviorMonitor.destroy();
    this.textHighlightManager.destroy();
    this.highlighter.destroy();
    this.storage.close();
    logInfo('api', 'Selection Restore API 已销毁');
  }
}

/**
 * 创建Selection Restore实例
 */
export function createSelectionRestore(options?: SelectionRestoreOptions): SelectionRestore {
  return new SelectionRestore(options);
}

/**
 * 默认实例（单例模式）
 */
let defaultInstance: SelectionRestore | null = null;

/**
 * 获取默认实例
 */
export function getDefaultInstance(options?: SelectionRestoreOptions): SelectionRestore {
  if (!defaultInstance) {
    defaultInstance = new SelectionRestore(options);
  }
  return defaultInstance;
}

// 导出类型和工具函数
export * from './types';
export {
  createSerializer,
  setCustomIdConfig,
} from './serializer/serializer';
export { restoreSelection } from './restorer/restorer';
export { SelectionManager } from './manager/selection-manager';
export type { SelectionTypeConfig } from './types';
export type { SearchMatchItem, SearchMatchFilter } from './helpers/text-highlight-manager';
export * from './storage';
export * from './core';
export { convertToSimple, convertSelectionsToSimple } from './utils';

// 默认导出
export default SelectionRestore;
