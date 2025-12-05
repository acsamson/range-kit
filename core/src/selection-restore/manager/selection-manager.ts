/**
 * 选区管理器
 *
 * 负责管理所有活跃的选区实例
 * 组合各个子模块提供完整的选区管理功能
 */

import {
  SerializedSelection,
  SelectionType,
  SelectionInstance,
  SelectionRestoreOptions,
  SelectionTypeConfig,
  HighlightStyle,
  DEFAULT_SELECTION_TYPE,
} from '../types';
import { CSSBasedHighlighter } from '../highlighter/css-highlighter';
import { logInfo, logSuccess } from '../debug/logger';
import { setCustomIdConfig } from '../serializer/serializer';

// 导入拆分的子模块
import { SelectionInstanceImpl } from './selection-instance';
import { RangeCacheManager } from './cache-manager';
import { InteractionDetector } from './interaction-detector';
import { RangeManager } from './range-manager';
import { ContentMonitor } from './content-monitor';
import { SelectionEventHandlers } from './event-handlers';
import type { SelectionManagerContext, DetectedSelectionInfo } from './types';

/**
 * 选区管理器
 * 负责管理所有活跃的选区实例，提供统一的选区操作接口
 */
export class SelectionManager {
  /** 选区实例映射 */
  private selections: Map<string, SelectionInstanceImpl> = new Map();
  /** 选区高亮ID映射 */
  public selectionHighlights: Map<string, string> = new Map();
  /** 已注册的类型配置映射 */
  private registeredTypes: Map<string, SelectionTypeConfig> = new Map();

  /** CSS高亮器实例 */
  public highlighter: CSSBasedHighlighter;
  /** 配置选项 */
  private options: Required<SelectionRestoreOptions>;

  // 子模块实例
  /** Range缓存管理器 */
  private cacheManager!: RangeCacheManager;
  /** Range管理器 */
  private rangeManager!: RangeManager;
  /** 交互检测器 */
  private interactionDetector!: InteractionDetector;
  /** 内容监控器 */
  private contentMonitor!: ContentMonitor;
  /** 事件处理器 */
  private eventHandlers!: SelectionEventHandlers;

  constructor(highlighter: CSSBasedHighlighter, options: Required<SelectionRestoreOptions>) {
    this.highlighter = highlighter;
    this.options = options;

    // 设置自定义ID配置
    if (this.options.customIdAttribute) {
      setCustomIdConfig(this.options.customIdAttribute);
    }

    // 注册用户自定义类型
    this.initializeRegisteredTypes(options);

    // 初始化子模块
    this.initializeSubModules();

    // 设置事件监听器
    this.eventHandlers.setupEventListeners();
    this.eventHandlers.setupSelectionCompleteListener();

    logInfo('selection-manager', '选区管理器已初始化', {
      enableMonitoring: options.enableSelectionMonitoring,
      monitoringInterval: options.monitoringInterval,
      defaultType: options.defaultSelectionType,
      registeredTypesCount: this.registeredTypes.size,
    });
  }

  /**
   * 初始化注册的类型配置
   */
  private initializeRegisteredTypes(options: Required<SelectionRestoreOptions>): void {
    if (options.registeredTypes) {
      options.registeredTypes.forEach(typeConfig => {
        this.registeredTypes.set(typeConfig.type, typeConfig);

        // 同时存储到全局变量
        if (typeof window !== 'undefined') {
          if (!(window as any).__selectionRestoreRegisteredTypes) {
            (window as any).__selectionRestoreRegisteredTypes = new Map();
          }
          (window as any).__selectionRestoreRegisteredTypes.set(typeConfig.type, typeConfig);
        }
      });
    }
  }

