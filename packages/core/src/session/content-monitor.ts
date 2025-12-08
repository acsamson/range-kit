/**
 * 选区内容监控器
 *
 * 负责监控选区内容的变化
 * 当选区对应的DOM内容发生变化时触发回调
 */

import { logWarn, logError } from '../common/debug';
import { restoreSelection } from '../locator/restorer';
import type {
  SerializedSelection,
  SelectionChangeInfo,
  SelectionInstance,
} from '../types';

/**
 * 内容变化回调类型
 */
export type ContentChangeCallback = (
  changeInfo: SelectionChangeInfo,
  instance: SelectionInstance
) => void;

/**
 * 获取选区实例回调类型
 */
export type GetSelectionInstanceCallback = (id: string) => {
  instance: SelectionInstance;
  data: SerializedSelection;
} | undefined;

/**
 * 选区内容监控器
 * 定期检查选区内容是否发生变化
 */
export class ContentMonitor {
  /** 监控定时器映射 */
  private monitoringIntervals: Map<string, number> = new Map();
  /** 内容哈希映射（用于检测变化） */
  private contentHashes: Map<string, string> = new Map();
  /** 监控间隔时间 */
  private monitoringInterval: number;
  /** 内容变化回调 */
  private onContentChange?: ContentChangeCallback;
  /** 获取选区实例回调 */
  private getSelectionInstance: GetSelectionInstanceCallback;

  constructor(
    monitoringInterval: number,
    getSelectionInstance: GetSelectionInstanceCallback,
    onContentChange?: ContentChangeCallback
  ) {
    this.monitoringInterval = monitoringInterval;
    this.getSelectionInstance = getSelectionInstance;
    this.onContentChange = onContentChange;
  }

  /**
   * 开始监控选区内容变化
   * @param id - 选区ID
   * @param data - 选区数据
   */
  startMonitoring(id: string, data: SerializedSelection): void {
    // 记录初始内容哈希
    this.contentHashes.set(id, this.calculateContentHash(data));

    const intervalId = window.setInterval(() => {
      this.checkSelectionChanges(id);
    }, this.monitoringInterval);

    this.monitoringIntervals.set(id, intervalId);
  }

  /**
   * 停止监控选区内容变化
   * @param id - 选区ID
   */
  stopMonitoring(id: string): void {
    const intervalId = this.monitoringIntervals.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(id);
    }
    this.contentHashes.delete(id);
  }

  /**
   * 检查选区内容变化
   * @param id - 选区ID
   */
  private async checkSelectionChanges(id: string): Promise<void> {
    const selectionInfo = this.getSelectionInstance(id);
    if (!selectionInfo) return;

    const { instance, data } = selectionInfo;

    try {
      // 尝试恢复选区以获取当前状态
      const result = await restoreSelection(data);
      if (!result.success || !result.range) return;

      // 计算当前内容哈希
      const currentText = result.range.toString();
      const currentHash = this.calculateContentHash({ ...data, text: currentText });
      const originalHash = this.contentHashes.get(id);

      if (originalHash && currentHash !== originalHash) {
        // 内容发生变化，触发回调
        const changeInfo: SelectionChangeInfo = {
          before: data,
          after: { ...data, text: currentText },
          changeType: 'content',
          details: `文本内容从 "${data.text.substring(0, 30)}..." 变更为 "${currentText.substring(0, 30)}..."`,
          timestamp: Date.now(),
          changeMagnitude: Math.abs(currentText.length - data.text.length) /
            Math.max(currentText.length, data.text.length),
        };

        logWarn('content-monitor', '检测到选区内容变化', {
          id,
          originalText: data.text.substring(0, 50),
          currentText: currentText.substring(0, 50),
        });

        // 调用变化回调
        if (this.onContentChange) {
          this.onContentChange(changeInfo, instance);
        }

        // 更新内容哈希
        this.contentHashes.set(id, currentHash);
      }
    } catch (error) {
      logError('content-monitor', '检查选区变化时发生错误', { id, error });
    }
  }

  /**
   * 计算内容哈希（支持 Unicode）
   * @param data - 选区数据
   * @returns 哈希字符串
   */
  private calculateContentHash(data: SerializedSelection): string {
    const paths = data.restore?.paths;
    const content = `${data.text}|${paths?.startPath || ''}|${paths?.endPath || ''}`;
    // 使用简单的字符串哈希算法（djb2），支持 Unicode
    let hash = 5381;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) + hash) + content.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 设置内容变化回调
   * @param callback - 回调函数
   */
  setOnContentChange(callback: ContentChangeCallback): void {
    this.onContentChange = callback;
  }

  /**
   * 获取监控的选区数量
   * @returns 数量
   */
  getMonitoringCount(): number {
    return this.monitoringIntervals.size;
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    // 停止所有监控
    for (const intervalId of this.monitoringIntervals.values()) {
      clearInterval(intervalId);
    }
    this.monitoringIntervals.clear();
    this.contentHashes.clear();
    this.onContentChange = undefined;
  }
}
