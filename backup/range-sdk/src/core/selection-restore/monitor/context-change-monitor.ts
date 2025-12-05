import {
  SelectionContextChangeEvent,
  SelectionContextChangeCallback,
  SelectionContextChangeStrategy,
  SerializedSelection,
  SelectionInstance,
  SelectionRestoreAPI,
} from '../types';
import { logInfo, logWarn, logError, logDebug } from '../debug/logger';
import { restoreSelection } from '../restorer/restorer';

/**
 * 选区上下文变化监听器
 * 监听富文本编辑器等动态内容环境中的选区变化
 */
export class SelectionContextChangeMonitor {
  private monitoringIntervals: Map<string, number> = new Map();
  private mutationObserver: MutationObserver | null = null;
  private contentSnapshots: Map<string, string> = new Map();
  private activeRanges: Map<string, Range> = new Map();
  private selectionDataCache: Map<string, SerializedSelection> = new Map();
  private sdkInstance: SelectionRestoreAPI;
  private callback: SelectionContextChangeCallback | undefined;
  private strategy: SelectionContextChangeStrategy;
  private detectionInterval: number;
  private enableDOMMonitoring: boolean;
  private targetContainers: string[];

  // 🔥 新增：快速变化检测机制
  private fastChangeDetectors: Map<string, number> = new Map(); // 快速检测定时器
  private inputListeners: Map<string, (event: Event) => void> = new Map(); // 输入事件监听器
  private pendingChanges: Map<string, { text: string; timestamp: number }> = new Map(); // 待处理的变化
  private processingQueue: Map<string, boolean> = new Map(); // 处理队列状态
  private lastActivityTime: Map<string, number> = new Map(); // 🔥 新增：记录最后活动时间

  // 🔥 新增：智能防抖队列系统
  private updateQueue: Map<string, {
    event: SelectionContextChangeEvent;
    context: any; // 使用any类型避免循环引用问题
    timestamp: number;
    timerId?: number;
  }> = new Map(); // 消息队列

  // 🔥 智能防抖配置
  private readonly BASE_DEBOUNCE_DELAY = 500; // 基础防抖延迟
  private readonly MAX_DEBOUNCE_DELAY = 2000; // 最大防抖延迟
  private readonly ACTIVITY_THRESHOLD = 100; // 活动阈值（100ms内有新变化算活跃）
  private smartDebounceEnabled = false; // 智能防抖开关

  constructor(
    sdkInstance: SelectionRestoreAPI,
    options: {
      callback?: SelectionContextChangeCallback;
      strategy?: SelectionContextChangeStrategy;
      detectionInterval?: number;
      enableDOMMonitoring?: boolean;
      targetContainers?: string[];
    } = {},
  ) {
    this.sdkInstance = sdkInstance;
    this.callback = options.callback;
    this.strategy = options.strategy || 'notify-only';
    this.detectionInterval = options.detectionInterval || 500;
    this.enableDOMMonitoring = options.enableDOMMonitoring || false;
    this.targetContainers = options.targetContainers || [];

    this.initializeMutationObserver();

    logInfo('context-monitor', '上下文变化监听器已初始化', {
      strategy: this.strategy,
      detectionInterval: this.detectionInterval,
      enableDOMMonitoring: this.enableDOMMonitoring,
      targetContainers: this.targetContainers.length,
    });
  }

