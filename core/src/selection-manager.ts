/**
 * 选区管理器
 * 负责管理选区的创建、恢复、高亮和交互事件
 *
 * 严格模式 API：必须传入 containerId（字符串）
 * 这为 DOM 树建立了一个绝对坐标原点，提升选区恢复的稳定性和性能
 */

import {
  createSelectionRestore,
  SelectionRestore,
  SerializedSelection,
  RestoreResult,
  SelectionRestoreOptions,
  HighlightStyle as NewHighlightStyle,
  SelectionInteractionEvent as BaseSelectionInteractionEvent,
  SelectionCompleteEvent,
  SelectionInstance,
  OverlappedRange,
  SelectionBehaviorEvent,
  SelectionBehaviorType
} from './selection-restore';
import { OverlapType } from './selection-restore/helpers/overlap-detector';
import { MarkType } from './types';
import type { RangeData, RangeSDKEvents, MarkData } from './types';
import { type ILogger, noopLogger, consoleLogger } from './common/logger';
import { ContainerNotFoundError, RestoreFailedError } from './common/errors';

// 导入子模块
import { convertSelectionToRange, convertRangeToSelection } from './selection-manager/data-converter';
import { detectOverlappedRanges, checkRangeOverlap } from './selection-manager/overlap-detector';

// 扩展 SelectionInteractionEvent 类型，添加 overlappedTexts 支持
interface ExtendedSelectionInteractionEvent extends BaseSelectionInteractionEvent {
  selection: SerializedSelection & {
    text: string;
    overlappedTexts?: string[];
  };
}

type SelectionInteractionEvent = ExtendedSelectionInteractionEvent;


/**
 * SelectionManager 配置选项
 */
export interface SelectionManagerOptions {
  /** 日志器实例，默认为 noopLogger（生产环境静默） */
  logger?: ILogger
}

export class SelectionManager {
  private listeners: Map<keyof RangeSDKEvents, Function[]> = new Map();
  private isSelecting = false;
  private currentRange: Range | null = null;
  private selectionRestore: SelectionRestore;
  private activeSelections: Map<string, RangeData> = new Map();
  private container: HTMLElement;
  private containerId: string;
  private logger: ILogger;
  private boundHandlers: {
    selectionChange: () => void;
    mouseUp: () => void;
    mouseDown: () => void;
  };

