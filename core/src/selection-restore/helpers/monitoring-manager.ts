/**
 * 监控管理器
 * 处理上下文变化监控相关功能
 */

import { SerializedSelection, SelectionContextChangeCallback, SelectionContextChangeStrategy } from '../types';
import { SelectionContext } from '../core/selection-context';

export interface MonitoringManagerDependencies {
  context: SelectionContext;
}

/**
 * 监控管理器
 */
export class MonitoringManager {
  constructor(private deps: MonitoringManagerDependencies) {}

  /**
   * 启用上下文变化监听
   */
  enableContextChangeMonitoring(callback?: SelectionContextChangeCallback): void {
    this.deps.context.enable(callback);
  }

  /**
   * 禁用上下文变化监听
   */
  disableContextChangeMonitoring(): void {
    this.deps.context.disable();
  }

  /**
   * 更新上下文变化监听配置
   */
  updateContextChangeMonitoringConfig(config: {
    callback?: SelectionContextChangeCallback;
    strategy?: SelectionContextChangeStrategy;
    detectionInterval?: number;
  }): void {
    this.deps.context.updateConfiguration(config);
  }

  /**
   * 启用智能防抖
   */
  enableSmartDebounce(): void {
    this.deps.context.enableSmartDebounce();
  }

  /**
   * 禁用智能防抖
   */
  disableSmartDebounce(): void {
    this.deps.context.disableSmartDebounce();
  }

  /**
   * 手动触发选区上下文检查
   */
  async triggerContextCheck(selectionId?: string): Promise<void> {
    if (selectionId) {
      await this.deps.context.triggerContextCheck(selectionId);
    } else {
      await this.deps.context.triggerContextCheck();
    }
  }

  /**
   * 获取上下文变化监听状态
   */
  getContextChangeMonitoringStatus() {
    return this.deps.context.getStatus();
  }

  /**
   * 为特定选区启动上下文变化监听
   */
  async startMonitoringSelection(selectionId: string, selectionData?: SerializedSelection): Promise<void> {
    await this.deps.context.startMonitoring(selectionId, selectionData);
  }

  /**
   * 停止特定选区的上下文变化监听
   */
  stopMonitoringSelection(selectionId: string): void {
    this.deps.context.stopMonitoring(selectionId);
  }

  /**
   * 批量启动多个选区的上下文变化监听
   */
  async startMonitoringMultipleSelections(selections: SerializedSelection[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ selectionId: string; error: string; }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ selectionId: string; error: string; }>,
    };

    for (const selection of selections) {
      try {
        await this.deps.context.startMonitoring(selection.id, selection);
        results.success++;
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push({ selectionId: selection.id, error: errorMsg });
      }
    }

    return results;
  }

  /**
   * 销毁监控管理器
   */
  destroy(): void {
    this.deps.context.destroy();
  }
}
