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
import { detectRangeOverlap, type CoreOverlapResult, OverlapType } from './selection-restore/helpers/overlap-detector';

// 扩展 SelectionInteractionEvent 类型，添加 overlappedTexts 支持
interface ExtendedSelectionInteractionEvent extends BaseSelectionInteractionEvent {
  selection: SerializedSelection & {
    text: string;
    overlappedTexts?: string[];
  };
}

// 使用扩展后的类型
type SelectionInteractionEvent = ExtendedSelectionInteractionEvent;
import { MarkType } from './types';
import type { RangeData, RangeSDKEvents, AnchorCandidate, SerializableRect, MarkData } from './types';

export class SelectionManager {
  private listeners: Map<keyof RangeSDKEvents, Function[]> = new Map();
  private isSelecting = false;
  private currentRange: Range | null = null;
  private selectionRestore: SelectionRestore;
  private activeSelections: Map<string, RangeData> = new Map(); // 追踪活跃的选区
  // 保存绑定后的事件处理函数引用，用于正确移除事件监听器
  private boundHandlers: {
    selectionChange: () => void;
    mouseUp: () => void;
    mouseDown: () => void;
  };
  
  constructor(
    private container: Element = document.body
  ) {
    // 初始化新的选区恢复管理器
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
      // 添加事件回调
      onSelectionInteraction: (event, instance) => {
        this.handleSelectionInteraction(event, instance);
      },
      onSelectionComplete: (event, instance) => {
        this.handleSelectionComplete(event, instance);
      }
    };
    
    this.selectionRestore = createSelectionRestore(options);
    
    // 创建绑定的事件处理函数
    this.boundHandlers = {
      selectionChange: this.handleSelectionChange.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      mouseDown: this.handleMouseDown.bind(this)
    };
    
