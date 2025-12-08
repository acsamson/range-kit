/**
 * 选区协调器 (SelectionCoordinator)
 *
 * 职责：协调添加/移除选区的完整业务流程
 * 将各个子模块（Registry, StyleRegistry, Monitor, Highlighter）串联起来
 */

import type {
  SerializedSelection,
  SelectionInstance,
  SelectionRestoreOptions,
  Highlighter,
} from '../types';
import { DEFAULT_SELECTION_TYPE } from '../types';
import { logInfo, logSuccess } from '../common/debug';

import { SelectionRegistry } from './selection-registry';
import { StyleRegistry } from './style-registry';
import { SelectionInstanceImpl } from './selection-instance';
import { ContentMonitor } from './content-monitor';
import { RangeCacheManager } from './cache-manager';
import type { SelectionManagerContext, ActiveRangesChangeData } from './types';

/**
 * 选区协调器配置
 */
export interface CoordinatorConfig {
  registry: SelectionRegistry;
  styleRegistry: StyleRegistry;
  highlighter: Highlighter;
  contentMonitor: ContentMonitor;
  cacheManager: RangeCacheManager;
  options: Required<SelectionRestoreOptions>;
}

/**
 * 选区协调器
 * 负责协调选区操作的完整业务流程
 */
export class SelectionCoordinator {
  private registry: SelectionRegistry;
  private styleRegistry: StyleRegistry;
  private highlighter: Highlighter;
  private contentMonitor: ContentMonitor;
  private cacheManager: RangeCacheManager;
  private options: Required<SelectionRestoreOptions>;

  constructor(config: CoordinatorConfig) {
    this.registry = config.registry;
    this.styleRegistry = config.styleRegistry;
    this.highlighter = config.highlighter;
    this.contentMonitor = config.contentMonitor;
    this.cacheManager = config.cacheManager;
    this.options = config.options;
  }

  /**
   * 添加选区的完整流程
   */
  addSelection(data: SerializedSelection): SelectionInstance {
    // 默认类型：优先使用 data.type，否则使用 selectionStyles[0].type，最后使用内置默认
    const type = data.type || this.options.selectionStyles?.[0]?.type || DEFAULT_SELECTION_TYPE;

    // 1. 创建选区实例
    const instance = new SelectionInstanceImpl(
      data.id,
      type,
      data,
      this.createContext(),
      (id) => this.removeSelection(id)
    );

    // 2. 注册到 Registry
    this.registry.add(instance);

    // 3. 启动内容监控
    this.contentMonitor.startMonitoring(data.id, data);

    logSuccess('selection-coordinator', '选区实例已添加', { id: data.id, type });
    return instance;
  }

  /**
   * 移除选区的完整流程
   */
  removeSelection(id: string): void {
    const instance = this.registry.get(id);
    if (!instance) return;

    // 1. 停止监控
    this.contentMonitor.stopMonitoring(id);

    // 2. 清除高亮
    this.clearSelectionHighlight(id);

    // 3. 移除活跃 Range
    this.unregisterActiveRange(id);

    // 4. 从 Registry 移除
    this.registry.remove(id);

    logInfo('selection-coordinator', '选区实例已移除', { id });
  }

  /**
   * 注册活跃 Range
   */
  registerActiveRange(selectionId: string, range: Range): void {
    const isNew = this.registry.registerRange(selectionId, range);

    // 清除缓存
    this.cacheManager.deleteCache(selectionId);

    // 如果数量变化，触发回调
    if (isNew) {
      this.notifyActiveRangesChange();
    }
  }

  /**
   * 移除活跃 Range
   */
  unregisterActiveRange(selectionId: string): void {
    const existed = this.registry.unregisterRange(selectionId);

    // 清除缓存
    this.cacheManager.deleteCache(selectionId);

    // 如果确实删除了，触发回调
    if (existed) {
      this.notifyActiveRangesChange();
    }
  }

  /**
   * 清除所有活跃 Range
   */
  clearAllActiveRanges(): void {
    const hadRanges = this.registry.clearAllRanges();

    // 清除所有缓存
    this.cacheManager.clearAll();

    // 如果之前有数据，触发回调
    if (hadRanges) {
      this.notifyActiveRangesChange();
    }
  }

  /**
   * 清除选区高亮
   */
  clearSelectionHighlight(id: string): void {
    const highlightId = this.registry.removeHighlightId(id);
    if (highlightId) {
      this.highlighter.clearHighlightById(highlightId);
    }
  }

  /**
   * 创建临时选区实例（用于选区完成事件）
   */
  createTempInstance(data: SerializedSelection): SelectionInstance {
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
      registeredTypes: this.styleRegistry.getTypeMap(),
      selectionHighlights: this.registry.getHighlightMap(),
      getStyleForType: (type) => this.styleRegistry.getStyleForType(type),
      clearSelectionHighlight: (id) => this.clearSelectionHighlight(id),
    };
  }

  /**
   * 通知活跃 Range 数量变化
   */
  private notifyActiveRangesChange(): void {
    if (this.options.onActiveRangesChange) {
      const data: ActiveRangesChangeData = {
        count: this.registry.rangeCount,
        ids: this.registry.getAllRangeIds(),
      };
      this.options.onActiveRangesChange(data);
    }
  }
}
