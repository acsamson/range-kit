/**
 * 选区管理器
 * 负责管理选区的创建、恢复、高亮和交互事件
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

export class SelectionManager {
  private listeners: Map<keyof RangeSDKEvents, Function[]> = new Map();
  private isSelecting = false;
  private currentRange: Range | null = null;
  private selectionRestore: SelectionRestore;
  private activeSelections: Map<string, RangeData> = new Map();
  private boundHandlers: {
    selectionChange: () => void;
    mouseUp: () => void;
    mouseDown: () => void;
  };

  constructor(
    private container: Element = document.body
  ) {
    const options: SelectionRestoreOptions = {
      maxRetries: 3,
      fuzzyMatchThreshold: 0.8,
      contextLength: 50,
      enableLogging: process.env.NODE_ENV === 'development',
      enabledContainers: [this.getContainerSelector()],
      rootNodeId: this.container.id || undefined,
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

    this.selectionRestore = createSelectionRestore(options);

    this.boundHandlers = {
      selectionChange: this.handleSelectionChange.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      mouseDown: this.handleMouseDown.bind(this)
    };

    this.init();
  }

  private getContainerSelector(): string {
    if (this.container.id) {
      return `#${this.container.id}`;
    }

    if (this.container.className) {
      const classes = this.container.className.split(' ').filter(Boolean);
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }

    return this.container.tagName.toLowerCase();
  }

  private init() {
    document.addEventListener('selectionchange', this.boundHandlers.selectionChange);
    this.container.addEventListener('mouseup', this.boundHandlers.mouseUp);
    this.container.addEventListener('mousedown', this.boundHandlers.mouseDown);
  }

  private handleMouseDown() {
    console.log('[SelectionManager] 鼠标按下，开始选择');
    this.isSelecting = true;
  }

  private handleMouseUp() {
    console.log('[SelectionManager] 鼠标松开，isSelecting:', this.isSelecting);
    if (!this.isSelecting) return;
    this.isSelecting = false;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      console.log('[SelectionManager] 没有有效的选区（可能是点击操作）');
      return;
    }

    setTimeout(() => {
      console.log('[SelectionManager] 延迟后开始处理选区');
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
    console.log('[SelectionManager] 开始处理拖拽选区');
    const currentSelection = this.selectionRestore.getCurrentSelection();

    if (!currentSelection.selection || !currentSelection.range) {
      console.log('[SelectionManager] 没有有效的拖拽选区');
      return;
    }

    const range = currentSelection.range;

    if (!this.isValidRange(range)) {
      console.log('[SelectionManager] 选区无效');
      return;
    }

    if (!this.isRangeInContainer(range)) {
      console.log('[SelectionManager] 选区不在容器内');
      return;
    }

    try {
      const selectionData = await this.selectionRestore.serialize();

      if (selectionData) {
        const rangeData = convertSelectionToRange(selectionData);
        this.emit('range-selected', rangeData);
      }
    } catch (error) {
      console.error('处理选区时出错:', error);
    }
  }

  private isRangeInContainer(range: Range): boolean {
    try {
      return this.container.contains(range.commonAncestorContainer);
    } catch {
      return false;
    }
  }

  private isValidRange(range: Range): boolean {
    try {
      const currentSelection = this.selectionRestore.getCurrentSelection();
      const hasText = currentSelection.text.trim().length > 0;
      const hasValidContainers = range.startContainer !== null && range.endContainer !== null;
      const isNotCollapsed = !range.collapsed;

      return range && hasText && hasValidContainers && isNotCollapsed;
    } catch (error) {
      return false;
    }
  }

  getCurrentRange(): Range | null {
    return this.currentRange;
  }

  async getCurrentRangeData(): Promise<RangeData | null> {
    if (!this.currentRange || !this.isValidRange(this.currentRange)) {
      return null;
    }

    try {
      const selectionData = await this.selectionRestore.serialize();
      return selectionData ? convertSelectionToRange(selectionData) : null;
    } catch (error) {
      console.error('获取当前选区数据时出错:', error);
      return null;
    }
  }

  async restoreSelection(rangeData: RangeData): Promise<Range | null> {
    try {
      const selectionData = convertRangeToSelection(rangeData);
      const result = await this.selectionRestore.restore(selectionData);

      if (result.success && result.range) {
        this.currentRange = result.range;

        const currentSelection = this.selectionRestore.getCurrentSelection();
        if (currentSelection.selection) {
          currentSelection.selection.removeAllRanges();
          currentSelection.selection.addRange(result.range);
        }

        return result.range;
      }

      console.warn('选区恢复失败:', result.error);
      return null;
    } catch (error) {
      console.error('恢复选区时出错:', error);
      return null;
    }
  }

  async highlightRange(rangeData: RangeData, duration: number = 0): Promise<string | null> {
    try {
      const selectionData = convertRangeToSelection(rangeData);
      const result = await this.selectionRestore.restore(selectionData);

      if (result.success && result.range) {
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

      console.warn('高亮选区失败:', result.error);
      return null;
    } catch (error) {
      console.error('高亮选区时出错:', error);
      return null;
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
    try {
      const targetContainers = containers.length > 0 ? containers : [this.getContainerSelector()];

      const combinedInteractionHandler = options.onInteraction
        ? (event: SelectionInteractionEvent, instance: SelectionInstance) => {
            this.handleSelectionInteraction(event, instance);
            options.onInteraction!(event, instance);
          }
        : (event: SelectionInteractionEvent, instance: SelectionInstance) => {
            this.handleSelectionInteraction(event, instance);
          };

      const result = await this.selectionRestore.highlightTextInContainers(
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

      console.log(`文本高亮完成: ${result.success}/${result.total} 个匹配项成功高亮`);
      return result;
    } catch (error) {
      console.error('文本高亮时出错:', error);
      return {
        success: 0,
        total: Array.isArray(text) ? text.length : 1,
        highlightIds: [],
        errors: [String(error)]
      };
    }
  }

  clearTextHighlights(text?: string, containers: string[] = []): void {
    try {
      const targetContainers = containers.length > 0 ? containers : [this.getContainerSelector()];
      this.selectionRestore.clearTextHighlights(text, targetContainers);
    } catch (error) {
      console.error('清除文本高亮时出错:', error);
    }
  }

  async highlightMultipleRanges(rangeDataList: RangeData[]): Promise<{ success: number; total: number; errors: string[] }> {
    try {
      const selectionDataList = rangeDataList.map(rangeData => convertRangeToSelection(rangeData));
      return await this.selectionRestore.highlightSelections(selectionDataList);
    } catch (error) {
      console.error('批量高亮选区时出错:', error);
      return { success: 0, total: rangeDataList.length, errors: [String(error)] };
    }
  }

  clearAllHighlights(): void {
    try {
      const highlighter = this.selectionRestore.getHighlighter();
      highlighter.clearHighlight();
    } catch (error) {
      console.error('清除高亮时出错:', error);
    }
  }

  async highlightCurrentSelection(duration: number = 3000): Promise<void> {
    try {
      this.selectionRestore.highlightSelection(duration);
    } catch (error) {
      console.error('高亮当前选区时出错:', error);
    }
  }

  clearSelection() {
    try {
      const currentSelection = this.selectionRestore.getCurrentSelection();
      if (currentSelection.selection) {
        currentSelection.selection.removeAllRanges();
      }
    } catch (error) {
      console.warn('清除选区时出错:', error);
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
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  private async handleSelectionInteraction(event: SelectionInteractionEvent, instance: SelectionInstance): Promise<void> {
    let overlappedRanges: OverlappedRange[] = [];
    try {
      const selectionData = instance.data || event.selection;
      if (selectionData) {
        const restoreResult = await this.selectionRestore.restoreRangeOnly(selectionData);
        if (restoreResult.success && restoreResult.range) {
          overlappedRanges = await detectOverlappedRanges(restoreResult.range, this.selectionRestore);
        }
      }
    } catch (error) {
      console.warn('检测重叠选区失败:', error);
    }

    const behaviorEvent: SelectionBehaviorEvent = {
      type: SelectionBehaviorType.SELECTED,
      text: event.selection.text,
      timestamp: Date.now(),
      overlappedRanges: overlappedRanges
    };

    this.emit('selection-behavior', behaviorEvent);

    if (event.type === 'click') {
      const selection = event.selection as any;
      console.log('🎯 选区点击事件 - 完整 selection 信息:', {
        text: selection.text,
        overlappedTexts: selection.overlappedTexts,
        hasOverlap: !!selection.overlappedTexts && selection.overlappedTexts?.length > 1,
        overlapCount: selection.overlappedTexts?.length || 1,
        selectionId: instance.id,
        overlappedRanges: overlappedRanges
      });

      const selectionData = instance.data || event.selection;
      if (!selectionData) {
        console.warn('[SelectionManager] 没有找到选区数据');
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

  public async detectOverlappedRanges(currentRange: Range): Promise<OverlappedRange[]> {
    return detectOverlappedRanges(currentRange, this.selectionRestore);
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