    this.init();
  }
  
  private getContainerSelector(): string {
    // 如果容器有ID，优先使用ID选择器
    if (this.container.id) {
      return `#${this.container.id}`;
    }
    
    // 如果容器有class，使用class选择器
    if (this.container.className) {
      const classes = this.container.className.split(' ').filter(Boolean);
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // 回退到标签选择器
    return this.container.tagName.toLowerCase();
  }
  
  private init() {
    // 监听选区变化 - 使用保存的绑定函数引用
    document.addEventListener('selectionchange', this.boundHandlers.selectionChange);
    
    // 监听鼠标事件 - 使用保存的绑定函数引用
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
    
    // 立即获取选区，避免被清除
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      console.log('[SelectionManager] 没有有效的选区（可能是点击操作）');
      return;
    }
    
    // 短暂延迟，确保选区已稳定
    setTimeout(() => {
      console.log('[SelectionManager] 延迟后开始处理选区');
      this.processSelection();
    }, 10);
  }
  
  private handleSelectionChange() {
    // 使用 SDK 实例获取当前选区信息
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
    console.log('[SelectionManager] 拖拽选区状态:', {
      hasSelection: !!currentSelection.selection,
      hasRange: !!currentSelection.range,
      text: currentSelection.text,
      isValid: currentSelection.isValid,
      isEmpty: currentSelection.isEmpty
    });
    if (!currentSelection.selection || !currentSelection.range) {
      console.log('[SelectionManager] 没有有效的拖拽选区');
      return;
    }
    
    const range = currentSelection.range;
    console.log('[SelectionManager] 获取到选区:', range, '选中文本:', currentSelection.text);
    
    // 验证选区是否有效
    if (!this.isValidRange(range)) {
      console.log('[SelectionManager] 选区无效');
      return;
    }
    console.log('[SelectionManager] 选区验证通过');
    
    // 检查选区是否在容器内
    if (!this.isRangeInContainer(range)) {
      console.log('[SelectionManager] 选区不在容器内');
      return;
    }
    console.log('[SelectionManager] 选区在容器内');

    try {
      // 使用新的选区恢复包序列化选区数据
      const selectionData = await this.selectionRestore.serialize();

      if (selectionData) {
        // 将 SerializedSelection 转换为 RangeData 格式
        const rangeData = this.convertSelectionToRange(selectionData);

        // 触发选区选择事件
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
  
  /**
   * 将 SerializedSelection 转换为 RangeData 格式
   */
  private convertSelectionToRange(selectionData: SerializedSelection): RangeData {
    // 添加防御性检查
    if (!selectionData) {
      console.error('[SelectionManager] convertSelectionToRange: selectionData is undefined');
      throw new Error('Selection data is required');
    }
    
    const rect = selectionData.metadata?.selectionBounds;
    const paths = selectionData.paths || {};
    
    return {
      id: selectionData.id || '',
      startContainerPath: paths.startPath || '',
      startOffset: paths.startOffset || 0,
      endContainerPath: paths.endPath || '',
      endOffset: paths.endOffset || 0,
      selectedText: selectionData.text || '',
      pageUrl: selectionData.metadata?.url || window.location.href,
      timestamp: selectionData.timestamp || Date.now(),
      rect: rect ? {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top || rect.y,
        right: rect.right || rect.x + rect.width,
        bottom: rect.bottom || rect.y + rect.height,
        left: rect.left || rect.x
      } : undefined,
      contextBefore: selectionData.textContext?.precedingText || '',
      contextAfter: selectionData.textContext?.followingText || '',
      // 将新包的锚点信息转换为旧格式
      anchorInfo: selectionData.anchors?.startId ? {
        id: selectionData.anchors.startId,
        startRelativePath: '',
        endRelativePath: ''
      } : undefined,
      // 保留新包的多重锚点信息
      multiAnchorInfo: {
        primaryAnchor: selectionData.anchors?.startId ? {
          id: selectionData.anchors.startId,
          tagName: selectionData.multipleAnchors?.startAnchors?.tagName || '',
          depth: 0,
          startRelativePath: '',
          endRelativePath: '',
          reliability: 90,
          attributes: selectionData.multipleAnchors?.startAnchors?.attributes || {}
        } : undefined,
        fallbackAnchors: [],
        structuralFingerprint: {
          hierarchyPattern: selectionData.structuralFingerprint?.parentChain?.map(p => p.tagName) || [],
          depthFromBody: selectionData.structuralFingerprint?.depth || 0,
          siblingContext: {
            tagsBefore: selectionData.structuralFingerprint?.siblingPattern?.beforeTags || [],
            tagsAfter: selectionData.structuralFingerprint?.siblingPattern?.afterTags || [],
            totalSiblings: selectionData.structuralFingerprint?.siblingPattern?.total || 0,
            positionInSiblings: selectionData.structuralFingerprint?.siblingPattern?.position || 0
          },
          contentSignature: {
            textLength: selectionData.structuralFingerprint?.textLength || 0,
            textHash: '',
            hasImages: selectionData.selectionContent?.mediaElements?.some(m => m.type === 'image') || false,
            hasLinks: false,
            uniqueWords: []
          },
          attributeSignature: {
            hasId: !!(selectionData.structuralFingerprint?.attributes?.id),
            hasDataAttributes: Object.keys(selectionData.structuralFingerprint?.attributes || {}).some(k => k.startsWith('data-')),
            commonAttributes: Object.keys(selectionData.structuralFingerprint?.attributes || {})
          }
        }
      }
    };
  }
  
  /**
   * 将 RangeData 转换为 SerializedSelection 格式
   */
  private convertRangeToSelection(rangeData: RangeData): SerializedSelection {
    return {
      id: rangeData.id,
      text: rangeData.selectedText,
      timestamp: rangeData.timestamp,
      anchors: {
        startId: rangeData.anchorInfo?.id || null,
        endId: rangeData.anchorInfo?.id || null,
        startOffset: rangeData.startOffset,
        endOffset: rangeData.endOffset
      },
      paths: {
        startPath: rangeData.startContainerPath,
        endPath: rangeData.endContainerPath,
        startOffset: rangeData.startOffset,
        endOffset: rangeData.endOffset,
        startTextOffset: 0,
        endTextOffset: 0
      },
      multipleAnchors: {
        startAnchors: {
          tagName: rangeData.multiAnchorInfo?.primaryAnchor?.tagName || '',
          className: '',
          id: rangeData.multiAnchorInfo?.primaryAnchor?.id || '',
          attributes: rangeData.multiAnchorInfo?.primaryAnchor?.attributes || {}
        },
        endAnchors: {
          tagName: rangeData.multiAnchorInfo?.primaryAnchor?.tagName || '',
          className: '',
          id: rangeData.multiAnchorInfo?.primaryAnchor?.id || '',
          attributes: rangeData.multiAnchorInfo?.primaryAnchor?.attributes || {}
        },
        commonParent: null,
        siblingInfo: null
      },
      structuralFingerprint: {
        tagName: '',
        className: '',
        attributes: rangeData.multiAnchorInfo?.structuralFingerprint?.attributeSignature.commonAttributes.reduce((acc, attr) => {
          acc[attr] = '';
          return acc;
        }, {} as Record<string, string>) || {},
        textLength: rangeData.multiAnchorInfo?.structuralFingerprint?.contentSignature.textLength || 0,
        childCount: 0,
        depth: rangeData.multiAnchorInfo?.structuralFingerprint?.depthFromBody || 0,
        parentChain: rangeData.multiAnchorInfo?.structuralFingerprint?.hierarchyPattern.map(tag => ({
          tagName: tag,
          className: '',
          id: ''
        })) || [],
        siblingPattern: {
          position: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.positionInSiblings || 0,
          total: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.totalSiblings || 0,
          beforeTags: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.tagsBefore || [],
          afterTags: rangeData.multiAnchorInfo?.structuralFingerprint?.siblingContext.tagsAfter || []
        }
      },
      textContext: {
        precedingText: rangeData.contextBefore || '',
        followingText: rangeData.contextAfter || '',
        parentText: '',
        textPosition: {
          start: rangeData.startOffset,
          end: rangeData.endOffset,
          totalLength: 0
        }
      },
      selectionContent: {
        text: rangeData.selectedText,
        mediaElements: [],
        htmlStructure: ''
      },
      metadata: {
        url: rangeData.pageUrl,
        title: document.title,
        selectionBounds: rangeData.rect ? 
          new DOMRect(rangeData.rect.x, rangeData.rect.y, rangeData.rect.width, rangeData.rect.height) :
          new DOMRect(0, 0, 0, 0),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent
      },
      appUrl: rangeData.pageUrl
    };
  }
  
  // 获取当前选区
  getCurrentRange(): Range | null {
    return this.currentRange;
  }
  
  // 获取当前选区数据
  async getCurrentRangeData(): Promise<RangeData | null> {
    if (!this.currentRange || !this.isValidRange(this.currentRange)) {
      return null;
    }

    try {
      const selectionData = await this.selectionRestore.serialize();
      return selectionData ? this.convertSelectionToRange(selectionData) : null;
    } catch (error) {
      console.error('获取当前选区数据时出错:', error);
      return null;
    }
  }
  
  // 恢复选区
  async restoreSelection(rangeData: RangeData): Promise<Range | null> {
    try {
      const selectionData = this.convertRangeToSelection(rangeData);
      const result = await this.selectionRestore.restore(selectionData);

      if (result.success && result.range) {
        this.currentRange = result.range;

        // 恢复选区到浏览器
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
  
  // 高亮选区 - 使用新包的高亮功能
  async highlightRange(rangeData: RangeData, duration: number = 0): Promise<string | null> {
    try {
      const selectionData = this.convertRangeToSelection(rangeData);
      const result = await this.selectionRestore.restore(selectionData);

      if (result.success && result.range) {
        // 获取高亮器并应用高亮
        const highlighter = this.selectionRestore.getHighlighter();

        // 设置高亮样式 - 恢复原来好看的样式
        highlighter.registerTypeStyle('comment', {
          backgroundColor: 'rgba(255, 193, 7, 0.3)',
          borderBottom: '2px solid #ffc107',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        });

        // 应用高亮
        const highlightId = highlighter.highlightWithType(result.range, 'comment', true);

        // 如果指定了持续时间，自动清除高亮
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

  /**
   * 核心重点: 根据文本内容高亮指定容器中的所有匹配文本
   * @param text 要高亮的文本或文本数组
   * @param type 高亮类型（comment、highlight、dictionary等）
   * @param containers 目标容器选择器数组
   * @param options 配置选项
   */
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
      // 使用容器的默认选择器，如果没有指定
      const targetContainers = containers.length > 0 ? containers : [this.getContainerSelector()];

      // 创建组合的交互处理器：同时调用全局处理器和插件处理器
      const combinedInteractionHandler = options.onInteraction
        ? (event: SelectionInteractionEvent, instance: SelectionInstance) => {
            // 先调用全局处理器（用于日志、埋点等）
            this.handleSelectionInteraction(event, instance);
            // 再调用插件特定的处理器
            options.onInteraction!(event, instance);
          }
        : (event: SelectionInteractionEvent, instance: SelectionInstance) => {
            // 只有全局处理器
            this.handleSelectionInteraction(event, instance);
          };

      // 使用新包的文本高亮功能
      const result = await this.selectionRestore.highlightTextInContainers(
        text,
        type,
        targetContainers,
        {
          caseSensitive: options.caseSensitive ?? false,
          wholeWord: options.wholeWord ?? false,  // 默认允许子串匹配
          maxMatches: options.maxMatches ?? 10000,  // 增加默认最大匹配数
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

  /**
   * 清除特定文本的高亮
   * @param text 要清除高亮的文本，如果为空则清除所有文本高亮
   * @param containers 目标容器选择器数组
   */
  clearTextHighlights(text?: string, containers: string[] = []): void {
    try {
      const targetContainers = containers.length > 0 ? containers : [this.getContainerSelector()];
      this.selectionRestore.clearTextHighlights(text, targetContainers);
    } catch (error) {
      console.error('清除文本高亮时出错:', error);
    }
  }
  
  // 批量高亮多个选区
  async highlightMultipleRanges(rangeDataList: RangeData[]): Promise<{ success: number; total: number; errors: string[] }> {
    try {
      const selectionDataList = rangeDataList.map(rangeData => this.convertRangeToSelection(rangeData));
      return await this.selectionRestore.highlightSelections(selectionDataList);
    } catch (error) {
      console.error('批量高亮选区时出错:', error);
      return { success: 0, total: rangeDataList.length, errors: [String(error)] };
    }
  }
  
  // 清除所有高亮
  clearAllHighlights(): void {
    try {
      const highlighter = this.selectionRestore.getHighlighter();
      highlighter.clearHighlight();
    } catch (error) {
      console.error('清除高亮时出错:', error);
    }
  }
  
  // 临时高亮当前选区（用于预览）
  async highlightCurrentSelection(duration: number = 3000): Promise<void> {
    try {
      this.selectionRestore.highlightSelection(duration);
    } catch (error) {
      console.error('高亮当前选区时出错:', error);
    }
  }
  
  // 清除当前选区
  clearSelection() {
    // 使用 SDK 实例清除选区
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
  
  // 处理选区交互事件（点击、悬浮等）
  private async handleSelectionInteraction(event: SelectionInteractionEvent, instance: SelectionInstance): Promise<void> {
    // 检测重叠选区
    let overlappedRanges: OverlappedRange[] = [];
    try {
      // 尝试恢复当前选区以获取Range对象
      const selectionData = instance.data || event.selection;
      if (selectionData) {
        const restoreResult = await this.selectionRestore.restoreRangeOnly(selectionData);
        if (restoreResult.success && restoreResult.range) {
          overlappedRanges = await this.detectOverlappedRanges(restoreResult.range);
        }
      }
    } catch (error) {
      console.warn('检测重叠选区失败:', error);
    }

    // 创建包含重叠信息的选区行为事件
    const behaviorEvent: SelectionBehaviorEvent = {
      type: SelectionBehaviorType.SELECTED,
      text: event.selection.text,
      timestamp: Date.now(),
      overlappedRanges: overlappedRanges
    };

    // 触发选区行为事件
    this.emit('selection-behavior', behaviorEvent);

    // 点击事件时打印完整的 selection 信息
    if (event.type === 'click') {
      const selection = event.selection as any; // 临时类型断言，因为 overlappedTexts 是动态添加的
      console.log('🎯 选区点击事件 - 完整 selection 信息:', {
        text: selection.text,
        overlappedTexts: selection.overlappedTexts,
        hasOverlap: !!selection.overlappedTexts && selection.overlappedTexts?.length > 1,
        overlapCount: selection.overlappedTexts?.length || 1,
        selectionId: instance.id,
        overlappedRanges: overlappedRanges
      });
      
      // 处理点击事件 - 查找对应的标记数据并触发评论面板
      const selectionData = instance.data || event.selection;
      if (!selectionData) {
        console.warn('[SelectionManager] 没有找到选区数据');
        return;
      }
      const rangeData = this.convertSelectionToRange(selectionData);
      
      // 创建一个临时的 MarkData 对象来兼容现有的事件处理
      // 根据选区的类型决定 MarkType
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
        isExistingComment: markType === MarkType.COMMENT, // 只有评论类型才标记为已存在的评论
        // 添加重叠选区信息用于埋点上报
        overlappedTexts: selection.overlappedTexts,
        metadata: {
          originalType: selectionType // 保存原始类型
        }
      };
      
      // 触发标记点击事件，让主组件处理
      this.emit('mark-clicked', markData);
    } else if (event.type === 'hover') {
      // 处理悬浮事件 - 不打印日志避免刷屏
    }
  }

  /**
   * 检测当前选区与已有选区的重叠关系
   * @param currentRange 当前选区的Range对象
   * @returns 重叠的选区信息数组
   */
  public async detectOverlappedRanges(currentRange: Range): Promise<OverlappedRange[]> {
    const overlappedRanges: OverlappedRange[] = [];
    
    // 如果选区为空，直接返回
    if (!currentRange || currentRange.collapsed) {
      return overlappedRanges;
    }
    
    try {
      // 获取所有已保存的选区数据
      const allSelections = await this.selectionRestore.getAllSelections();
      
      // 如果没有保存的选区，直接返回
      if (allSelections.length === 0) {
        return overlappedRanges;
      }
      
      // 只检查最近的10个选区，超过10个会严重影响性能
      const MAX_SELECTIONS_TO_CHECK = 10;
      const selectionsToCheck = allSelections.length > MAX_SELECTIONS_TO_CHECK 
        ? allSelections.slice(-MAX_SELECTIONS_TO_CHECK) // 只取最近的10个
        : allSelections;
      
      for (const existingSelection of selectionsToCheck) {
        try {
          // 尝试恢复每个选区以获取其Range对象
          const restoreResult = await this.selectionRestore.restoreRangeOnly(existingSelection);
          
          if (restoreResult.success && restoreResult.range) {
            const existingRange = restoreResult.range;
            
            // 检查重叠
            const overlapInfo = this.checkRangeOverlap(currentRange, existingRange);
            
            if (overlapInfo.hasOverlap) {
              // 获取重叠区域的文本内容
              let overlappedText = '';
              try {
                if (overlapInfo.overlapRange) {
                  overlappedText = overlapInfo.overlapRange.toString();
                }
              } catch (error) {
                console.warn('获取重叠文本失败:', error);
              }
              
              const overlappedRange: OverlappedRange = {
                selectionId: existingSelection.id,
                text: existingSelection.text,
                overlapType: overlapInfo.overlapType,
                range: existingRange,
                overlappedText,
                selectionData: existingSelection
              };
              
              overlappedRanges.push(overlappedRange);
            }
          }
        } catch (error) {
          // 静默处理单个选区恢复失败，避免影响其他选区的检测
        }
      }
    } catch (error) {
      console.error('检测重叠选区时出错:', error);
    }
    
    return overlappedRanges;
  }

  /**
   * 检查两个Range是否重叠以及重叠类型
   * @param rangeA 第一个Range
   * @param rangeB 第二个Range
   * @returns 重叠检测结果
   */
  private checkRangeOverlap(rangeA: Range, rangeB: Range): {
    hasOverlap: boolean;
    overlapType: OverlapType;
    overlapRange?: Range;
  } {
    try {
      // 使用统一的重叠检测逻辑
      const coreResult = detectRangeOverlap(rangeA, rangeB);
      
      // 转换重叠类型从 overlap-detector 的类型到 selection-restore 的枚举类型
      let overlapType: OverlapType;
      switch (coreResult.overlapType) {
        case OverlapType.EXISTING_CONTAINS_CURRENT:
          overlapType = OverlapType.EXISTING_CONTAINS_CURRENT;
          break;
        case OverlapType.CURRENT_CONTAINS_EXISTING:
          overlapType = OverlapType.CURRENT_CONTAINS_EXISTING;
          break;
        case OverlapType.PARTIAL_OVERLAP:
          overlapType = OverlapType.PARTIAL_OVERLAP;
          break;
        case OverlapType.NO_OVERLAP:
        default:
          overlapType = OverlapType.NO_OVERLAP;
          break;
      }
      
      // 如果有重叠，创建重叠区域的Range
      let overlapRange: Range | undefined;
      if (coreResult.hasOverlap) {
        try {
          overlapRange = document.createRange();
          
          // 根据重叠类型设置重叠区域
          if (coreResult.overlapType === OverlapType.EXISTING_CONTAINS_CURRENT) {
            // 当前选区完全包含在已有选区内，重叠区域就是当前选区
            overlapRange.setStart(rangeA.startContainer, rangeA.startOffset);
            overlapRange.setEnd(rangeA.endContainer, rangeA.endOffset);
          } else if (coreResult.overlapType === OverlapType.CURRENT_CONTAINS_EXISTING) {
            // 当前选区完全包含已有选区，重叠区域就是已有选区
            overlapRange.setStart(rangeB.startContainer, rangeB.startOffset);
            overlapRange.setEnd(rangeB.endContainer, rangeB.endOffset);
          } else {
            // 部分重叠，重叠区域是两个选区的交集
            // 重叠区域的起始点是两个Range起始点中较晚的那个
            const startComparison = rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB);
            if (startComparison >= 0) {
              overlapRange.setStart(rangeA.startContainer, rangeA.startOffset);
            } else {
              overlapRange.setStart(rangeB.startContainer, rangeB.startOffset);
            }
            
            // 重叠区域的结束点是两个Range结束点中较早的那个
            const endComparison = rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB);
            if (endComparison <= 0) {
              overlapRange.setEnd(rangeA.endContainer, rangeA.endOffset);
            } else {
              overlapRange.setEnd(rangeB.endContainer, rangeB.endOffset);
            }
          }
        } catch (error) {
          console.warn('创建重叠Range失败:', error);
          overlapRange = undefined;
        }
      }
      
      return {
        hasOverlap: coreResult.hasOverlap,
        overlapType,
        overlapRange
      };
      
    } catch (error) {
      console.error('Range重叠检测失败:', error);
      return { hasOverlap: false, overlapType: OverlapType.NO_OVERLAP };
    }
  }

  // 处理选区完成事件
  private handleSelectionComplete(event: SelectionCompleteEvent, instance: SelectionInstance): void {
    // 将选区完成事件转换为我们现有的选区选择事件
    const rangeData = this.convertSelectionToRange(event.selection);
    this.emit('range-selected', rangeData);
  }
  
  // 销毁管理器
  destroy() {
    // 使用保存的绑定函数引用来正确移除事件监听器
    document.removeEventListener('selectionchange', this.boundHandlers.selectionChange);
    this.container.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    this.container.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    
    // 清理监听器
    this.listeners.clear();
    
    // 清理选区恢复实例
    if (this.selectionRestore) {
      this.selectionRestore.destroy();
    }
    
    // 清理引用
    this.currentRange = null;
    this.activeSelections.clear();
  }

  /**
   * 获取内部的 SelectionRestore SDK 实例
   * 允许外部直接访问 SDK 的所有功能进行深度操作
   * @returns SelectionRestore 实例
   */
  getSelectionRestoreInstance(): SelectionRestore {
    return this.selectionRestore;
  }
  
  /**
   * 获取当前容器的选择器
   * @returns 容器选择器字符串
   */
  getContainerSelectorString(): string {
    return this.getContainerSelector();
  }
}
