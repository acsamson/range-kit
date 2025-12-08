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
} from './selection-restore';
import type {
  SerializedSelection,
  RestoreResult,
  SelectionRestoreOptions,
  HighlightStyle as NewHighlightStyle,
  SelectionInteractionEvent as BaseSelectionInteractionEvent,
  SelectionCompleteEvent,
  SelectionInstance,
  SelectionBehaviorEvent,
  ErrorEvent,
} from '../types';
import { SelectionBehaviorType } from '../types';
import type { OverlappedRange } from '../common/overlap-detector';
import { OverlapType } from '../common/overlap-detector';
import { MarkType } from '../types';
import type { RangeData, RangeKitEvents, MarkData } from '../types';
import { type ILogger, noopLogger, consoleLogger } from '../common/logger';
import { ContainerNotFoundError, RestoreFailedError, RangeKitError } from '../common/errors';

// 导入子模块
import { convertSelectionToRange, convertRangeToSelection } from './data-converter';
import { detectOverlappedRanges, checkRangeOverlap } from './overlap-detector';

// 导入 InteractionManager 用于统一事件处理
import { InteractionManager, InteractionEventType } from '../interaction';
import type { InteractionEventData } from '../interaction';

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

/**
 * 容器类型：支持字符串 ID 或 HTMLElement 实例
 */
export type ContainerInput = string | HTMLElement

export class SelectionManager {
  private listeners: Map<keyof RangeKitEvents, Function[]> = new Map();
  private isSelecting = false;
  private currentRange: Range | null = null;
  private selectionRestore: SelectionRestore;
  private activeSelections: Map<string, RangeData> = new Map();
  private container: HTMLElement;
  private containerId: string;
  private logger: ILogger;

  /** 统一事件管理器 - 委托事件监听 */
  private interactionManager: InteractionManager;

  /**
   * 创建选区管理器
   *
   * @param container - 容器元素的 ID 或 HTMLElement 实例
   * @param options - 配置选项（可选）
   * @throws {ContainerNotFoundError} 如果传入字符串 ID 但找不到对应元素
   *
   * @example
   * ```typescript
   * // 方式1：传入元素 ID
   * const manager = new SelectionManager('article-content');
   *
   * // 方式2：传入 HTMLElement 实例（推荐，更灵活）
   * const container = document.querySelector('.editor');
   * const manager = new SelectionManager(container);
   *
   * // 方式3：配合 React Ref 使用
   * const manager = new SelectionManager(editorRef.current);
   *
   * // 启用调试日志
   * import { consoleLogger } from '@range-kit/core';
   * const manager = new SelectionManager('article-content', {
   *   logger: consoleLogger
   * });
   * ```
   */
  constructor(container: ContainerInput, options: SelectionManagerOptions = {}) {
    // 解析容器：支持字符串 ID 或 HTMLElement
    const el = this.resolveContainer(container);

    this.container = el;
    // 如果传入的是元素，尝试获取其 ID，否则生成一个临时 ID
    this.containerId = typeof container === 'string'
      ? container
      : (el.id || this.generateContainerId(el));
    // 默认使用 noopLogger（生产环境静默），用户可传入 consoleLogger 启用日志
    this.logger = options.logger ?? noopLogger;

    const restoreOptions: SelectionRestoreOptions = {
      rootNodeId: this.containerId,
      onSelectionInteraction: (event, instance) => {
        this.handleSelectionInteraction(event, instance);
      },
    };

    this.selectionRestore = createSelectionRestore(restoreOptions);

    // 初始化 InteractionManager 处理事件监听
    this.interactionManager = new InteractionManager(this.container, {
      listenSelection: true,
      listenClick: false, // 点击事件由 SelectionRestore 内部处理
      listenHover: false, // 悬停事件由 SelectionRestore 内部处理
      selectionDebounce: 50,
    });

    this.init();
  }

  /**
   * 解析容器输入，返回 HTMLElement
   * @param container - 字符串 ID 或 HTMLElement
   * @throws {ContainerNotFoundError} 如果传入字符串但找不到元素
   */
  private resolveContainer(container: ContainerInput): HTMLElement {
    if (typeof container === 'string') {
      const el = document.getElementById(container);
      if (!el) {
        throw new ContainerNotFoundError(container);
      }
      return el;
    }

    // 直接传入 HTMLElement
    if (!(container instanceof HTMLElement)) {
      throw new ContainerNotFoundError('传入的不是有效的 HTMLElement');
    }
    return container;
  }

  /**
   * 为没有 ID 的容器生成临时 ID
   */
  private generateContainerId(el: HTMLElement): string {
    const generatedId = `range-kit-container-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    el.id = generatedId;
    return generatedId;
  }

  /**
   * 获取容器选择器
   */
  private getContainerSelector(): string {
    return `#${this.containerId}`;
  }

