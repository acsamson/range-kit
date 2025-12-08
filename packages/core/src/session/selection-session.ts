/**
 * 选区会话管理器 (SelectionSession)
 *
 * 负责管理所有活跃的选区实例状态
 * 组合各个子模块提供完整的选区管理功能
 *
 * 架构位置：
 * - SelectionManager: Kit 的主入口，管理用户交互和事件（用户层）
 * - SelectionSession: 管理 SelectionRestore 内部的选区状态（引擎层）
 *
 * 架构设计：
 * - SelectionRegistry: 纯数据存储（选区实例、Range、高亮ID）
 * - StyleRegistry: 样式/类型配置管理
 * - SelectionCoordinator: 业务流程协调
 * - 其他子模块: CacheManager, InteractionDetector, ContentMonitor, EventHandlers
 */

import {
  SerializedSelection,
  SelectionType,
  SelectionInstance,
  SelectionRestoreOptions,
  SelectionTypeConfig,
  HighlightStyle,
  Highlighter,
} from '../types';
import { logInfo } from '../common/debug';
import { setCustomIdConfig } from '../locator/serializer';

// 导入拆分的子模块
import { RangeCacheManager } from './cache-manager';
import { InteractionDetector } from './interaction-detector';
import { ContentMonitor } from './content-monitor';
import { SelectionEventHandlers } from './event-handlers';
import { SelectionRegistry } from './selection-registry';
import { StyleRegistry } from './style-registry';
import { SelectionCoordinator } from './selection-coordinator';
import type { DetectedSelectionInfo } from './types';

/**
 * 选区会话管理器
 * 负责管理所有活跃的选区实例，提供统一的选区操作接口
 */
export class SelectionSession {
  // ===== 核心注册表 =====
  /** 选区数据注册表 */
  private registry: SelectionRegistry;
  /** 样式注册表 */
  private styleRegistry: StyleRegistry;
  /** 选区协调器 */
  private coordinator: SelectionCoordinator;

  /** 高亮器实例（接口类型，支持依赖注入） */
  public highlighter: Highlighter;
  /** 配置选项 */
  private options: Required<SelectionRestoreOptions>;

  // ===== 子模块实例 =====
  /** Range缓存管理器 */
  private cacheManager: RangeCacheManager;
  /** 交互检测器 */
  private interactionDetector: InteractionDetector;
  /** 内容监控器 */
  private contentMonitor: ContentMonitor;
  /** 事件处理器 */
  private eventHandlers: SelectionEventHandlers;

  /** 兼容性：暴露 selectionHighlights 供外部访问 */
  get selectionHighlights(): Map<string, string> {
    return this.registry.getHighlightMap();
  }

  constructor(highlighter: Highlighter, options: Required<SelectionRestoreOptions>) {
    this.highlighter = highlighter;
    this.options = options;

    // 设置自定义ID配置（从 advanced 子对象获取）
    if (this.options.advanced?.customIdAttribute) {
      setCustomIdConfig(this.options.advanced.customIdAttribute);
    }

    // 初始化注册表
    this.registry = new SelectionRegistry();

    // 从 selectionStyles 获取默认样式（第一个类型的样式）
    const defaultStyle = options.selectionStyles?.[0]?.style || {};
    this.styleRegistry = new StyleRegistry(defaultStyle);

    // 注册用户自定义类型
    this.styleRegistry.initializeTypes(options.selectionStyles);

    // 初始化子模块
    this.cacheManager = new RangeCacheManager();

    // 内容监控器使用默认间隔（5000ms）
    const DEFAULT_MONITORING_INTERVAL = 5000;
    this.contentMonitor = new ContentMonitor(
      DEFAULT_MONITORING_INTERVAL,
      (id) => {
        const instance = this.registry.get(id);
        if (instance) {
          return { instance, data: instance.data };
        }
        return undefined;
      }
    );

    // 初始化协调器
    this.coordinator = new SelectionCoordinator({
      registry: this.registry,
      styleRegistry: this.styleRegistry,
      highlighter: this.highlighter,
      contentMonitor: this.contentMonitor,
      cacheManager: this.cacheManager,
      options: this.options,
    });

    // 初始化交互检测器
    this.interactionDetector = new InteractionDetector(
      this.cacheManager,
      this.registry.getAllRanges(),
      (id) => {
        const instance = this.registry.get(id);
        if (instance) {
          return { text: instance.data.text, data: instance.data };
        }
        return undefined;
      }
    );

    // 初始化事件处理器
    this.eventHandlers = new SelectionEventHandlers({
      options: this.options,
      registeredTypes: this.styleRegistry.getTypeMap(),
      interactionDetector: this.interactionDetector,
      getActiveRange: (id) => this.getActiveRange(id),
      getSelectionInstance: (id) => this.registry.get(id),
      createTempInstance: (data) => this.coordinator.createTempInstance(data),
    });

    // 设置事件监听器
    this.eventHandlers.setupEventListeners();
    this.eventHandlers.setupSelectionCompleteListener();

    logInfo('selection-session', '选区会话已初始化', {
      defaultType: options.selectionStyles?.[0]?.type || 'default',
      registeredTypesCount: this.styleRegistry.size,
    });
  }

