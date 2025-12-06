/**
 * Selection Restore 主入口
 * 负责初始化各模块并提供统一的 API 接口
 */

import {
  SelectionRestoreAPI,
  SelectionRestoreOptions,
  SerializedSelection,
  RestoreResult,
  HighlightStyle,
  SelectionTypeConfig,
} from './types';

import { SelectionValidator } from './core/selection-validator';
import { SelectionSerializerWrapper } from './core/selection-serializer';
import { SelectionRestorer } from './core/selection-restorer';
import { SelectionHighlighter, createHighlighter } from './core/selection-highlighter';
import { SelectionText } from './core/selection-text';
import { SelectionInstanceManager } from './manager/selection-instance-manager';

import {
  logInfo,
  debugLogger,
  type DebugLogEntry,
} from './debug/logger';

import { DEFAULT_OPTIONS } from '../constants';

import {
  ConfigManager,
  TextHighlightManager,
  SelectionBehaviorMonitor,
} from './helpers';

import { detectOverlappingSelections, detectRangeOverlap } from './helpers/overlap-detector';

// 导入 API 子模块
import * as CoreAPI from './api/core-api';
import * as BatchAPI from './api/batch-api';
import * as SelectionAPI from './api/selection-api';

// 导出重叠检测相关
export { detectOverlappingSelections, detectRangeOverlap };
export type { OverlappedRange } from './helpers/overlap-detector';

// 简化的DebugLogEntry类型别名，用于API兼容性
type SimpleDebugLogEntry = DebugLogEntry;

/**
 * Selection Restore API 实现
 *
 * 无状态设计（Stateless）：
 * - SDK 只负责 Range <-> JSON 的转换和 DOM 操作
 * - 不内置存储功能，数据持久化由应用层负责
 *
 * 工作流示例：
 * ```typescript
 * // 序列化：Range -> JSON
 * const json = await sdk.serialize();
 *
 * // 应用层存储（自行决定存储方式）
 * await myDatabase.save(json);
 *
 * // 恢复：JSON -> Range + 高亮
 * await sdk.restore(json);
 * ```
 */
export class SelectionRestore implements SelectionRestoreAPI {
  private validator: SelectionValidator;
  private serializer: SelectionSerializerWrapper;
  private restorer: SelectionRestorer;
  private highlighter: SelectionHighlighter;
  private textSearcher: SelectionText;
  private selectionManager: SelectionInstanceManager;
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

    // 不再初始化内置存储，遵循无状态设计

    // 依赖注入：优先使用用户提供的高亮器，否则创建默认高亮器
    if (this.options.highlighter) {
      // 用户提供了自定义高亮器，直接包装使用
      this.highlighter = new SelectionHighlighter({
        highlighter: this.options.highlighter,
        defaultStyle: this.options.highlightStyle,
      });
    } else {
      // 使用默认的 CSSBasedHighlighter
      this.highlighter = new SelectionHighlighter(this.options.highlightStyle);
    }

    this.textSearcher = new SelectionText();

    this.selectionManager = new SelectionInstanceManager(
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

    logInfo('api', 'Selection Restore API 已初始化（无状态模式）', this.options);
  }

  // ========== 获取依赖对象的私有方法 ==========

  private getCoreAPIDeps(): CoreAPI.CoreAPIDependencies {
    return {
      validator: this.validator,
      serializer: this.serializer,
      restorer: this.restorer,
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

  private getSelectionAPIDeps(): SelectionAPI.SelectionAPIDependencies {
    return {
      validator: this.validator,
      highlighter: this.highlighter,
      selectionManager: this.selectionManager,
    };
  }

  // ========== 核心 API 方法（无状态设计） ==========

  /**
   * 序列化当前选区为 JSON（不自动存储）
   * 应用层需要自行决定如何存储返回的数据
   */
  async serialize(id?: string): Promise<SerializedSelection | null> {
    return CoreAPI.serialize(this.getCoreAPIDeps(), id);
  }

  /**
   * 从 JSON 恢复选区并应用高亮
   * @param data - 序列化的选区数据（必须是完整的对象，不再支持通过 ID 查询）
   */
  async restore(
    data: SerializedSelection,
    clearPrevious: boolean = true,
    autoScroll: boolean = true,
  ): Promise<RestoreResult> {
    return CoreAPI.restore(this.getCoreAPIDeps(), data, clearPrevious, autoScroll);
  }

  /**
   * 恢复选区但不清除之前的高亮
   */
  async restoreWithoutClear(
    data: SerializedSelection,
    autoScroll: boolean = true,
  ): Promise<RestoreResult> {
    return CoreAPI.restoreWithoutClear(this.getCoreAPIDeps(), data, autoScroll);
  }

  /**
   * 纯恢复方法：只恢复选区并返回 Range，不应用高亮
   */
  async restoreRangeOnly(data: SerializedSelection): Promise<RestoreResult> {
    return CoreAPI.restoreRangeOnly(this.getCoreAPIDeps(), data);
  }

  // ========== 内存管理 API（非持久化存储） ==========
  // 这些方法操作的是内存中的选区实例，用于交互检测和高亮管理
  // 不是持久化存储，页面刷新后数据丢失

  /**
   * 获取所有当前活跃的选区数据（内存中的）
   */
  async getAllSelections(): Promise<SerializedSelection[]> {
    return this.selectionManager.getAllSelections();
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
    // 不再需要关闭存储，因为已移除内置存储
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
// 导出选区实例管理器
// 注意：不再导出 SelectionManager 别名，外层 SelectionManager 是用户侧唯一入口
export { SelectionInstanceManager } from './manager/selection-instance-manager';
export type { SelectionTypeConfig } from './types';
export type { SearchMatchItem, SearchMatchFilter } from './helpers/text-highlight-manager';
// storage 模块已移除，SDK 采用无状态设计，数据存储由应用层负责
export * from './core';
// ========== Highlighter 模块（可独立使用） ==========
// 用户可以只使用 Highlighter 而不依赖完整的 SelectionRestore
export {
  SelectionHighlighter,
  createHighlighter,
  type HighlighterOptions,
} from './core/selection-highlighter';

// CSSBasedHighlighter - 基于 CSS Highlights API 的高亮器实现
// 高级用户可直接使用此类，无需通过 SelectionHighlighter 包装
export {
  CSSBasedHighlighter,
  isHighlightSupported,
} from './highlighter/css-highlighter';
export { convertToSimple, convertSelectionsToSimple } from './utils';

// 导出性能统计模块
export {
  enableMetrics,
  disableMetrics,
  isMetricsEnabled,
  recordLayerAttempt,
  recordRestoreResult,
  getMetrics,
  resetMetrics,
  getMetricsReport,
  getLayerDistribution,
  type LayerMetrics,
  type RestoreMetrics,
  type LayerType,
} from './restorer/metrics';

// ========== Facade 模块（用户侧入口） ==========
export {
  SelectionManager,
  type SelectionManagerOptions,
  convertSelectionToRange,
  convertRangeToSelection,
  detectOverlappedRanges,
  checkRangeOverlap,
} from './facade';

// 默认导出
export default SelectionRestore;
