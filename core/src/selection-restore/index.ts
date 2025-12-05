import {
  SelectionRestoreAPI,
  SelectionRestoreOptions,
  SerializedSelection,
  SerializedSelectionSimple,
  RestoreResult,
  SelectionStats,
  HighlightStyle,
  SelectionTypeConfig,
  SelectionContextChangeCallback,
  SelectionBehaviorEvent,
  SelectionBehaviorType,
} from './types';

import { SelectionValidator } from './core/selection-validator';
import { SelectionSerializerWrapper } from './core/selection-serializer';
import { SelectionRestorer } from './core/selection-restorer';
import { SelectionStorage } from './core/selection-storage';
import { SelectionHighlighter } from './core/selection-highlighter';
import { SelectionText } from './core/selection-text';
import { SelectionContext } from './core/selection-context';
import { SelectionManager } from './manager/selection-manager';

import {
  logInfo,
  logWarn,
  logError,
  logSuccess,
  debugLogger,
  type DebugLogEntry,
} from './debug/logger';

import { DEFAULT_OPTIONS } from './constants';

// 导入助手模块
import {
  ConfigManager,
  TextHighlightManager,
  MonitoringManager,
  SelectionBehaviorMonitor,
  highlightSelections,
  highlightAllSelections,
  highlightAllSelectionsWithoutScroll,
  highlightAllSelectionsScrollToLast,
  highlightAllSelectionsScrollToMiddle,
} from './helpers';

import { detectOverlappingSelections, detectRangeOverlap } from './helpers/overlap-detector';
export { detectOverlappingSelections, detectRangeOverlap };
export type { OverlappedRange } from './helpers/overlap-detector';

// 导入工具函数
import { convertToSimple, convertSelectionsToSimple } from './utils';

// 简化的DebugLogEntry类型别名，用于API兼容性
type SimpleDebugLogEntry = DebugLogEntry;

/**
 * 主要的Selection Restore API实现（拆分重构版）
 */
export class SelectionRestore implements SelectionRestoreAPI {
  private validator: SelectionValidator;
  private serializer: SelectionSerializerWrapper;
  private restorer: SelectionRestorer;
  private storage: SelectionStorage;
  private highlighter: SelectionHighlighter;
  private textSearcher: SelectionText;
  private context: SelectionContext;
  private selectionManager: SelectionManager;
  private options: Required<SelectionRestoreOptions>;

  // 助手模块
  private configManager: ConfigManager;
  private textHighlightManager: TextHighlightManager;
  private monitoringManager: MonitoringManager;
  private selectionBehaviorMonitor: SelectionBehaviorMonitor;

  constructor(options: SelectionRestoreOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      // 移除强制默认空函数，允许为 undefined
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
    this.context = new SelectionContext({
      enableContextChangeMonitoring: this.options.enableContextChangeMonitoring,
      contextChangeStrategy: this.options.contextChangeStrategy,
      contextChangeDetectionInterval: this.options.contextChangeDetectionInterval,
      enableDOMChangeMonitoring: this.options.enableDOMChangeMonitoring,
      domChangeTargetContainers: this.options.domChangeTargetContainers,
      onSelectionContextChange: this.options.onSelectionContextChange,
    });

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

    this.monitoringManager = new MonitoringManager({
      context: this.context,
    });

    // 初始化选区行为监控器
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

    logInfo('api', 'Selection Restore API 已初始化（拆分重构版）', this.options);
  }

  /**
   * 序列化当前选区并保存
   */
  async serialize(id?: string): Promise<SerializedSelection | null> {
    try {
      const selection = window.getSelection();

      if (!this.validator.isSelectionInValidRange(selection)) {
        logInfo('serializer', '选区不在有效范围内，跳过序列化');
        return null;
      }

      const serialized = this.serializer.serialize(id);
      if (!serialized) {
        return null;
      }

      await this.storage.save(serialized);

      // 如果启用了上下文变化监听，开始监听此选区
      if (this.options.enableContextChangeMonitoring) {
        await this.context.startMonitoring(serialized.id, serialized);
      }

      return serialized;
    } catch (error) {
      logError('serializer', '序列化选区时发生错误', error);
      return null;
    }
  }

