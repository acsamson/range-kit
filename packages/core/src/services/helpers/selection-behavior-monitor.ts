/**
 * 选区行为监控器
 * 负责监听容器内的选区行为（创建、清除等）
 */

import {
  SelectionBehaviorEvent,
  SelectionBehaviorType,
  SelectionBehaviorCallback,
  SerializedSelection,
  RestoreResult,
  OverlappedRange,
} from '../../types';
import { SELECTION_BEHAVIOR_DEBOUNCE_MS } from '../../constants';
import { detectOverlappingSelections, detectRangeOverlap } from '../../common/overlap-detector';

/**
 * 选区行为监控器配置
 */
export interface SelectionBehaviorMonitorConfig {
  /** 根节点ID（用于限定选区监控范围） */
  rootNodeId?: string;
  /** 选区行为回调 */
  onSelectionBehavior?: SelectionBehaviorCallback;
  /** 获取所有选区的方法 */
  getAllSelections: () => Promise<SerializedSelection[]>;
  /** 仅恢复 Range 的方法 */
  restoreRangeOnly: (data: SerializedSelection) => Promise<RestoreResult>;
  /** 获取活跃 Range 的方法 */
  getActiveRange: (id: string) => Range | undefined;
  /** 获取所有活跃选区 ID 的方法 */
  getAllActiveSelectionIds: () => string[];
  /** 获取 SelectionManager 的所有选区 */
  getManagerSelections: () => Promise<SerializedSelection[]>;
}

/**
 * 选区行为监控器
 * 从主类抽取出来，专门负责选区行为的监听和处理
 */
export class SelectionBehaviorMonitor {
  private config: SelectionBehaviorMonitorConfig;
  private listeners: Array<() => void> = [];

  constructor(config: SelectionBehaviorMonitorConfig) {
    this.config = config;
  }

  /**
   * 初始化选区行为监听器
   */
  initialize(): void {
    if (!this.config.onSelectionBehavior) return;

    // 清理之前的监听器
    this.cleanup();

    // 获取容器列表
    const containers = this.getContainers();

    // 为每个容器添加监听器
    containers.forEach(container => {
      this.setupContainerListeners(container);
    });
  }

  /**
   * 获取需要监听的容器列表
   * 注意：必须配置 rootNodeId，不再回退到 document.body
   */
  private getContainers(): Element[] {
    if (!this.config.rootNodeId) {
      // 严格模式：必须配置根节点，不再回退到 document.body
      console.warn('[SelectionBehaviorMonitor] 未配置 rootNodeId，选区行为监控将不生效');
      return [];
    }
    const rootElement = document.getElementById(this.config.rootNodeId);
    return rootElement ? [rootElement] : [];
  }

  /**
   * 为单个容器设置监听器
   */
  private setupContainerListeners(container: Element): void {
    let isSelecting = false;

    const handleMouseDown = () => {
      isSelecting = true;
    };

    const handleMouseUp = async () => {
      if (!isSelecting) return;
      isSelecting = false;

      // 短暂延迟确保选区已稳定
      setTimeout(async () => {
        await this.processSelectionEvent(container);
      }, SELECTION_BEHAVIOR_DEBOUNCE_MS);
    };

    // 添加事件监听器
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);

    // 保存清理函数
    this.listeners.push(() => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
    });
  }

  /**
   * 处理选区事件
   */
  private async processSelectionEvent(container: Element): Promise<void> {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';

    if (selection && !selection.isCollapsed && text) {
      await this.handleSelectionCreated(selection, text, container);
    } else if (selection?.isCollapsed) {
      this.handleSelectionCleared(selection, container);
    }
  }

  /**
   * 处理选区创建事件
   */
  private async handleSelectionCreated(
    selection: Selection,
    text: string,
    container: Element
  ): Promise<void> {
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;

    const position = this.getSelectionPosition(selection);
    const overlappedRanges = await this.detectOverlaps(range, text);

    const behaviorEvent: SelectionBehaviorEvent = {
      type: SelectionBehaviorType.CREATED,
      selection,
      range,
      text,
      position,
      container,
      timestamp: Date.now(),
      overlappedRanges,
    };

    this.config.onSelectionBehavior?.(behaviorEvent);
  }

  /**
   * 处理选区清除事件
   */
  private handleSelectionCleared(selection: Selection, container: Element): void {
    const behaviorEvent: SelectionBehaviorEvent = {
      type: SelectionBehaviorType.CREATED,
      selection,
      range: null,
      text: '',
      container,
      timestamp: Date.now(),
    };

    this.config.onSelectionBehavior?.(behaviorEvent);
  }

  /**
   * 获取选区位置信息
   */
  private getSelectionPosition(
    selection: Selection
  ): { x: number; y: number; width: number; height: number } | undefined {
    if (!selection.rangeCount) return undefined;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * 检测重叠选区
   */
  private async detectOverlaps(range: Range, text: string): Promise<OverlappedRange[]> {
    let overlappedRanges: OverlappedRange[] = [];

    try {
      const result = await detectOverlappingSelections(
        range,
        text,
        async () => {
          // 优先从 SelectionManager 获取活跃选区
          const activeSelections = await this.config.getManagerSelections();
          if (activeSelections.length > 0) {
            return activeSelections;
          }
          return this.config.getAllSelections();
        },
        async (data) => {
          // 优先从 SelectionManager 获取现成的 Range 对象
          const activeRange = this.config.getActiveRange(data.id);
          if (activeRange) {
            return {
              success: true,
              range: activeRange,
              layer: 0,
              layerName: 'Active(Memory)',
              restoreTime: 0,
            };
          }
          return this.config.restoreRangeOnly(data);
        }
      );

      overlappedRanges = result.overlappedRanges;

      // 检测额外的活跃 Range（如搜索高亮）
      await this.detectActiveRangeOverlaps(range, overlappedRanges);

      if (overlappedRanges.length > 0) {
        console.log('OVERLAP_DETECTION_DEBUG:', result.debugData);
      }
    } catch (error) {
      console.warn('检测重叠选区失败:', error);
    }

    return overlappedRanges;
  }

  /**
   * 检测活跃 Range 的重叠（如搜索高亮）
   */
  private async detectActiveRangeOverlaps(
    range: Range,
    overlappedRanges: OverlappedRange[]
  ): Promise<void> {
    const activeSelections = await this.config.getManagerSelections();
    const activeSelectionIds = new Set(activeSelections.map(s => s.id));
    const allActiveIds = this.config.getAllActiveSelectionIds();

    for (const activeId of allActiveIds) {
      if (activeSelectionIds.has(activeId)) continue;

      const activeRange = this.config.getActiveRange(activeId);
      if (!activeRange) continue;

      try {
        const overlapResult = detectRangeOverlap(range, activeRange);
        if (overlapResult.hasOverlap) {
          overlappedRanges.push({
            selectionId: activeId,
            text: activeRange.toString(),
            overlapType: overlapResult.overlapType,
            range: activeRange,
            overlappedText: activeRange.toString(),
            selectionData: {
              id: activeId,
              text: activeRange.toString(),
              type: 'search',
            } as SerializedSelection,
          });
        }
      } catch {
        // 静默处理
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SelectionBehaviorMonitorConfig>): void {
    this.config = { ...this.config, ...config };

    // 如果回调变化或根节点变化，重新初始化监听器
    if ('onSelectionBehavior' in config || 'rootNodeId' in config) {
      this.initialize();
    }
  }

  /**
   * 清理所有监听器
   */
  cleanup(): void {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.cleanup();
  }
}