  private init() {
    // 使用 InteractionManager 监听选区事件
    this.interactionManager.on(InteractionEventType.SELECT, this.handleInteractionSelect.bind(this));

    // 监听容器的 mousedown/mouseup 用于跟踪选择状态
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * 处理 InteractionManager 的选区事件
   */
  private handleInteractionSelect(event: InteractionEventData): void {
    // 更新当前 Range
    if (event.range) {
      this.currentRange = event.range;
    }
  }

  private handleMouseDown = (): void => {
    this.logger.debug('鼠标按下，开始选择');
    this.isSelecting = true;
  }

  private handleMouseUp = (): void => {
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
      this.emitError('serialize', error as Error, { operation: 'processSelection' });
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
    try {
      const selectionData = convertRangeToSelection(rangeData);
      const result = await this.selectionRestore.restore(selectionData);

      if (!result.success || !result.range) {
        const error = new RestoreFailedError(
          result.error || '未知错误',
          result.layer
        );
        this.emitError('restore', error, { rangeId: rangeData.id });
        throw error;
      }

      this.currentRange = result.range;

      const currentSelection = this.selectionRestore.getCurrentSelection();
      if (currentSelection.selection) {
        currentSelection.selection.removeAllRanges();
        currentSelection.selection.addRange(result.range);
      }

      return result.range;
    } catch (error) {
      // 如果是我们自己抛出的 RestoreFailedError，直接重新抛出
      if (error instanceof RestoreFailedError) {
        throw error;
      }
      // 其他未预期的错误
      this.emitError('restore', error as Error, { rangeId: rangeData.id });
      throw error;
    }
  }

  async highlightRange(rangeData: RangeData, duration: number = 0): Promise<string> {
    try {
      const selectionData = convertRangeToSelection(rangeData);
      const result = await this.selectionRestore.restore(selectionData);

      if (!result.success || !result.range) {
        const error = new RestoreFailedError(
          `高亮选区失败: ${result.error || '未知错误'}`,
          result.layer
        );
        this.emitError('highlight', error, { rangeId: rangeData.id });
        throw error;
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
    } catch (error) {
      if (error instanceof RestoreFailedError) {
        throw error;
      }
      this.emitError('highlight', error as Error, { rangeId: rangeData.id });
      throw error;
    }
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
    try {
      const selectionDataList = rangeDataList.map(rangeData => convertRangeToSelection(rangeData));
      const result = await this.selectionRestore.highlightSelections(selectionDataList);

      // 如果有错误，发射错误事件但不中断流程（批量操作部分成功）
      if (result.errors.length > 0) {
        const error = new Error(`批量高亮部分失败: ${result.errors.length}/${result.total}`);
        this.emitError('highlight', error, {
          successCount: result.success,
          totalCount: result.total,
          errors: result.errors,
        });
      }

      return result;
    } catch (error) {
      this.emitError('highlight', error as Error, {
        rangeCount: rangeDataList.length,
      });
      throw error;
    }
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
  on<K extends keyof RangeKitEvents>(event: K, listener: RangeKitEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off<K extends keyof RangeKitEvents>(event: K, listener: RangeKitEvents[K]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof RangeKitEvents>(event: K, ...args: Parameters<RangeKitEvents[K]>) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          // 注意：由于 TypeScript 限制，这里需要使用类型断言
          // 监听器的类型在 on() 方法中已经验证
          (listener as (...params: Parameters<RangeKitEvents[K]>) => void)(...args);
        } catch (error) {
          this.logger.error(`事件 ${event} 监听器执行出错:`, error);
        }
      });
    }
  }

  /**
   * 发射错误事件
   * 让上层应用能够捕获并处理内部错误
   */
  private emitError(
    operation: ErrorEvent['operation'],
    error: Error,
    context?: Record<string, unknown>
  ): void {
    const errorEvent: ErrorEvent = {
      code: error instanceof RangeKitError ? error.code : 'UNKNOWN_ERROR',
      message: error.message,
      operation,
      originalError: error,
      context: {
        ...context,
        ...(error instanceof RangeKitError ? error.context : {}),
      },
      timestamp: Date.now(),
    };

    this.emit('error', errorEvent);
  }

  private async handleSelectionInteraction(event: SelectionInteractionEvent, instance: SelectionInstance): Promise<void> {
    try {
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
    } catch (error) {
      // 交互事件处理失败不应中断用户操作，但需要通知上层
      this.logger.error('处理选区交互事件失败:', error);
      this.emitError('interaction', error as Error, {
        eventType: event.type,
        instanceId: instance.id,
      });
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
    // 销毁 InteractionManager（它会清理自己的事件监听器）
    this.interactionManager.destroy();

    // 清理 mousedown/mouseup 监听器
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('mouseup', this.handleMouseUp);

    this.listeners.clear();

    if (this.selectionRestore) {
      this.selectionRestore.destroy();
    }

    this.currentRange = null;
    this.activeSelections.clear();
  }

}
