import { SelectionContextChangeMonitor } from '../monitor/context-change-monitor';
import { SerializedSelection, SelectionContextChangeCallback, SelectionContextChangeStrategy } from '../types';
import { logInfo, logWarn } from '../debug/logger';

export interface ContextOptions {
  enableContextChangeMonitoring?: boolean;
  contextChangeStrategy?: SelectionContextChangeStrategy;
  contextChangeDetectionInterval?: number;
  enableDOMChangeMonitoring?: boolean;
  domChangeTargetContainers?: string[];
  onSelectionContextChange?: SelectionContextChangeCallback;
}

/**
 * 上下文管理器 - 负责选区上下文变化的监听和管理
 */
export class SelectionContext {
  private monitor: SelectionContextChangeMonitor | undefined;
  private options: ContextOptions;

  constructor(options: ContextOptions) {
    this.options = options;
    this.initializeMonitor();
  }

  /**
   * 初始化上下文变化监听器
   */
  private initializeMonitor(): void {
    if (this.options.enableContextChangeMonitoring) {
      const config: Record<string, unknown> = {
        strategy: this.options.contextChangeStrategy || 'auto-update',
        detectionInterval: this.options.contextChangeDetectionInterval || 1000,
        enableDOMMonitoring: this.options.enableDOMChangeMonitoring || false,
        targetContainers: this.options.domChangeTargetContainers || [],
      };

      if (this.options.onSelectionContextChange) {
        config.callback = this.options.onSelectionContextChange;
      }

      this.monitor = new SelectionContextChangeMonitor(null as any, config);

      logInfo('context', '上下文变化监听器已初始化', {
        strategy: this.options.contextChangeStrategy,
        detectionInterval: this.options.contextChangeDetectionInterval,
      });
    }
  }

  /**
   * 启用上下文变化监听
   */
  enable(callback?: SelectionContextChangeCallback): void {
    this.options.enableContextChangeMonitoring = true;
    if (callback) {
      this.options.onSelectionContextChange = callback;
    }

    if (!this.monitor) {
      this.initializeMonitor();
    }

    logInfo('context', '上下文变化监听已启用');
  }

  /**
   * 禁用上下文变化监听
   */
  disable(): void {
    this.options.enableContextChangeMonitoring = false;

    if (this.monitor) {
      this.monitor.destroy();
      this.monitor = undefined;
    }

    logInfo('context', '上下文变化监听已禁用');
  }

  /**
   * 为选区启动上下文变化监听
   */
  async startMonitoring(selectionId: string, selectionData?: SerializedSelection): Promise<void> {
    if (!this.monitor) {
      logWarn('context', '上下文变化监听器未启用');
      return;
    }

    try {
      await this.monitor.startMonitoring(selectionId, selectionData || {} as SerializedSelection);
      logInfo('context', `已为选区 ${selectionId} 启动上下文变化监听`);
    } catch (error) {
      logWarn('context', `为选区 ${selectionId} 启动监听失败`, error);
    }
  }

  /**
   * 停止选区的上下文变化监听
   */
  stopMonitoring(selectionId: string): void {
    if (!this.monitor) {
      logWarn('context', '上下文变化监听器未启用');
      return;
    }

    this.monitor.stopMonitoring(selectionId);
    logInfo('context', `已停止选区 ${selectionId} 的上下文变化监听`);
  }

  /**
   * 更新上下文变化配置
   */
  updateConfiguration(config: {
    callback?: SelectionContextChangeCallback;
    strategy?: SelectionContextChangeStrategy;
    detectionInterval?: number;
  }): void {
    if (config.callback !== undefined) {
      this.options.onSelectionContextChange = config.callback;
    }
    if (config.strategy !== undefined) {
      this.options.contextChangeStrategy = config.strategy;
    }
    if (config.detectionInterval !== undefined) {
      this.options.contextChangeDetectionInterval = config.detectionInterval;
    }

    if (this.monitor) {
      this.monitor.updateConfiguration(config);
    }

    logInfo('context', '上下文变化配置已更新', config);
  }

  /**
   * 获取监听状态
   */
  getStatus(): {
    enabled: boolean;
    activeSelections: string[];
    totalMonitored: number;
    strategy: SelectionContextChangeStrategy;
    detectionInterval: number;
    enableDOMMonitoring: boolean;
  } | null {
    if (!this.monitor) {
      return null;
    }

    const status = this.monitor.getMonitoringStatus();
    return {
      enabled: this.options.enableContextChangeMonitoring || false,
      ...status,
      enableDOMMonitoring: this.options.enableDOMChangeMonitoring || false,
    };
  }

  /**
   * 启用智能防抖
   */
  enableSmartDebounce(): void {
    if (!this.monitor) {
      logWarn('context', '上下文变化监听器未启用，无法启用智能防抖');
      return;
    }

    this.monitor.enableSmartDebounce();
    logInfo('context', '智能防抖队列模式已启用');
  }

  /**
   * 禁用智能防抖
   */
  disableSmartDebounce(): void {
    if (!this.monitor) {
      logWarn('context', '上下文变化监听器未启用，无法禁用智能防抖');
      return;
    }

    this.monitor.disableSmartDebounce();
    logInfo('context', '智能防抖队列模式已禁用');
  }

  /**
   * 手动触发选区上下文检查
   */
  async triggerContextCheck(selectionId?: string): Promise<void> {
    if (!this.monitor) {
      logWarn('context', '上下文变化监听器未启用');
      return;
    }

    if (selectionId) {
      await this.monitor.manualTriggerCheck(selectionId);
    } else {
      await this.monitor.triggerBatchCheck();
    }
  }

  /**
   * 销毁监听器
   */
  destroy(): void {
    if (this.monitor) {
      this.monitor.destroy();
      this.monitor = undefined;
    }
  }
}