  /**
   * 恢复选区
   */
  async restore(
    data: SerializedSelection | string,
    clearPrevious: boolean = true,
    autoScroll: boolean = true,
  ): Promise<RestoreResult> {
    try {
      let selectionData: SerializedSelection;

      if (typeof data === 'string') {
        const stored = await this.storage.get(data);
        if (!stored) {
          return {
            success: false,
            layer: 0,
            layerName: '数据不存在',
            error: `找不到ID为 ${data} 的选区数据`,
            restoreTime: 0,
          };
        }
        selectionData = stored;
      } else {
        selectionData = data;
      }

      if (clearPrevious) {
        this.highlighter.clearHighlight();
      }

      const result = await this.restorer.restore(selectionData);

      // 验证恢复的Range是否在有效范围内
      if (result.success && result.range) {
        if (!this.validator.isRangeInValidScope(result.range)) {
          logWarn('restorer', '恢复的选区不在有效范围内，跳过应用');
          return {
            success: false,
            layer: 0,
            layerName: '验证失败',
            error: '恢复的选区不在有效容器范围内',
            restoreTime: 0,
          };
        }
      }

      if (result.success && result.range) {
        // 获取选区类型
        const selectionType = selectionData.type || this.options.defaultSelectionType || 'default';

        // 注册类型样式
        if (selectionType !== 'default') {
          const typeConfig = this.getRegisteredType(selectionType);
          if (typeConfig?.style) {
            this.highlighter.registerTypeStyle(selectionType, typeConfig.style);
          }
        }

        // 应用高亮并获取 highlightId
        const highlightId = this.highlighter.highlightWithType(result.range, selectionType, autoScroll);

        // 在SelectionManager中创建选区实例
        const instance = this.selectionManager.addSelection(selectionData);
        (instance as { currentRange?: Range }).currentRange = result.range;
        this.selectionManager.registerActiveRange(selectionData.id, result.range);

        // 设置 selectionHighlights 映射，用于后续删除单个高亮
        if (highlightId) {
          this.selectionManager.selectionHighlights.set(selectionData.id, highlightId);
        }

        // 更新成功层级信息
        const updatedSelection: SerializedSelection = {
          ...selectionData,
          successLayer: result.layer,
          successLayerName: result.layerName,
        };
        await this.storage.save(updatedSelection);
      }

      return result;
    } catch (error) {
      logError('restorer', '恢复选区时发生错误', error);
      return {
        success: false,
        layer: 0,
        layerName: '恢复失败',
        error: error instanceof Error ? error.message : '未知错误',
        restoreTime: 0,
      };
    }
  }

  /**
   * 获取所有保存的选区
   */
  async getAllSelections(): Promise<SerializedSelection[]> {
    return await this.storage.getAll();
  }

  /**
   * 获取所有保存的选区（精简版本）
   * 只包含恢复算法需要的核心字段，适合传给后端保存
   */
  async getAllSelectionsSimple(): Promise<SerializedSelectionSimple[]> {
    const selections = await this.storage.getAll();
    return selections.map(convertToSimple);
  }

  /**
   * 删除选区
   */
  async deleteSelection(id: string): Promise<void> {
    try {
      this.selectionManager.removeSelection(id);
      this.context.stopMonitoring(id);
      await this.storage.delete(id);
      logSuccess('api', `选区已删除: ${id}`);
    } catch (error) {
      logError('api', '删除选区时发生错误', error);
      throw error;
    }
  }

  /**
   * 清空所有选区
   */
  async clearAllSelections(): Promise<void> {
    try {
      const allSelections = await this.selectionManager.getAllSelections();
      for (const selection of allSelections) {
        this.selectionManager.removeSelection(selection.id);
      }
      await this.storage.clear();
      logSuccess('api', '所有选区已清空');
    } catch (error) {
      logError('api', '清空选区时发生错误', error);
      throw error;
    }
  }