  /**
   * 创建选区管理器
   *
   * @param containerId - 容器元素的 ID（必须存在于 DOM 中）
   * @param options - 配置选项（可选）
   * @throws {ContainerNotFoundError} 如果找不到指定 ID 的元素
   *
   * @example
   * ```typescript
   * // 基础用法：传入元素 ID
   * const manager = new SelectionManager('article-content');
   *
   * // 启用调试日志
   * import { consoleLogger } from '@range-kit/core';
   * const manager = new SelectionManager('article-content', {
   *   logger: consoleLogger
   * });
   * ```
   */
  constructor(containerId: string, options: SelectionManagerOptions = {}) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new ContainerNotFoundError(containerId);
    }

    this.container = el;
    this.containerId = containerId;
    // 默认使用 noopLogger（生产环境静默），用户可传入 consoleLogger 启用日志
    this.logger = options.logger ?? noopLogger;

    const restoreOptions: SelectionRestoreOptions = {
      maxRetries: 3,
      fuzzyMatchThreshold: 0.8,
      contextLength: 50,
      enableLogging: process.env.NODE_ENV === 'development',
      enabledContainers: [`#${containerId}`],
      rootNodeId: containerId,
      defaultSelectionType: 'comment',
      enableSelectionMonitoring: true,
      monitoringInterval: 1000,
      onSelectionInteraction: (event, instance) => {
        this.handleSelectionInteraction(event, instance);
      },
      onSelectionComplete: (event, instance) => {
        this.handleSelectionComplete(event, instance);
      }
    };

    this.selectionRestore = createSelectionRestore(restoreOptions);

    this.boundHandlers = {
      selectionChange: this.handleSelectionChange.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      mouseDown: this.handleMouseDown.bind(this)
    };

    this.init();
  }

  /**
   * 获取容器选择器
   */
  private getContainerSelector(): string {
    return `#${this.containerId}`;
  }

  private init() {
    document.addEventListener('selectionchange', this.boundHandlers.selectionChange);
    this.container.addEventListener('mouseup', this.boundHandlers.mouseUp);
    this.container.addEventListener('mousedown', this.boundHandlers.mouseDown);
  }

  private handleMouseDown() {
    this.logger.debug('鼠标按下，开始选择');
    this.isSelecting = true;
  }

  private handleMouseUp() {
    this.logger.debug('鼠标松开，isSelecting:', this.isSelecting);
    if (!this.isSelecting) return;
    this.isSelecting = false;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      this.logger.debug('没有有效的选区（可能是点击操作）');
      return;
    }

    setTimeout(() => {
      this.logger.debug('延迟后开始处理选区');
      this.processSelection();
    }, 10);
  }

  private handleSelectionChange() {
    const currentSelection = this.selectionRestore.getCurrentSelection();
    if (!currentSelection.selection || !currentSelection.range) {
      this.currentRange = null;
      return;
    }
    this.currentRange = currentSelection.range;
  }

  private async processSelection() {
    this.logger.debug('开始处理拖拽选区');
    const currentSelection = this.selectionRestore.getCurrentSelection();

    if (!currentSelection.selection || !currentSelection.range) {
      this.logger.debug('没有有效的拖拽选区');
      return;
    }

    const range = currentSelection.range;

    if (!this.isValidRange(range)) {
      this.logger.debug('选区无效');
      return;
    }

    if (!this.isRangeInContainer(range)) {
      this.logger.debug('选区不在容器内');
      return;
    }

    try {
      const selectionData = await this.selectionRestore.serialize();

      if (selectionData) {
        const rangeData = convertSelectionToRange(selectionData);
        this.emit('range-selected', rangeData);
      }
    } catch (error) {
      this.logger.error('处理选区时出错:', error);
    }
  }

  private isRangeInContainer(range: Range): boolean {
    return this.container.contains(range.commonAncestorContainer);
  }

  private isValidRange(range: Range): boolean {
    if (!range) return false;

    const currentSelection = this.selectionRestore.getCurrentSelection();
    const hasText = currentSelection.text.trim().length > 0;
    const hasValidContainers = range.startContainer !== null && range.endContainer !== null;
    const isNotCollapsed = !range.collapsed;

    return hasText && hasValidContainers && isNotCollapsed;
  }

  getCurrentRange(): Range | null {
    return this.currentRange;
  }

  async getCurrentRangeData(): Promise<RangeData | null> {
    if (!this.currentRange || !this.isValidRange(this.currentRange)) {
      return null;
    }

    const selectionData = await this.selectionRestore.serialize();
    return selectionData ? convertSelectionToRange(selectionData) : null;
  }

  async restoreSelection(rangeData: RangeData): Promise<Range> {
    const selectionData = convertRangeToSelection(rangeData);
    const result = await this.selectionRestore.restore(selectionData);

    if (!result.success || !result.range) {
      throw new RestoreFailedError(
        result.error || '未知错误',
        result.layer
      );
    }

    this.currentRange = result.range;

    const currentSelection = this.selectionRestore.getCurrentSelection();
    if (currentSelection.selection) {
      currentSelection.selection.removeAllRanges();
      currentSelection.selection.addRange(result.range);
    }

    return result.range;
  }

  async highlightRange(rangeData: RangeData, duration: number = 0): Promise<string> {
    const selectionData = convertRangeToSelection(rangeData);
    const result = await this.selectionRestore.restore(selectionData);

    if (!result.success || !result.range) {
      throw new RestoreFailedError(
        `高亮选区失败: ${result.error || '未知错误'}`,
        result.layer
      );
    }

    const highlighter = this.selectionRestore.getHighlighter();

    highlighter.registerTypeStyle('comment', {
      backgroundColor: 'rgba(255, 193, 7, 0.3)',
      borderBottom: '2px solid #ffc107',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    });

    const highlightId = highlighter.highlightWithType(result.range, 'comment', true);

    if (duration > 0) {
      setTimeout(() => {
        highlighter.clearHighlight();
      }, duration);
    }

    return highlightId;
  }

  async highlightTextInContainers(
    text: string | string[],
    type: string = 'highlight',
    containers: string[] = [],
    options: {
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxMatches?: number;
      onInteraction?: (event: SelectionInteractionEvent, instance: SelectionInstance) => void;
    } = {}
  ): Promise<{
    success: number;
    total: number;
    highlightIds: string[];
    errors: string[];
  }> {
    const targetContainers = containers.length > 0 ? containers : [this.getContainerSelector()];

    const combinedInteractionHandler = options.onInteraction
      ? (event: SelectionInteractionEvent, instance: SelectionInstance) => {
          this.handleSelectionInteraction(event, instance);
          options.onInteraction!(event, instance);
        }
      : (event: SelectionInteractionEvent, instance: SelectionInstance) => {
          this.handleSelectionInteraction(event, instance);
        };

    return await this.selectionRestore.highlightTextInContainers(
      text,
      type,
      targetContainers,
      {
        caseSensitive: options.caseSensitive ?? false,
        wholeWord: options.wholeWord ?? false,
        maxMatches: options.maxMatches ?? 10000,
        onInteraction: combinedInteractionHandler
      }
    );
  }

  clearTextHighlights(text?: string, containers: string[] = []): void {
    const targetContainers = containers.length > 0 ? containers : [this.getContainerSelector()];
    this.selectionRestore.clearTextHighlights(text, targetContainers);
  }

  async highlightMultipleRanges(rangeDataList: RangeData[]): Promise<{ success: number; total: number; errors: string[] }> {
    const selectionDataList = rangeDataList.map(rangeData => convertRangeToSelection(rangeData));
    return await this.selectionRestore.highlightSelections(selectionDataList);
  }

  clearAllHighlights(): void {
    const highlighter = this.selectionRestore.getHighlighter();
    highlighter.clearHighlight();
  }

  highlightCurrentSelection(duration: number = 3000): void {
    this.selectionRestore.highlightSelection(duration);
  }

  clearSelection(): void {
    const currentSelection = this.selectionRestore.getCurrentSelection();
    if (currentSelection.selection) {
      currentSelection.selection.removeAllRanges();
    }
    this.currentRange = null;
  }

  // 事件系统
  on<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof RangeSDKEvents>(event: K, ...args: Parameters<RangeSDKEvents[K]>) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          // 注意：由于 TypeScript 限制，这里需要使用类型断言
          // 监听器的类型在 on() 方法中已经验证
          (listener as (...params: Parameters<RangeSDKEvents[K]>) => void)(...args);
        } catch (error) {
          this.logger.error(`事件 ${event} 监听器执行出错:`, error);
        }
      });
    }
  }

  private async handleSelectionInteraction(event: SelectionInteractionEvent, instance: SelectionInstance): Promise<void> {
    // 尝试检测重叠选区，失败不影响后续交互流程
    const overlappedRanges = await this.tryDetectOverlappedRanges(instance.data || event.selection);

    const behaviorEvent: SelectionBehaviorEvent = {
      type: SelectionBehaviorType.SELECTED,
      text: event.selection.text,
      timestamp: Date.now(),
      overlappedRanges: overlappedRanges
    };

    this.emit('selection-behavior', behaviorEvent);

    if (event.type === 'click') {
      const selection = event.selection;
      this.logger.debug('选区点击事件 - 完整 selection 信息:', {
        text: selection.text,
        overlappedTexts: selection.overlappedTexts,
        hasOverlap: !!selection.overlappedTexts && selection.overlappedTexts.length > 1,
        overlapCount: selection.overlappedTexts?.length || 1,
        selectionId: instance.id,
        overlappedRanges: overlappedRanges
      });

      const selectionData = instance.data || event.selection;
      if (!selectionData) {
        this.logger.warn('没有找到选区数据');
        return;
      }
      const rangeData = convertSelectionToRange(selectionData);

      const selectionType = selectionData.type || 'highlight';
      let markType = MarkType.HIGHLIGHT;
      if (selectionType === 'dictionary') {
        markType = MarkType.DICTIONARY;
      } else if (selectionType === 'comment') {
        markType = MarkType.COMMENT;
      }

      const markData: MarkData = {
        ...rangeData,
        type: markType,
        isPublic: true,
        isExistingComment: markType === MarkType.COMMENT,
        overlappedTexts: selection.overlappedTexts,
        metadata: {
          originalType: selectionType
        }
      };

      this.emit('mark-clicked', markData);
    }
  }

  /**
   * 检测与当前 Range 重叠的选区
   */
  public async detectOverlappedRanges(currentRange: Range): Promise<OverlappedRange[]> {
    return detectOverlappedRanges(currentRange, this.selectionRestore);
  }

  /**
   * 尝试检测重叠选区，失败时返回空数组（用于事件处理器等不应中断的场景）
   */
  private async tryDetectOverlappedRanges(selectionData: SerializedSelection | null): Promise<OverlappedRange[]> {
    if (!selectionData) return [];

    try {
      const restoreResult = await this.selectionRestore.restoreRangeOnly(selectionData);
      if (restoreResult.success && restoreResult.range) {
        return await detectOverlappedRanges(restoreResult.range, this.selectionRestore);
      }
    } catch {
      // 重叠检测是增强功能，失败不影响核心流程
    }
    return [];
  }

  private handleSelectionComplete(event: SelectionCompleteEvent, instance: SelectionInstance): void {
    const rangeData = convertSelectionToRange(event.selection);
    this.emit('range-selected', rangeData);
  }

  destroy() {
    document.removeEventListener('selectionchange', this.boundHandlers.selectionChange);
    this.container.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    this.container.removeEventListener('mousedown', this.boundHandlers.mouseDown);

    this.listeners.clear();

    if (this.selectionRestore) {
      this.selectionRestore.destroy();
    }

    this.currentRange = null;
    this.activeSelections.clear();
  }

  getSelectionRestoreInstance(): SelectionRestore {
    return this.selectionRestore;
  }

  getContainerSelectorString(): string {
    return this.getContainerSelector();
  }
}