  /**
   * 初始化子模块
   */
  private initializeSubModules(): void {
    // 初始化缓存管理器
    this.cacheManager = new RangeCacheManager();

    // 初始化Range管理器
    this.rangeManager = new RangeManager(
      this.cacheManager,
      this.options.onActiveRangesChange
    );

    // 初始化交互检测器
    this.interactionDetector = new InteractionDetector(
      this.cacheManager,
      this.rangeManager.getActiveRanges(),
      (id) => {
        const instance = this.selections.get(id);
        if (instance) {
          return { text: instance.data.text, data: instance.data };
        }
        return undefined;
      }
    );

    // 初始化内容监控器
    this.contentMonitor = new ContentMonitor(
      this.options.monitoringInterval,
      (id) => {
        const instance = this.selections.get(id);
        if (instance) {
          return { instance, data: instance.data };
        }
        return undefined;
      },
      this.options.onSelectionChange
    );

    // 初始化事件处理器
    this.eventHandlers = new SelectionEventHandlers({
      options: this.options,
      registeredTypes: this.registeredTypes,
      interactionDetector: this.interactionDetector,
      rangeManager: this.rangeManager,
      getSelectionInstance: (id) => this.selections.get(id),
      createTempInstance: (data) => this.createTempInstance(data),
    });
  }

  /**
   * 创建临时选区实例（用于选区完成事件）
   */
  private createTempInstance(data: SerializedSelection): SelectionInstance {
    return new SelectionInstanceImpl(
      data.id,
      data.type || DEFAULT_SELECTION_TYPE,
      data,
      this.createContext(),
      (id) => this.removeSelection(id)
    );
  }

  /**
   * 创建管理器上下文
   */
  private createContext(): SelectionManagerContext {
    return {
      highlighter: this.highlighter,
      options: this.options,
      registeredTypes: this.registeredTypes,
      selectionHighlights: this.selectionHighlights,
      getStyleForType: (type) => this.getStyleForType(type),
      clearSelectionHighlight: (id) => this.clearSelectionHighlight(id),
    };
  }

  /**
   * 添加选区实例
   * @param data - 序列化的选区数据
   * @returns 选区实例
   */
  addSelection(data: SerializedSelection): SelectionInstance {
    const type = data.type || this.options.defaultSelectionType || DEFAULT_SELECTION_TYPE;
    const instance = new SelectionInstanceImpl(
      data.id,
      type,
      data,
      this.createContext(),
      (id) => this.removeSelection(id)
    );

    this.selections.set(data.id, instance);

    // 启动内容监控
    if (this.options.enableSelectionMonitoring) {
      this.contentMonitor.startMonitoring(data.id, data);
    }

    logSuccess('selection-manager', '选区实例已添加', { id: data.id, type });
    return instance;
  }

  /**
   * 移除选区实例
   * @param id - 选区ID
   */
  removeSelection(id: string): void {
    const instance = this.selections.get(id);
    if (!instance) return;

    // 停止监控
    this.contentMonitor.stopMonitoring(id);

    // 清除高亮
    this.clearSelectionHighlight(id);

    // 移除活跃Range
    this.unregisterActiveRange(id);

    // 移除实例
    this.selections.delete(id);

    logInfo('selection-manager', '选区实例已移除', { id });
  }

  /**
   * 获取选区实例
   * @param id - 选区ID
   * @returns 选区实例
   */
  getSelection(id: string): SelectionInstance | undefined {
    return this.selections.get(id);
  }

  /**
   * 获取所有选区实例
   * @returns 序列化的选区数据数组
   */
  async getAllSelections(): Promise<SerializedSelection[]> {
    return Array.from(this.selections.values()).map(instance => instance.data);
  }

  /**
   * 注册新的选区类型
   * @param config - 类型配置
   */
  registerType(config: SelectionTypeConfig): void {
    const existingConfig = this.registeredTypes.get(config.type);

    // 合并配置
    const mergedConfig: SelectionTypeConfig = {
      ...existingConfig,
      ...config,
      style: {
        ...(existingConfig?.style || {}),
        ...(config.style || {}),
      },
    };

    this.registeredTypes.set(config.type, mergedConfig);

    // 存储到全局变量
    if (typeof window !== 'undefined') {
      if (!(window as any).__selectionRestoreRegisteredTypes) {
        (window as any).__selectionRestoreRegisteredTypes = new Map();
      }
      (window as any).__selectionRestoreRegisteredTypes.set(config.type, mergedConfig);
    }

    logInfo('selection-manager', `注册选区类型: ${config.type} (${config.label})`, mergedConfig);
  }