  /**
   * 更新选区数据
   */
  async updateSelection(id: string, updates: Partial<SerializedSelection>): Promise<void> {
    try {
      const existing = await this.storage.get(id);
      if (!existing) {
        throw new Error(`找不到ID为 ${id} 的选区数据`);
      }

      const updated = { ...existing, ...updates };
      await this.storage.save(updated);
      logSuccess('api', `选区已更新: ${id}`);
    } catch (error) {
      logError('api', '更新选区时发生错误', error);
      throw error;
    }
  }

  /**
   * 导入选区数据到 storage
   * 用于批量导入外部选区数据（如从后端获取的数据）
   * @param selections 要导入的选区数据数组
   * @returns 导入结果
   */
  async importSelections(selections: SerializedSelection[]): Promise<{
    success: number;
    total: number;
    errors: string[];
  }> {
    const result = {
      success: 0,
      total: selections.length,
      errors: [] as string[]
    };

    for (const selection of selections) {
      try {
        await this.storage.save(selection);
        result.success++;
      } catch (error) {
        const errorMsg = `导入选区 ${selection.id} 失败: ${error}`;
        result.errors.push(errorMsg);
        logError('api', errorMsg);
      }
    }

    logSuccess('api', `选区导入完成: ${result.success}/${result.total}`);
    return result;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<SelectionStats> {
    return await this.storage.getStats();
  }

  /**
   * 设置高亮样式
   */
  setHighlightStyle(style: HighlightStyle): void {
    this.options.highlightStyle = { ...this.options.highlightStyle, ...style };
    this.highlighter.setDefaultStyle(this.options.highlightStyle);
  }

  /**
   * 高亮当前选区
   */
  highlightSelection(duration: number = 3000): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        this.highlighter.highlight(range);

        if (duration > 0) {
          setTimeout(() => {
            this.highlighter.clearHighlight();
          }, duration);
        }
      }
    }
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    this.highlighter.clearHighlight();
    this.selectionManager.clearAllActiveRanges();
  }

  /**
   * 恢复选区但不清除之前的高亮
   */
  async restoreWithoutClear(
    data: SerializedSelection | string,
    autoScroll: boolean = true,
  ): Promise<RestoreResult> {
    return this.restore(data, false, autoScroll);
  }

  /**
   * 纯恢复方法：只恢复选区并返回Range
   */
  async restoreRangeOnly(data: SerializedSelection): Promise<RestoreResult> {
    return await this.restorer.restoreRangeOnly(data);
  }

  /**
   * 检测指定坐标点的所有选区（返回所有重叠的选区）
   * 用于点击时获取该位置的所有重叠选区
   * @param x - 点击的 X 坐标
   * @param y - 点击的 Y 坐标
   * @returns 包含该点的所有选区信息数组
   */
  detectAllSelectionsAtPoint(x: number, y: number): Array<{
    selectionId: string;
    text: string;
    selectionData: SerializedSelection;
  }> {
    return this.selectionManager.detectAllSelectionsAtPoint(x, y);
  }

  /**
   * 获取指定选区的活跃 Range 对象
   * 用于高亮导航等需要操作 Range 的场景
   * @param selectionId - 选区 ID
   * @returns Range 对象（克隆），如果不存在则返回 undefined
   */
  getActiveRange(selectionId: string): Range | undefined {
    return this.selectionManager.getActiveRange(selectionId);
  }

  /**
   * 获取所有活跃选区的 ID 列表
   * @returns 选区 ID 数组
   */
  getAllActiveSelectionIds(): string[] {
    return this.selectionManager.getAllActiveSelectionIds();
  }

  // ========== 批量操作方法（委托给助手模块） ==========

  /**
   * 批量高亮选区
   */
  async highlightSelections(
    selections: SerializedSelection[],
    scrollToIndex: number = -1,
  ): Promise<any> {
    // 在高亮之前，先确保所有用到的类型样式都已注册
    const usedTypes = new Set<string>();
    for (const selection of selections) {
      const selectionType = selection.type || 'default';
      usedTypes.add(selectionType);
    }

    // 注册所有用到的类型样式
    for (const type of usedTypes) {
      if (type !== 'default') {
        const typeConfig = this.getRegisteredType(type);
        if (typeConfig?.style) {
          this.highlighter.registerTypeStyle(type, typeConfig.style);
        }
      }
    }

    this.selectionManager.clearAllActiveRanges();

    const result = await highlightSelections(selections, scrollToIndex, {
      validator: this.validator,
      restorer: this.restorer,
      highlighter: this.highlighter,
    });

    // 注册成功恢复的选区到Selection Manager以支持事件交互
    if (result.rangeInfos) {
      for (const rangeInfo of result.rangeInfos) {
        const { selection, range, highlightId } = rangeInfo;

        // 添加选区实例
        const instance = this.selectionManager.addSelection(selection);

        // 直接使用已恢复的Range注册事件支持
        this.selectionManager.registerActiveRange(selection.id, range);

        // 设置 selectionHighlights 映射，用于后续删除单个高亮
        if (highlightId) {
          this.selectionManager.selectionHighlights.set(selection.id, highlightId);
        }

        logInfo('batch-highlight', `选区事件支持已启用: ${selection.id}`, {
          layer: rangeInfo.layer,
          layerName: rangeInfo.layerName,
          highlightId
        });
      }
    } else {
      // 降级方案：如果没有rangeInfos，使用原来的逻辑
      logWarn('batch-highlight', '未获取到Range信息，使用降级方案');
      for (const resultItem of result.results) {
        if (resultItem.success) {
          const selection = selections.find(s => s.id === resultItem.id);
          if (selection) {
            // 添加选区实例
            const instance = this.selectionManager.addSelection(selection);

            // 如果结果中包含Range，直接使用
            if (resultItem.range) {
              this.selectionManager.registerActiveRange(selection.id, resultItem.range);
              logInfo('batch-highlight', `选区事件支持已启用(降级): ${selection.id}`);
            } else {
              // 最后的降级方案：重新恢复Range
              try {
                const restoreResult = await this.restorer.restoreRangeOnly(selection);
                if (restoreResult.success && restoreResult.range) {
                  this.selectionManager.registerActiveRange(selection.id, restoreResult.range);
                  logWarn('batch-highlight', `选区事件支持已启用(重新恢复): ${selection.id}`);
                }
              } catch (error) {
                logWarn('batch-highlight', `选区事件注册失败: ${selection.id}`, error);
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * 批量高亮所有已保存的选区
   */
  async highlightAllSelections(
    scrollToIndex: number = -1,
  ): Promise<{ success: number; total: number; errors: string[] }> {
    return await highlightAllSelections(
      () => this.getAllSelections(),
      scrollToIndex,
      {
        validator: this.validator,
        restorer: this.restorer,
        highlighter: this.highlighter,
      },
    );
  }

  /**
   * 批量高亮所有选区但不滚动
   */
  async highlightAllSelectionsWithoutScroll(): Promise<{ success: number; total: number; errors: string[] }> {
    return await highlightAllSelectionsWithoutScroll(
      () => this.getAllSelections(),
      {
        validator: this.validator,
        restorer: this.restorer,
        highlighter: this.highlighter,
      },
    );
  }

  /**
   * 批量高亮所有选区并滚动到最后一个
   */
  async highlightAllSelectionsScrollToLast(): Promise<{ success: number; total: number; errors: string[] }> {
    return await highlightAllSelectionsScrollToLast(
      () => this.getAllSelections(),
      {
        validator: this.validator,
        restorer: this.restorer,
        highlighter: this.highlighter,
      },
    );
  }

  /**
   * 批量高亮所有选区并滚动到中间位置
   */
  async highlightAllSelectionsScrollToMiddle(): Promise<{ success: number; total: number; errors: string[] }> {
    return await highlightAllSelectionsScrollToMiddle(
      () => this.getAllSelections(),
      {
        validator: this.validator,
        restorer: this.restorer,
        highlighter: this.highlighter,
      },
    );
  }

  // ========== 文本高亮方法（委托给助手模块） ==========

  /**
   * 根据文本高亮指定容器中的所有匹配文本
   */
  async highlightTextInContainers(
    text: string | string[],
    type: string,
    containers: string[],
    options: {
      onInteraction?: (event: any, instance: any) => void;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxMatches?: number;
      /** 自定义过滤函数，可用于过滤掉与已有选区重叠的匹配项 */
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

  /**
   * 清除文本高亮
   */
  clearTextHighlights(text?: string, containers?: string[]): void {
    this.textHighlightManager.clearTextHighlights(text, containers);
  }

  // ========== 选区类型管理方法 ==========

  /**
   * 注册新的选区类型
   */
  registerSelectionType(config: SelectionTypeConfig): void {
    this.selectionManager.registerType(config);
  }

  /**
   * 获取注册的选区类型配置
   */
  getRegisteredType(type: string): SelectionTypeConfig | undefined {
    return this.selectionManager.getRegisteredType(type);
  }

  /**
   * 获取所有注册的选区类型配置
   */
  getAllRegisteredTypes(): SelectionTypeConfig[] {
    return this.selectionManager.getAllRegisteredTypes();
  }

  // ========== 配置管理方法（委托给助手模块） ==========

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

  // ========== 监控管理方法（委托给助手模块） ==========

  enableContextChangeMonitoring(callback?: SelectionContextChangeCallback): void {
    this.monitoringManager.enableContextChangeMonitoring(callback);
  }

  disableContextChangeMonitoring(): void {
    this.monitoringManager.disableContextChangeMonitoring();
  }

  updateContextChangeMonitoringConfig(config: any): void {
    this.monitoringManager.updateContextChangeMonitoringConfig(config);
  }

  enableSmartDebounce(): void {
    this.monitoringManager.enableSmartDebounce();
  }

  disableSmartDebounce(): void {
    this.monitoringManager.disableSmartDebounce();
  }

  async triggerContextCheck(selectionId?: string): Promise<void> {
    await this.monitoringManager.triggerContextCheck(selectionId);
  }

  getContextChangeMonitoringStatus() {
    return this.monitoringManager.getContextChangeMonitoringStatus();
  }

  async startMonitoringSelection(selectionId: string, selectionData?: SerializedSelection): Promise<void> {
    await this.monitoringManager.startMonitoringSelection(selectionId, selectionData);
  }

  stopMonitoringSelection(selectionId: string): void {
    this.monitoringManager.stopMonitoringSelection(selectionId);
  }

  async startMonitoringMultipleSelections(selections: SerializedSelection[]): Promise<any> {
    return await this.monitoringManager.startMonitoringMultipleSelections(selections);
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

  // ========== 数据导入导出方法 ==========

  async exportData(): Promise<string> {
    return await this.storage.exportData();
  }

  async importData(jsonData: string): Promise<number> {
    return await this.storage.importData(jsonData);
  }

  async cleanupOldData(maxAgeInDays: number = 30): Promise<number> {
    return await this.storage.cleanupOldData(maxAgeInDays);
  }

  // ========== 其他工具方法 ==========

  async getCurrentPageStats(): Promise<SelectionStats> {
    return await this.storage.getStats();
  }

  getCurrentSelection(): {
    selection: Selection | null;
    range: Range | null;
    text: string;
    isValid: boolean;
    isEmpty: boolean;
  } {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      return {
        selection,
        range: null,
        text: '',
        isValid: false,
        isEmpty: true,
      };
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    const isValid = this.validator.isSelectionInValidRange(selection);

    return {
      selection,
      range,
      text,
      isValid,
      isEmpty: !text,
    };
  }

  hasValidSelection(): boolean {
    const current = this.getCurrentSelection();
    return !current.isEmpty && current.isValid;
  }

  getCurrentSelectionText(): string {
    return this.getCurrentSelection().text;
  }

  getCurrentSelectionRange(): Range | null {
    return this.getCurrentSelection().range;
  }

  getHighlighter() {
    return this.highlighter.getHighlighter();
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    // 清理选区行为监控器
    this.selectionBehaviorMonitor.destroy();

    this.monitoringManager.destroy();
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
export { SelectionContextChangeMonitor } from './monitor/context-change-monitor';
export type { SelectionTypeConfig } from './types';
export type { SearchMatchItem, SearchMatchFilter } from './helpers/text-highlight-manager';
export * from './storage';
export * from './core';
export { convertToSimple, convertSelectionsToSimple } from './utils';

// 默认导出
export default SelectionRestore;
