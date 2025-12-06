/**
 * Range管理器
 *
 * 负责管理已恢复选区的Range对象
 * 提供Range的注册、注销和查询功能
 */

import { RangeCacheManager } from './cache-manager';
import type { ActiveRangesChangeData } from './types';

/**
 * Range管理器
 * 管理所有活跃选区的Range对象
 */
export class RangeManager {
  /** 活跃Range映射 */
  private activeRanges: Map<string, Range> = new Map();
  /** Range缓存管理器 */
  private cacheManager: RangeCacheManager;
  /** 活跃Range变化回调 */
  private onActiveRangesChange?: (data: ActiveRangesChangeData) => void;

  constructor(
    cacheManager: RangeCacheManager,
    onActiveRangesChange?: (data: ActiveRangesChangeData) => void
  ) {
    this.cacheManager = cacheManager;
    this.onActiveRangesChange = onActiveRangesChange;
  }

  /**
   * 获取活跃Range映射（用于检测器访问）
   * @returns 活跃Range映射
   */
  getActiveRanges(): Map<string, Range> {
    return this.activeRanges;
  }

  /**
   * 获取已注册的选区Range
   * @param selectionId - 选区ID
   * @returns Range的克隆（防止外部修改污染内部状态）
   */
  getActiveRange(selectionId: string): Range | undefined {
    const range = this.activeRanges.get(selectionId);
    return range ? range.cloneRange() : undefined;
  }

  /**
   * 获取所有活跃选区的ID列表
   * @returns 选区ID数组
   */
  getAllActiveSelectionIds(): string[] {
    return Array.from(this.activeRanges.keys());
  }

  /**
   * 注册已恢复的选区Range
   * @param selectionId - 选区ID
   * @param range - Range对象
   */
  registerActiveRange(selectionId: string, range: Range): void {
    const prevCount = this.activeRanges.size;
    this.activeRanges.set(selectionId, range.cloneRange());

    // 清除对应的缓存，强制重新计算
    this.cacheManager.deleteCache(selectionId);

    // 如果数量变化，触发回调
    if (this.activeRanges.size !== prevCount) {
      this.notifyActiveRangesChange();
    }
  }

  /**
   * 移除已注册的选区Range
   * @param selectionId - 选区ID
   */
  unregisterActiveRange(selectionId: string): void {
    const existed = this.activeRanges.has(selectionId);
    this.activeRanges.delete(selectionId);

    // 清除对应的缓存
    this.cacheManager.deleteCache(selectionId);

    // 如果确实删除了，触发回调
    if (existed) {
      this.notifyActiveRangesChange();
    }
  }

  /**
   * 清除所有已注册的Range
   */
  clearAllActiveRanges(): void {
    const hadRanges = this.activeRanges.size > 0;
    this.activeRanges.clear();

    // 清除所有缓存
    this.cacheManager.clearAll();

    // 如果之前有数据，触发回调
    if (hadRanges) {
      this.notifyActiveRangesChange();
    }
  }

  /**
   * 检查是否存在指定的活跃Range
   * @param selectionId - 选区ID
   * @returns 是否存在
   */
  hasActiveRange(selectionId: string): boolean {
    return this.activeRanges.has(selectionId);
  }

  /**
   * 获取活跃Range数量
   * @returns 数量
   */
  getActiveRangeCount(): number {
    return this.activeRanges.size;
  }

  /**
   * 设置活跃Range变化回调
   * @param callback - 回调函数
   */
  setOnActiveRangesChange(callback: (data: ActiveRangesChangeData) => void): void {
    this.onActiveRangesChange = callback;
  }

  /**
   * 通知活跃Range数量变化
   */
  private notifyActiveRangesChange(): void {
    if (this.onActiveRangesChange) {
      this.onActiveRangesChange({
        count: this.activeRanges.size,
        ids: Array.from(this.activeRanges.keys()),
      });
    }
  }

  /**
   * 销毁Range管理器
   */
  destroy(): void {
    this.activeRanges.clear();
    this.onActiveRangesChange = undefined;
  }
}