  /**
   * 初始化DOM变化观察器
   */
  private initializeMutationObserver(): void {
    if (!this.enableDOMMonitoring) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      this.handleDOMMutations(mutations);
    });

    // 确定监听目标
    const targets = this.getMonitoringTargets();

    targets.forEach(target => {
      this.mutationObserver!.observe(target, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false, // 暂时不监听属性变化，避免过度触发
      });
    });

    logDebug('context-monitor', `DOM变化观察器已启动，监听${targets.length}个目标容器`);
  }

  /**
   * 获取监听目标节点
   */
  private getMonitoringTargets(): Element[] {
    if (this.targetContainers.length === 0) {
      return [document.documentElement];
    }

    const targets: Element[] = [];
    for (const selector of this.targetContainers) {
      try {
        const elements = document.querySelectorAll(selector);
        targets.push(...Array.from(elements));
      } catch (error) {
        logWarn('context-monitor', `无效的监听容器选择器: ${selector}`, error);
      }
    }

    return targets.length > 0 ? targets : [document.documentElement];
  }

  /**
   * 处理DOM变化
   */
  private handleDOMMutations(mutations: MutationRecord[]): void {
    const affectedSelectionIds = new Set<string>();

    for (const mutation of mutations) {
      // 检查变化是否影响已保存的选区
      const relatedSelections = this.findAffectedSelections(mutation);
      relatedSelections.forEach(id => affectedSelectionIds.add(id));
    }

    // 为受影响的选区触发检查
    for (const selectionId of affectedSelectionIds) {
      this.triggerSelectionCheck(selectionId, 'mutation-observer');
    }
  }

  /**
   * 查找受DOM变化影响的选区
   */
  private findAffectedSelections(_mutation: MutationRecord): string[] {
    void _mutation; // 参数保留用于未来实现
    // 这里简化实现，实际可以根据选区的位置信息进行更精确的判断
    // 当前所有选区都会被检查，后续可以优化为只检查可能受影响的选区
    return Array.from(this.monitoringIntervals.keys());
  }

  /**
   * 开始监听特定选区
   */
  async startMonitoring(selectionId: string, selectionData: SerializedSelection): Promise<void> {
    // 如果已经在监听，先停止
    if (this.monitoringIntervals.has(selectionId)) {
      this.stopMonitoring(selectionId);
    }

    // 🔥 缓存选区数据
    this.selectionDataCache.set(selectionId, selectionData);

    // 尝试恢复选区并缓存Range
    try {
      const result = await restoreSelection(selectionData);
      if (result.success && result.range) {
        // 🔥 缓存当前Range对象
        this.activeRanges.set(selectionId, result.range.cloneRange());

        const initialText = this.safeExtractRangeText(result.range) || '';
        this.contentSnapshots.set(selectionId, initialText);

        // 🔥 启动快速变化检测
        this.startFastChangeDetection(selectionId, result.range);

        logDebug('context-monitor', `为选区${selectionId}创建初始快照并缓存Range`, {
          initialText: initialText.substring(0, 50) + '...',
          textLength: initialText.length,
          hasRange: true,
          fastDetectionEnabled: true,
        });
      } else {
        logWarn('context-monitor', `选区${selectionId}初始恢复失败，使用fallback模式`, result.error);
        // 即使恢复失败，我们也可以监听，但会使用较慢的重新匹配模式
      }
    } catch (error) {
      logWarn('context-monitor', `无法为选区${selectionId}创建初始快照`, error);
    }

    // 开始定期检查（作为兜底机制）
    const intervalId = window.setInterval(() => {
      this.checkSelectionContext(selectionId, selectionData);
    }, this.detectionInterval);

    this.monitoringIntervals.set(selectionId, intervalId);

    logDebug('context-monitor', `开始监听选区${selectionId}的上下文变化`);
  }

  /**
   * 停止监听特定选区
   */
  stopMonitoring(selectionId: string): void {
    const intervalId = this.monitoringIntervals.get(selectionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(selectionId);
    }

    // 🔥 停止快速变化检测
    this.stopFastChangeDetection(selectionId);

    // 🔥 清理智能防抖队列
    const queueItem = this.updateQueue.get(selectionId);
    if (queueItem?.timerId) {
      clearTimeout(queueItem.timerId);
    }
    this.updateQueue.delete(selectionId);

    // 🔥 清理所有相关缓存
    this.contentSnapshots.delete(selectionId);
    this.activeRanges.delete(selectionId);
    this.selectionDataCache.delete(selectionId);

    logDebug('context-monitor', `停止监听选区${selectionId}的上下文变化并清理缓存`);
  }

  /**
   * 触发选区检查（由DOM变化观察器调用）
   */
  private async triggerSelectionCheck(selectionId: string, detectionMethod: 'mutation-observer' | 'content-monitor' = 'mutation-observer'): Promise<void> {
    // 获取选区数据 - 需要从SDK实例获取
    try {
      const allSelections = await this.sdkInstance.getAllSelections();
      const selectionData = allSelections.find(s => s.id === selectionId);

      if (!selectionData) {
        logWarn('context-monitor', `选区${selectionId}不存在，停止监听`);
        this.stopMonitoring(selectionId);
        return;
      }

      await this.checkSelectionContext(selectionId, selectionData, detectionMethod);
    } catch (error) {
      logError('context-monitor', `检查选区${selectionId}时发生错误`, error);
    }
  }

  /**
   * 检查选区上下文是否发生变化 - 使用Range缓存的智能检测
   */
  private async checkSelectionContext(
    selectionId: string,
    selectionData: SerializedSelection,
    detectionMethod: 'mutation-observer' | 'content-monitor' | 'manual-trigger' = 'content-monitor',
  ): Promise<void> {
    try {
      const originalSnapshot = this.contentSnapshots.get(selectionId);
      const cachedRange = this.activeRanges.get(selectionId);
      const cachedSelectionData = this.selectionDataCache.get(selectionId);

      // 🔥 优先使用缓存的Range来检测变化
      if (cachedRange && cachedSelectionData) {
        await this.checkUsingCachedRange(selectionId, cachedRange, cachedSelectionData, originalSnapshot, detectionMethod);
      } else {
        // 🔥 Fallback：如果没有缓存Range，使用传统的恢复检测模式
        await this.checkUsingRestoreMode(selectionId, selectionData, originalSnapshot, detectionMethod);
      }
    } catch (error) {
      logError('context-monitor', `检查选区${selectionId}上下文变化时发生错误`, error);
    }
  }

  /**
   * 使用缓存Range进行智能检测（推荐模式）
   */
  private async checkUsingCachedRange(
    selectionId: string,
    cachedRange: Range,
    cachedSelectionData: SerializedSelection,
    originalSnapshot: string | undefined,
    detectionMethod: 'mutation-observer' | 'content-monitor' | 'manual-trigger',
  ): Promise<void> {
    try {
      // 🔥 关键修复：使用安全的文本提取方法，避免激活Range
      let currentText: string;
      try {
        // 不直接调用Range.toString()，而是手动提取文本内容
        const extractedText = this.safeExtractRangeText(cachedRange);
        if (extractedText === null) {
          // Range已失效，完全停止监听并清理
          logWarn('context-monitor', `选区${selectionId}的Range已失效，停止监听`);
          this.stopMonitoring(selectionId);
          return;
        }
        currentText = extractedText;
      } catch (rangeError) {
        // Range失效，完全停止监听并清理
        logWarn('context-monitor', `选区${selectionId}的Range提取失败，停止监听`, rangeError);
        this.stopMonitoring(selectionId);
        return;
      }

      // 🔥 如果当前文本为空且原快照也为空，跳过检测避免无意义的日志
      if (currentText === '' && (originalSnapshot === '' || originalSnapshot === undefined)) {
        return;
      }

      logDebug('context-monitor', `选区${selectionId}使用缓存Range检测`, {
        originalSnapshot: originalSnapshot?.substring(0, 50) + '...',
        currentText: currentText.substring(0, 50) + '...',
        originalLength: originalSnapshot?.length || 0,
        currentLength: currentText.length,
        hasChanged: originalSnapshot !== currentText,
      });

      // 检查文本是否发生变化
      if (originalSnapshot && currentText !== originalSnapshot) {
        // 🔥 防止空文本的无效变化
        if (currentText === '' && originalSnapshot.length > 0) {
          // 文本变成空，可能是Range失效，停止监听
          logWarn('context-monitor', `选区${selectionId}文本变为空，可能Range失效，停止监听`);
          this.stopMonitoring(selectionId);
          return;
        }

        // 🎯 内容发生变化，生成新的序列化数据
        const newSerializedData = await this.generateUpdatedSelectionData(selectionId, cachedRange, cachedSelectionData);

        const changeEvent: SelectionContextChangeEvent = {
          selectionId,
          before: cachedSelectionData,
          after: {
            success: true,
            range: cachedRange,
            text: currentText,
            newSerializedData,
          },
          changeType: detectionMethod === 'mutation-observer' ? 'dom-mutation' : 'content-change',
          details: `文本内容变化: "${originalSnapshot.substring(0, 30)}..." -> "${currentText.substring(0, 30)}..."`,
          timestamp: Date.now(),
          detectionMethod,
        };

        logInfo('context-monitor', `🔍 检测到选区${selectionId}内容变化（Range缓存模式）`, {
          changeType: changeEvent.changeType,
          detectionMethod,
          originalText: originalSnapshot.substring(0, 100) + '...',
          currentText: currentText.substring(0, 100) + '...',
          originalLength: originalSnapshot.length,
          currentLength: currentText.length,
        });

        // 🔥 先更新快照，避免在回调处理期间的重复检测
        this.contentSnapshots.set(selectionId, currentText);

        // 执行回调处理
        await this.executeChangeCallback(selectionId, changeEvent, cachedSelectionData, cachedRange);
      } else {
        // 🔥 没有检测到变化 - 只记录日志，不触发回调避免死循环
        logDebug('context-monitor', `选区${selectionId}内容无变化（Range缓存模式）`, {
          text: currentText.substring(0, 50) + '...',
          textLength: currentText.length,
        });

        // 🔥 不再调用无变化回调，避免无限循环
      }
    } catch (error) {
      logError('context-monitor', `Range缓存模式检测失败，选区${selectionId}`, error);
      // 发生错误时也停止监听，避免持续错误
      this.stopMonitoring(selectionId);
    }
  }

  /**
   * 传统恢复检测模式（Fallback）
   */
  private async checkUsingRestoreMode(
    selectionId: string,
    selectionData: SerializedSelection,
    originalSnapshot: string | undefined,
    detectionMethod: 'mutation-observer' | 'content-monitor' | 'manual-trigger',
  ): Promise<void> {
    logDebug('context-monitor', `选区${selectionId}使用传统恢复模式检测`);

    // 尝试恢复选区
    const restoreResult = await restoreSelection(selectionData);

    if (!restoreResult.success) {
      // 恢复失败 - 结构可能发生了显著变化
      const changeEvent: SelectionContextChangeEvent = {
        selectionId,
        before: selectionData,
        after: {
          success: false,
          text: '',
          ...(restoreResult.error && { error: restoreResult.error }),
        },
        changeType: 'structure-change',
        details: `选区恢复失败: ${restoreResult.error || '未知错误'}`,
        timestamp: Date.now(),
        detectionMethod,
      };

      logWarn('context-monitor', `选区${selectionId}恢复失败（传统模式）`, restoreResult.error);
      await this.executeChangeCallback(selectionId, changeEvent, selectionData);
    } else if (restoreResult.range) {
      // 恢复成功，检查内容变化
      const currentText = this.safeExtractRangeText(restoreResult.range) || '';

      if (originalSnapshot && currentText !== originalSnapshot) {
        // 重新缓存恢复成功的Range
        this.activeRanges.set(selectionId, restoreResult.range.cloneRange());

        const newSerializedData = await this.generateUpdatedSelectionData(selectionId, restoreResult.range, selectionData);

        const changeEvent: SelectionContextChangeEvent = {
          selectionId,
          before: selectionData,
          after: {
            success: true,
            range: restoreResult.range,
            text: currentText,
            newSerializedData,
          },
          changeType: detectionMethod === 'mutation-observer' ? 'dom-mutation' : 'content-change',
          details: `文本内容变化: "${originalSnapshot.substring(0, 30)}..." -> "${currentText.substring(0, 30)}..."`,
          timestamp: Date.now(),
          detectionMethod,
        };

        logInfo('context-monitor', `🔍 检测到选区${selectionId}内容变化（传统模式）`, {
          changeType: changeEvent.changeType,
          currentText: currentText.substring(0, 100) + '...',
        });

        await this.executeChangeCallback(selectionId, changeEvent, selectionData, restoreResult.range);
        this.contentSnapshots.set(selectionId, currentText);
      }
    }
  }

  /**
   * 生成更新后的选区数据
   */
  private async generateUpdatedSelectionData(
    selectionId: string,
    currentRange: Range,
    originalData: SerializedSelection,
  ): Promise<SerializedSelection> {
    try {
      // 🔥 关键修复：不操作浏览器选区，直接构造更新数据
      // 避免激活Range导致选区被选中

      // 安全提取当前文本
      const currentText = this.safeExtractRangeText(currentRange);
      if (!currentText) {
        // Range失效，返回原始数据
        return originalData;
      }

      // 🔥 手动构造更新的序列化数据，而不是重新序列化
      // 这样避免了操作浏览器选区，防止干扰用户输入
      const updatedData: SerializedSelection = {
        ...originalData,
        text: currentText,
        timestamp: Date.now(),
        // 保持其他关键信息不变，如anchors, paths等
        // 这些信息在Range缓存模式下应该仍然有效
      };

      logDebug('context-monitor', `✅ 选区${selectionId}安全构造更新数据(无选区激活)`, {
        originalTextLength: originalData.text.length,
        newTextLength: currentText.length,
        hasAnchors: Array.isArray(originalData.anchors) && originalData.anchors.length > 0,
        preservedFields: ['anchors', 'paths', 'fingerprints', 'type', 'id'],
        safeMode: true, // 标记为安全模式
      });

      return updatedData;
    } catch (error) {
      logWarn('context-monitor', `构造选区${selectionId}更新数据失败`, error);
      // 返回基本更新数据
      const safeText = this.safeExtractRangeText(currentRange) || originalData.text;
      return {
        ...originalData,
        text: safeText,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 执行变化回调处理
   */
  private async executeChangeCallback(
    selectionId: string,
    changeEvent: SelectionContextChangeEvent,
    selectionData: SerializedSelection,
    currentRange?: Range,
  ): Promise<void> {
    if (!this.callback) return;

    try {
      const context = this.createCallbackContext(selectionId, selectionData, currentRange);

      // 🔥 智能防抖模式：对于auto-update策略，使用智能防抖队列
      if (this.smartDebounceEnabled && this.strategy === 'auto-update') {
        // 检查是否需要防抖处理
        if (changeEvent.changeType !== 'no-change' && changeEvent.after.success && changeEvent.after.newSerializedData) {
          logDebug('context-monitor', `使用智能防抖队列处理选区${selectionId}的更新`);
          this.enqueueUpdate(changeEvent, context);

          // 仍然调用用户回调进行通知，但不执行自动更新
          const allSelections = await this.sdkInstance.getAllSelections();
          const instance = allSelections.find(s => s.id === selectionId);
          if (instance) {
            await this.callback(changeEvent, instance as unknown as SelectionInstance, context);
          }
          return; // 跳过后续的直接处理
        }
      }

      // 🔥 传统处理模式
      // 获取选区实例
      const allSelections = await this.sdkInstance.getAllSelections();
      const instance = allSelections.find(s => s.id === selectionId);

      if (instance) {
        // 🔥 只调用用户回调，不执行内置策略避免重复处理
        await this.callback(changeEvent, instance as unknown as SelectionInstance, context);
        logDebug('context-monitor', `用户回调已执行 for ${selectionId}`);
      } else {
        // 🔥 如果没有找到实例，也直接调用回调
        await this.callback(changeEvent, {} as any, context);
        logDebug('context-monitor', `用户回调已执行（无实例） for ${selectionId}`);
      }

      // 🔥 移除内置策略的自动执行，避免与demo应用的处理重复
      // await this.executeBuiltinStrategy(changeEvent, context);

    } catch (error) {
      logError('context-monitor', `执行变化回调失败，选区${selectionId}`, error);
    }
  }

  /**
   * 创建回调上下文对象
   */
  private createCallbackContext(selectionId: string, _originalData: SerializedSelection, currentRange?: Range) {
    return {
      updateSelection: async (newData?: Partial<SerializedSelection>) => {
        if (newData) {
          await this.sdkInstance.updateSelection(selectionId, newData);

          // 🔥 关键修复：更新选区后立即更新快照
          if (newData.text) {
            this.contentSnapshots.set(selectionId, newData.text);
            logDebug('context-monitor', `选区${selectionId}快照已更新为新文本`, {
              newText: newData.text,
              textLength: newData.text.length,
            });
          }
        } else if (currentRange) {
          // 使用当前Range重新序列化
          const newSerializedData = await this.sdkInstance.serialize(selectionId);
          if (newSerializedData) {
            await this.sdkInstance.updateSelection(selectionId, newSerializedData);

            // 🔥 关键修复：同样更新快照
            this.contentSnapshots.set(selectionId, newSerializedData.text);
            logDebug('context-monitor', `选区${selectionId}快照已更新为重序列化文本`, {
              newText: newSerializedData.text,
              textLength: newSerializedData.text.length,
            });
          }
        }

        // 🔥 更新后短暂延迟，减少立即检测的可能性
        await new Promise(resolve => setTimeout(resolve, 50)); // 降低到50ms

        logInfo('context-monitor', `选区${selectionId}已通过回调更新`);
      },

      removeSelection: async () => {
        await this.sdkInstance.deleteSelection(selectionId);
        this.stopMonitoring(selectionId);
        logInfo('context-monitor', `选区${selectionId}已通过回调删除`);
      },

      reserializeFromRange: async (range: Range) => {
        // 🔥 修复：避免操作浏览器选区，直接返回基本数据
        try {
          const text = this.safeExtractRangeText(range);
          if (!text) return null;

          // 构造基本的序列化数据，避免激活Range
          return {
            ..._originalData,
            text,
            timestamp: Date.now(),
          };
        } catch (error) {
          logWarn('context-monitor', '从Range重新序列化失败', error);
          return null;
        }
      },

      getSDKInstance: () => this.sdkInstance,
    };
  }

  /**
   * 手动触发选区检查
   */
  async manualTriggerCheck(selectionId: string): Promise<void> {
    try {
      const allSelections = await this.sdkInstance.getAllSelections();
      const selectionData = allSelections.find(s => s.id === selectionId);

      if (selectionData) {
        await this.checkSelectionContext(selectionId, selectionData, 'manual-trigger');
        logInfo('context-monitor', `手动触发了选区${selectionId}的上下文检查`);
      } else {
        logWarn('context-monitor', `选区${selectionId}不存在，无法进行手动检查`);
      }
    } catch (error) {
      logError('context-monitor', `手动检查选区${selectionId}时发生错误`, error);
    }
  }

  /**
   * 批量触发所有监听选区的检查
   */
  async triggerBatchCheck(): Promise<void> {
    const selectionIds = Array.from(this.monitoringIntervals.keys());
    logInfo('context-monitor', `批量检查${selectionIds.length}个监听中的选区`);

    for (const selectionId of selectionIds) {
      await this.manualTriggerCheck(selectionId);
    }
  }

  /**
   * 更新监听配置
   */
  updateConfiguration(config: {
    callback?: SelectionContextChangeCallback;
    strategy?: SelectionContextChangeStrategy;
    detectionInterval?: number;
  }): void {
    if (config.callback !== undefined) {
      this.callback = config.callback;
    }
    if (config.strategy !== undefined) {
      this.strategy = config.strategy;
    }
    if (config.detectionInterval !== undefined) {
      this.detectionInterval = config.detectionInterval;

      // 重新启动所有监听器以应用新的间隔
      const activeSelections = new Map();
      for (const [selectionId] of this.monitoringIntervals) {
        activeSelections.set(selectionId, selectionId);
      }

      // 停止所有监听
      for (const selectionId of activeSelections.keys()) {
        this.stopMonitoring(selectionId);
      }

      // 重新启动监听（需要选区数据，这里简化处理）
      logInfo('context-monitor', '监听配置已更新，请手动重新启动需要监听的选区');
    }

    logInfo('context-monitor', '监听器配置已更新', config);
  }

  /**
   * 获取监听状态
   */
  getMonitoringStatus(): {
    activeSelections: string[];
    totalMonitored: number;
    strategy: SelectionContextChangeStrategy;
    detectionInterval: number;
    enableDOMMonitoring: boolean;
  } {
    return {
      activeSelections: Array.from(this.monitoringIntervals.keys()),
      totalMonitored: this.monitoringIntervals.size,
      strategy: this.strategy,
      detectionInterval: this.detectionInterval,
      enableDOMMonitoring: this.enableDOMMonitoring,
    };
  }

  /**
   * 销毁监听器
   */
  destroy(): void {
    // 停止所有监听器 - 确保清理所有定时器
    for (const selectionId of this.monitoringIntervals.keys()) {
      this.stopMonitoring(selectionId);
    }
    
    // 清理所有剩余的定时器（作为双重保险）
    this.monitoringIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.monitoringIntervals.clear();
    
    // 清理快速检测定时器
    this.fastChangeDetectors.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.fastChangeDetectors.clear();
    
    // 清理防抖队列中的定时器
    this.updateQueue.forEach((item) => {
      if (item.timerId) {
        clearTimeout(item.timerId);
      }
    });
    this.updateQueue.clear();

    // 断开DOM观察器
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // 清理所有数据
    this.contentSnapshots.clear();
    this.activeRanges.clear();
    this.selectionDataCache.clear();
    this.inputListeners.clear();
    this.pendingChanges.clear();
    this.processingQueue.clear();
    this.lastActivityTime.clear();
    this.updateQueue.forEach(item => {
      if (item.timerId) {
        clearTimeout(item.timerId);
      }
    });
    this.updateQueue.clear();

    logInfo('context-monitor', '上下文变化监听器已销毁');
  }

  /**
   * 启动快速变化检测
   */
  private startFastChangeDetection(selectionId: string, range: Range): void {
    try {
      // 找到包含选区的可编辑元素
      const editableElement = this.findEditableContainer(range);
      if (!editableElement) {
        logWarn('context-monitor', `无法找到选区${selectionId}的可编辑容器，跳过快速检测`);
        return;
      }

      // 🔥 创建输入事件监听器
      const inputListener = (event: Event) => {
        this.handleFastChange(selectionId, event);
      };

      // 监听多种输入事件
      const events = ['input', 'keydown', 'keyup', 'paste', 'cut'];
      events.forEach(eventType => {
        editableElement.addEventListener(eventType, inputListener);
      });

      // 保存监听器引用以便清理
      this.inputListeners.set(selectionId, inputListener);

      // 🔥 启动优化的快速检测器（降低频率以减少性能影响）
      const fastDetector = window.setInterval(() => {
        this.checkPendingChanges(selectionId);
      }, 200); // 🔥 性能优化：改为200ms，大幅降低CPU占用并避免无限循环

      this.fastChangeDetectors.set(selectionId, fastDetector);

      logDebug('context-monitor', `为选区${selectionId}启动快速变化检测`, {
        editableElement: editableElement.tagName,
        eventsCount: events.length,
        fastDetectionInterval: 200, // 更新日志中的间隔值
      });
    } catch (error) {
      logError('context-monitor', `启动快速变化检测失败，选区${selectionId}`, error);
    }
  }

  /**
   * 查找包含选区的可编辑容器
   */
  private findEditableContainer(range: Range): Element | null {
    let element = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer as Element
      : range.startContainer.parentElement;

    while (element) {
      // 🔥 更安全的检查方式
      if ((element as HTMLElement).contentEditable === 'true' ||
          element.tagName === 'TEXTAREA' ||
          element.tagName === 'INPUT' ||
          element.hasAttribute('contenteditable')) {
        return element;
      }
      element = element.parentElement;
    }

    // 如果没找到，使用document.body作为fallback
    return document.body;
  }

  /**
   * 处理快速变化事件
   */
  private handleFastChange(selectionId: string, event: Event): void {
    try {
      // 🔥 首先检查监听是否仍然活跃
      if (!this.monitoringIntervals.has(selectionId)) {
        this.stopFastChangeDetection(selectionId);
        return;
      }

      const cachedRange = this.activeRanges.get(selectionId);
      if (!cachedRange) {
        this.stopFastChangeDetection(selectionId);
        return;
      }

      // 🔥 防止事件过于频繁，使用节流
      const now = Date.now();
      const lastChange = this.pendingChanges.get(selectionId);

      // 如果距离上次处理不到50ms，则延迟处理（大幅提高到50ms减少频率）
      if (lastChange && now - lastChange.timestamp < 50) {
        return;
      }

      // 🔥 关键修复：使用安全的文本提取方法，避免激活Range
      let currentText: string;
      try {
        // 不直接调用Range.toString()，而是手动提取文本内容
        const extractedText = this.safeExtractRangeText(cachedRange);
        if (extractedText === null) {
          // Range已失效，停止快速检测和监听
          logWarn('context-monitor', `选区${selectionId}Range提取为null，停止快速检测`);
          this.stopFastChangeDetection(selectionId);
          return;
        }
        currentText = extractedText;
      } catch (rangeError) {
        // Range失效，停止快速检测和监听
        logWarn('context-monitor', `选区${selectionId}Range提取失败，停止快速检测`, rangeError);
        this.stopFastChangeDetection(selectionId);
        return;
      }

      // 🔥 检查文本是否为空但原来不为空（可能Range失效）
      const originalSnapshot = this.contentSnapshots.get(selectionId);
      if (currentText === '' && originalSnapshot && originalSnapshot.length > 0) {
        logWarn('context-monitor', `选区${selectionId}文本变为空，可能Range失效，停止快速检测`);
        this.stopFastChangeDetection(selectionId);
        return;
      }

      // 记录待处理的变化
      this.pendingChanges.set(selectionId, {
        text: currentText,
        timestamp: now,
      });

      // 🔥 记录最后活动时间，用于智能暂停
      this.lastActivityTime.set(selectionId, now);

      logDebug('context-monitor', `记录快速变化 for ${selectionId}`, {
        eventType: event.type,
        textLength: currentText.length,
        timestamp: now,
      });
    } catch (error) {
      logError('context-monitor', `处理快速变化失败，选区${selectionId}`, error);
      // 发生错误时停止快速检测
      this.stopFastChangeDetection(selectionId);
    }
  }

  /**
   * 安全地提取Range文本内容，避免激活选区
   */
  private safeExtractRangeText(range: Range): string | null {
    try {
      // 🔥 关键修复：使用Document Fragment避免激活Range
      const contents = range.cloneContents();
      return contents.textContent || '';
    } catch (error) {
      // 如果cloneContents失败，尝试遍历节点
      try {
        let text = '';
        const walker = document.createTreeWalker(
          range.commonAncestorContainer,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (range.intersectsNode(node)) {
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_REJECT;
            },
          },
        );

        let node;
        while ((node = walker.nextNode())) {
          const textNode = node as Text;
          text += textNode.textContent || '';
        }

        return text;
      } catch (fallbackError) {
        // 最后的fallback，返回null表示失效
        return null;
      }
    }
  }

  /**
   * 检查待处理的变化
   */
  private async checkPendingChanges(selectionId: string): Promise<void> {
    // 防止并发处理
    if (this.processingQueue.get(selectionId)) return;

    // 🔥 首先检查监听是否仍然活跃
    if (!this.monitoringIntervals.has(selectionId)) {
      // 监听已停止，清理快速检测
      this.stopFastChangeDetection(selectionId);
      return;
    }

    // 🔥 验证Range是否仍然有效
    const cachedRange = this.activeRanges.get(selectionId);
    if (!cachedRange) {
      // 没有有效Range，停止快速检测
      this.stopFastChangeDetection(selectionId);
      return;
    }

    // 🔥 验证Range内容是否为空（可能失效）
    try {
      const rangeText = this.safeExtractRangeText(cachedRange);
      if (rangeText === null || (rangeText === '' && this.contentSnapshots.get(selectionId))) {
        // Range失效或内容变为空，停止监听
        logWarn('context-monitor', `选区${selectionId}Range检测为空或失效，停止快速检测`);
        this.stopFastChangeDetection(selectionId);
        return;
      }
    } catch (error) {
      // Range操作失败，停止监听
      logWarn('context-monitor', `选区${selectionId}Range验证失败，停止快速检测`, error);
      this.stopFastChangeDetection(selectionId);
      return;
    }

    // 🔥 性能优化：智能暂停机制
    const lastActivity = this.lastActivityTime.get(selectionId) || 0;
    const timeSinceActivity = Date.now() - lastActivity;

    // 如果超过2秒没有活动，跳过检测以节省性能
    if (timeSinceActivity > 2000) {
      return;
    }

    const pendingChange = this.pendingChanges.get(selectionId);
    if (!pendingChange) return;

    const originalSnapshot = this.contentSnapshots.get(selectionId);
    if (!originalSnapshot || originalSnapshot === pendingChange.text) return;

    // 🔥 性能优化：如果变化太老（超过500ms），跳过处理
    if (Date.now() - pendingChange.timestamp > 500) {
      this.pendingChanges.delete(selectionId);
      return;
    }

    // 标记为处理中
    this.processingQueue.set(selectionId, true);

    try {
      const cachedSelectionData = this.selectionDataCache.get(selectionId);

      if (cachedRange && cachedSelectionData) {
        logInfo('context-monitor', `🚀 快速检测到选区${selectionId}变化`, {
          originalLength: originalSnapshot.length,
          newLength: pendingChange.text.length,
          timeSinceChange: Date.now() - pendingChange.timestamp,
        });

        // 生成新的序列化数据
        const newSerializedData = await this.generateUpdatedSelectionData(
          selectionId,
          cachedRange,
          cachedSelectionData,
        );

        const changeEvent: SelectionContextChangeEvent = {
          selectionId,
          before: cachedSelectionData,
          after: {
            success: true,
            range: cachedRange,
            text: pendingChange.text,
            newSerializedData,
          },
          changeType: 'fast-input',
          details: `快速输入变化: "${originalSnapshot.substring(0, 30)}..." -> "${pendingChange.text.substring(0, 30)}..."`,
          timestamp: pendingChange.timestamp,
          detectionMethod: 'fast-detector',
        };

        // 更新快照
        this.contentSnapshots.set(selectionId, pendingChange.text);

        // 清除待处理的变化
        this.pendingChanges.delete(selectionId);

        // 执行回调
        await this.executeChangeCallback(selectionId, changeEvent, cachedSelectionData, cachedRange);
      }
    } catch (error) {
      logError('context-monitor', `处理待处理变化失败，选区${selectionId}`, error);
    } finally {
      // 清除处理标记
      this.processingQueue.set(selectionId, false);
    }
  }

  /**
   * 停止快速变化检测
   */
  private stopFastChangeDetection(selectionId: string): void {
    // 清理快速检测器
    const fastDetector = this.fastChangeDetectors.get(selectionId);
    if (fastDetector) {
      clearInterval(fastDetector);
      this.fastChangeDetectors.delete(selectionId);
    }

    // 清理输入监听器
    const inputListener = this.inputListeners.get(selectionId);
    if (inputListener) {
      // 需要找到对应的元素来移除监听器
      const cachedRange = this.activeRanges.get(selectionId);
      if (cachedRange) {
        const editableElement = this.findEditableContainer(cachedRange);
        if (editableElement) {
          const events = ['input', 'keydown', 'keyup', 'paste', 'cut'];
          events.forEach(eventType => {
            editableElement.removeEventListener(eventType, inputListener);
          });
        }
      }
      this.inputListeners.delete(selectionId);
    }

    // 清理其他相关数据
    this.pendingChanges.delete(selectionId);
    this.processingQueue.delete(selectionId);
    this.lastActivityTime.delete(selectionId);

    logDebug('context-monitor', `停止选区${selectionId}的快速变化检测`);
  }

  // 🔥 ===== 智能防抖队列系统 =====

  /**
   * 智能防抖延迟计算
   */
  private calculateDebounceDelay(selectionId: string, event: SelectionContextChangeEvent): number {
    const existingItem = this.updateQueue.get(selectionId);
    const now = Date.now();

    if (!existingItem) {
      // 第一次入队，使用基础延迟
      return this.BASE_DEBOUNCE_DELAY;
    }

    // 计算活动频率
    const timeSinceLastUpdate = now - existingItem.timestamp;
    const totalActiveSelections = this.updateQueue.size;

    // 🔥 基于输入类型的智能调整
    let baseDelay = this.BASE_DEBOUNCE_DELAY;

    if (event.detectionMethod === 'fast-detector') {
      // 快速检测器通常意味着用户正在快速输入
      baseDelay = this.BASE_DEBOUNCE_DELAY + 300; // 额外300ms
    }

    // 🔥 基于活动频率的动态调整
    if (timeSinceLastUpdate < this.ACTIVITY_THRESHOLD) {
      // 高频活动，使用更长的延迟
      const frequencyMultiplier = Math.min(totalActiveSelections * 0.5, 3); // 最多3倍
      const dynamicDelay = baseDelay + (frequencyMultiplier * 200);

      logDebug('context-monitor', `智能防抖计算: ${selectionId.substring(0, 15)}`, {
        timeSinceLastUpdate,
        totalActiveSelections,
        frequencyMultiplier,
        baseDelay,
        finalDelay: Math.min(dynamicDelay, this.MAX_DEBOUNCE_DELAY),
        detectionMethod: event.detectionMethod,
      });

      return Math.min(dynamicDelay, this.MAX_DEBOUNCE_DELAY);
    }

    // 低频活动，使用基础延迟
    return baseDelay;
  }

  /**
   * 添加到智能防抖队列
   */
  private enqueueUpdate(
    event: SelectionContextChangeEvent,
    context: any,
  ): void {
    const selectionId = event.selectionId;

    // 🔥 去重检查：如果队列中已有相同的事件，跳过
    const existingItem = this.updateQueue.get(selectionId);
    if (existingItem) {
      // 检查是否是相同的变化内容
      const isSameChange =
        existingItem.event.changeType === event.changeType &&
        existingItem.event.before.text === event.before.text &&
        existingItem.event.after.text === event.after.text;

      if (isSameChange) {
        logDebug('context-monitor', `跳过重复事件: ${selectionId.substring(0, 15)}`, {
          changeType: event.changeType,
          detectionMethod: event.detectionMethod,
        });
        return; // 跳过重复事件
      }

      // 不同的变化，清除旧定时器
      if (existingItem.timerId) {
        clearTimeout(existingItem.timerId);
      }
      logDebug('context-monitor', `更新不同变化，延长防抖: ${selectionId.substring(0, 15)}`);
    }

    // 🔥 计算智能防抖延迟
    const dynamicDelay = this.calculateDebounceDelay(selectionId, event);

    // 创建新的防抖定时器
    const timerId = window.setTimeout(() => {
      this.processUpdateQueue(selectionId);
    }, dynamicDelay);

    // 添加到队列（覆盖旧的）
    this.updateQueue.set(selectionId, {
      event,
      context,
      timestamp: Date.now(),
      timerId,
    });

    logDebug('context-monitor', `${existingItem ? '智能防抖延长' : '添加队列'}: ${selectionId.substring(0, 15)}`, {
      queueSize: this.updateQueue.size,
      dynamicDelay,
      isDebounceExtension: !!existingItem,
      changeType: event.changeType,
      detectionMethod: event.detectionMethod,
      beforeText: event.before.text?.substring(0, 20),
      afterText: event.after.text?.substring(0, 20),
    });
  }

  /**
   * 处理智能防抖队列中的更新
   */
  private async processUpdateQueue(selectionId: string): Promise<void> {
    const queueItem = this.updateQueue.get(selectionId);
    if (!queueItem) return;

    const { event, context } = queueItem;
    logInfo('context-monitor', `处理消息队列中的更新: ${selectionId.substring(0, 15)}`, {
      delayedTime: Date.now() - queueItem.timestamp,
      eventType: event.changeType,
      detectionMethod: event.detectionMethod,
      isFailureEvent: (event as any).isFailureEvent,
      isFailureContext: context.isFailureContext,
    });

    // 从队列中移除
    this.updateQueue.delete(selectionId);

    try {
      // 🔥 处理失败事件：检查是否仍然失败，如果是则停止监听
      if ((event as any).isFailureEvent || context.isFailureContext) {
        logDebug('context-monitor', '处理恢复失败事件，重新检查选区状态');

        // 重新检查选区是否仍然失败
        try {
          const allSelections = await this.sdkInstance.getAllSelections();
          const currentSelection = allSelections.find(s => s.id === event.selectionId);
          if (currentSelection) {
            logInfo('context-monitor', '选区现在可以正常恢复，继续监听');
            return; // 不需要进一步处理
          }
        } catch (checkError) {
          logWarn('context-monitor', '重新检查选区失败，停止监听:', checkError);
        }

        // 仍然失败，停止监听
        try {
          this.stopMonitoring(event.selectionId);
          logInfo('context-monitor', '已停止监听失败的选区:', event.selectionId);
        } catch (stopError) {
          logError('context-monitor', '停止监听失败:', stopError);
        }

        return; // 失败事件处理完毕
      }

      // 🔥 处理正常更新事件
      if (event.after.success && event.after.newSerializedData) {
        const newData = event.after.newSerializedData;

        // 执行SDK层面的更新
        await context.updateSelection(newData);
        logInfo('context-monitor', '队列处理：SDK层面更新完成');

        logInfo('context-monitor', '防抖自动更新完成');
      }
    } catch (error) {
      logError('context-monitor', '队列处理失败:', error);
    }
  }

  /**
   * 启用智能防抖队列更新模式（替代直接回调处理）
   */
  public enableSmartDebounce(): void {
    this.smartDebounceEnabled = true;
    logInfo('context-monitor', '启用智能防抖队列模式', {
      baseDelay: this.BASE_DEBOUNCE_DELAY,
      maxDelay: this.MAX_DEBOUNCE_DELAY,
      activityThreshold: this.ACTIVITY_THRESHOLD,
    });
  }

  /**
   * 禁用智能防抖队列更新模式
   */
  public disableSmartDebounce(): void {
    this.smartDebounceEnabled = false;

    // 清理现有队列
    this.updateQueue.forEach(item => {
      if (item.timerId) {
        clearTimeout(item.timerId);
      }
    });
    this.updateQueue.clear();

    logInfo('context-monitor', '禁用智能防抖队列模式');
  }
}