  // ===== 选区实例管理（委托给 Coordinator）=====

  /**
   * 添加选区实例
   * @param data - 序列化的选区数据
   * @returns 选区实例
   */
  addSelection(data: SerializedSelection): SelectionInstance {
    return this.coordinator.addSelection(data);
  }

  /**
   * 移除选区实例
   * @param id - 选区ID
   */
  removeSelection(id: string): void {
    this.coordinator.removeSelection(id);
  }

  /**
   * 获取选区实例
   * @param id - 选区ID
   * @returns 选区实例
   */
  getSelection(id: string): SelectionInstance | undefined {
    return this.registry.get(id);
  }

  /**
   * 获取所有选区实例
   * @returns 序列化的选区数据数组
   */
  async getAllSelections(): Promise<SerializedSelection[]> {
    return this.registry.getAllData();
  }

  // ===== 类型管理（委托给 StyleRegistry）=====

  /**
   * 注册新的选区类型
   * @param config - 类型配置
   */
  registerType(config: SelectionTypeConfig): void {
    this.styleRegistry.registerType(config);
  }

  /**
   * 获取注册的类型配置
   * @param type - 类型名称
   * @returns 类型配置
   */
  getRegisteredType(type: SelectionType): SelectionTypeConfig | undefined {
    return this.styleRegistry.getType(type);
  }

  /**
   * 获取所有注册的类型配置
   * @returns 类型配置数组
   */
  getAllRegisteredTypes(): SelectionTypeConfig[] {
    return this.styleRegistry.getAllTypes();
  }

  /**
   * 根据类型获取样式
   * @param type - 类型名称
   * @returns 高亮样式
   */
  getStyleForType(type: SelectionType): HighlightStyle {
    return this.styleRegistry.getStyleForType(type);
  }

  // ===== 高亮管理（委托给 Coordinator）=====

  /**
   * 清除选区高亮
   * @param id - 选区ID
   */
  clearSelectionHighlight(id: string): void {
    this.coordinator.clearSelectionHighlight(id);
  }

  // ===== Range 管理（委托给 Registry + Coordinator）=====

  /**
   * 获取已注册的选区Range
   * @param selectionId - 选区ID
   * @returns Range的克隆（防止外部修改污染内部状态）
   */
  getActiveRange(selectionId: string): Range | undefined {
    return this.registry.getRange(selectionId);
  }

  /**
   * 获取所有活跃选区的ID列表
   * @returns 选区ID数组
   */
  getAllActiveSelectionIds(): string[] {
    return this.registry.getAllRangeIds();
  }

  /**
   * 获取所有活跃选区的Range映射
   * @returns 选区ID到Range的映射
   */
  getAllActiveRanges(): Map<string, Range> {
    return this.registry.getAllRanges();
  }

  /**
   * 注册已恢复的选区Range
   * @param selectionId - 选区ID
   * @param range - Range对象
   */
  registerActiveRange(selectionId: string, range: Range): void {
    this.coordinator.registerActiveRange(selectionId, range);
  }

  /**
   * 移除已注册的选区Range
   * @param selectionId - 选区ID
   */
  unregisterActiveRange(selectionId: string): void {
    this.coordinator.unregisterActiveRange(selectionId);
  }

  /**
   * 清除所有已注册的Range
   */
  clearAllActiveRanges(): void {
    this.coordinator.clearAllActiveRanges();
    this.interactionDetector.reset();
  }

  // ===== 交互检测（委托给 InteractionDetector）=====

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
   * @param customIdAttribute - 自定义ID属性名，配置后自动启用
   */
  setCustomIdConfig(customIdAttribute?: string): void {
    // 确保 advanced 对象存在
    if (!this.options.advanced) {
      (this.options as SelectionRestoreOptions).advanced = {};
    }
    this.options.advanced!.customIdAttribute = customIdAttribute;
    setCustomIdConfig(customIdAttribute);
  }

  /**
   * 获取当前自定义ID配置
   * @returns 自定义ID属性名
   */
  getCustomIdConfig(): { customIdAttribute?: string } {
    return {
      customIdAttribute: this.options.advanced?.customIdAttribute,
    };
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 销毁子模块
    this.eventHandlers.destroy();
    this.contentMonitor.destroy();
    this.cacheManager.destroy();
    this.interactionDetector.reset();

    // 清空所有数据
    this.registry.clear();
    this.styleRegistry.clear();

    logInfo('selection-session', '选区会话已销毁');
  }
}
