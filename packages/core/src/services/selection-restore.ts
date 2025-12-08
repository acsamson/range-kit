/**
 * Selection Restore 主类
 *
 * 职责：协调各模块，提供统一的 API 接口
 * 注意：组件构建由工厂负责，本类只负责协调
 */

import {
  SelectionRestoreAPI,
  SelectionRestoreOptions,
  SerializedSelection,
  RestoreResult,
  HighlightStyle,
  SelectionTypeConfig,
  SelectionInteractionEvent,
  SelectionInstance,
} from '../types';

import {
  SelectionValidator,
  SelectionSerializerWrapper,
  SelectionRestorer,
  SelectionHighlighter,
  SelectionText,
} from './wrappers';
import { SelectionSession } from '../session';

import {
  logInfo,
  debugLogger,
  type DebugLogEntry,
} from '../common/debug';

// 从工厂导入组件创建函数
import { createCoreComponents, mergeOptions, type CoreComponents } from './factories';

// 从 facade/helpers 导入助手模块
import {
  ConfigManager,
  TextHighlightManager,
  SelectionBehaviorMonitor,
} from './helpers';

// 导入 API 子模块
import * as CoreAPI from './api/core-api';
import * as BatchAPI from './api/batch-api';
import * as SelectionAPI from './api/selection-api';

// 简化的DebugLogEntry类型别名，用于API兼容性
type SimpleDebugLogEntry = DebugLogEntry;

/**
 * Selection Restore API 实现
 *
 * 设计说明：
 * - 本类是一个协调器（Coordinator），不负责组件构建
 * - 组件实例化由 factories/component-factory.ts 负责
 * - Kit 不内置存储功能，数据持久化由应用层负责
 * - 内部维护选区实例状态，用于交互检测和高亮管理
 */
export class SelectionRestore implements SelectionRestoreAPI {
  // 核心组件（由工厂创建）
  private validator: SelectionValidator;
  private serializer: SelectionSerializerWrapper;
  private restorer: SelectionRestorer;
  private highlighter: SelectionHighlighter;
  private textSearcher: SelectionText;
  private selectionManager: SelectionSession;

  // 配置
  private options: Required<SelectionRestoreOptions>;

  // 助手模块（在 initializeHelpers 中初始化）
  private configManager!: ConfigManager;
  private textHighlightManager!: TextHighlightManager;
  private selectionBehaviorMonitor!: SelectionBehaviorMonitor;

  constructor(options: SelectionRestoreOptions = {}) {
    // 1. 合并配置
    this.options = mergeOptions(options);

    // 2. 使用工厂创建核心组件
    const components = createCoreComponents(this.options);
    this.validator = components.validator;
    this.serializer = components.serializer;
    this.restorer = components.restorer;
    this.highlighter = components.highlighter;
    this.textSearcher = components.textSearcher;
    this.selectionManager = components.selectionManager;

    // 3. 初始化助手模块
    this.initializeHelpers();

    logInfo('api', 'Selection Restore API 已初始化', this.options);
  }

  /**
   * 初始化助手模块
   */
  private initializeHelpers(): void {
    this.configManager = new ConfigManager({
      validator: this.validator,
      restorer: this.restorer,
      options: this.options,
    });

    this.textHighlightManager = new TextHighlightManager({
      textSearcher: this.textSearcher,
      highlighter: this.highlighter,
      selectionManager: this.selectionManager,
    });

    this.selectionBehaviorMonitor = new SelectionBehaviorMonitor({
      rootNodeId: this.options.rootNodeId,
      onSelectionBehavior: this.options.onSelectionBehavior,
      getAllSelections: () => this.getAllSelections(),
      restoreRangeOnly: (data) => this.restoreRangeOnly(data),
      getActiveRange: (id) => this.selectionManager.getActiveRange(id),
      getAllActiveSelectionIds: () => this.selectionManager.getAllActiveSelectionIds(),
      getManagerSelections: () => this.selectionManager.getAllSelections(),
    });
    this.selectionBehaviorMonitor.initialize();
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

  /**
   * 从内存中移除选区实例
   * 同时清除其高亮和活跃 Range
   * @param selectionId - 选区ID
   */
  removeSelection(selectionId: string): void {
    this.selectionManager.removeSelection(selectionId);
    logInfo('api', '选区实例已移除', { selectionId });
  }

  // ========== 批量操作 API 方法 ==========

  async highlightSelections(
    selections: SerializedSelection[],
    scrollToIndex: number = -1,
  ): Promise<{
    success: number;
    total: number;
    errors: string[];
    results: Array<{ id: string; success: boolean; layer?: number; layerName?: string; error?: string }>;
  }> {
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
    SelectionAPI.setHighlightStyle(this.getSelectionAPIDeps(), style);
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
      onInteraction?: (event: SelectionInteractionEvent, instance: SelectionInstance) => void;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxMatches?: number;
      filterMatches?: (items: unknown[], keyword: string) => unknown[];
    } = {},
  ): Promise<{
    success: number;
    total: number;
    highlightIds: string[];
    errors: string[];
  }> {
    // 类型适配：将外部 API 类型转换为内部实现类型
    // TextHighlightOptions 使用更宽松的 HighlightInteractionEvent 类型
    return await this.textHighlightManager.highlightTextInContainers(
      text,
      type,
      containers,
      options as Parameters<typeof this.textHighlightManager.highlightTextInContainers>[3],
      this,
    );
  }

  clearTextHighlights(text?: string, containers?: string[]): void {
    this.textHighlightManager.clearTextHighlights(text, containers);
  }

  // ========== 配置管理方法 ==========

  setRootNodeId(rootNodeId: string | null): void {
    this.configManager.setRootNodeId(rootNodeId);
  }

  getRootNodeId(): string | undefined {
    return this.configManager.getRootNodeId();
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