  /**
   * 获取注册的类型配置
   * @param type - 类型名称
   * @returns 类型配置
   */
  getRegisteredType(type: SelectionType): SelectionTypeConfig | undefined {
    return this.registeredTypes.get(type);
  }

  /**
   * 获取所有注册的类型配置
   * @returns 类型配置数组
   */
  getAllRegisteredTypes(): SelectionTypeConfig[] {
    return Array.from(this.registeredTypes.values());
  }

  /**
   * 根据类型获取样式
   * @param type - 类型名称
   * @returns 高亮样式
   */
  getStyleForType(type: SelectionType): HighlightStyle {
    const typeConfig = this.registeredTypes.get(type);
    return typeConfig?.style || this.options.highlightStyle;
  }

  /**
   * 清除选区高亮
   * @param id - 选区ID
   */
  clearSelectionHighlight(id: string): void {
    const highlightId = this.selectionHighlights.get(id);
    if (highlightId) {
      // 只清除指定ID的高亮，而不是清除所有高亮
      // 避免影响其他类型的高亮（如搜索关键词高亮）
      this.highlighter.clearHighlightById(highlightId);
      this.selectionHighlights.delete(id);
    }
  }

  // ===== Range管理相关方法（代理到RangeManager）=====

  /**
   * 获取已注册的选区Range
   * @param selectionId - 选区ID
   * @returns Range的克隆
   */
  getActiveRange(selectionId: string): Range | undefined {
    return this.rangeManager.getActiveRange(selectionId);
  }

  /**
   * 获取所有活跃选区的ID列表
   * @returns 选区ID数组
   */
  getAllActiveSelectionIds(): string[] {
    return this.rangeManager.getAllActiveSelectionIds();
  }

  /**
   * 获取所有活跃选区的Range映射
   * @returns 选区ID到Range的映射
   */
  getAllActiveRanges(): Map<string, Range> {
    return this.rangeManager.getActiveRanges();
  }

  /**
   * 注册已恢复的选区Range
   * @param selectionId - 选区ID
   * @param range - Range对象
   */
  registerActiveRange(selectionId: string, range: Range): void {
    this.rangeManager.registerActiveRange(selectionId, range);
  }

  /**
   * 移除已注册的选区Range
   * @param selectionId - 选区ID
   */
  unregisterActiveRange(selectionId: string): void {
    this.rangeManager.unregisterActiveRange(selectionId);
  }

  /**
   * 清除所有已注册的Range
   */
  clearAllActiveRanges(): void {
    this.rangeManager.clearAllActiveRanges();
    this.interactionDetector.reset();
  }

  // ===== 交互检测相关方法（代理到InteractionDetector）=====

  /**
   * 检测指定坐标点的所有选区
   * @param x - X坐标
   * @param y - Y坐标
   * @returns 包含该点的所有选区信息数组
   */
  detectAllSelectionsAtPoint(x: number, y: number): DetectedSelectionInfo[] {
    return this.interactionDetector.detectAllSelectionsAtPoint(x, y);
  }

  // ===== 配置相关方法 =====

  /**
   * 设置自定义ID属性配置
   * @param customIdAttribute - 自定义ID属性名
   * @param preferCustomId - 是否优先使用自定义ID
   */
  setCustomIdConfig(customIdAttribute?: string, preferCustomId: boolean = false): void {
    if (customIdAttribute) {
      this.options.customIdAttribute = customIdAttribute;
    }
    this.options.preferCustomId = preferCustomId;
    setCustomIdConfig(customIdAttribute);
  }

  /**
   * 获取当前自定义ID配置
   * @returns 自定义ID配置
   */
  getCustomIdConfig(): { customIdAttribute?: string; preferCustomId: boolean } {
    return {
      customIdAttribute: this.options.customIdAttribute,
      preferCustomId: this.options.preferCustomId || false,
    };
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 销毁子模块
    this.eventHandlers.destroy();
    this.contentMonitor.destroy();
    this.rangeManager.destroy();
    this.cacheManager.destroy();
    this.interactionDetector.reset();

    // 清空所有数据
    this.selections.clear();
    this.selectionHighlights.clear();

    logInfo('selection-manager', '选区管理器已销毁');
  }
}
