/**
 * 选区注册表 (SelectionRegistry)
 *
 * 职责单一：只负责选区实例和 Range 的存取
 * 不包含任何业务逻辑或副作用操作
 */

import type { SerializedSelection, SelectionInstance } from '../types';
import { SelectionInstanceImpl } from './selection-instance';
import type { SelectionManagerContext } from './types';

/**
 * 选区注册表
 * 负责管理选区实例和活跃 Range 的存取
 */
export class SelectionRegistry {
  /** 选区实例映射 */
  private selections: Map<string, SelectionInstanceImpl> = new Map();

  /** 活跃 Range 映射 */
  private activeRanges: Map<string, Range> = new Map();

  /** 选区高亮 ID 映射 */
  private selectionHighlights: Map<string, string> = new Map();

  // ===== 选区实例管理 =====

  /**
   * 添加选区实例
   */
  add(instance: SelectionInstanceImpl): void {
    this.selections.set(instance.id, instance);
  }

  /**
   * 移除选区实例
   */
  remove(id: string): SelectionInstanceImpl | undefined {
    const instance = this.selections.get(id);
    if (instance) {
      this.selections.delete(id);
    }
    return instance;
  }

  /**
   * 获取选区实例
   */
  get(id: string): SelectionInstanceImpl | undefined {
    return this.selections.get(id);
  }

  /**
   * 检查选区是否存在
   */
  has(id: string): boolean {
    return this.selections.has(id);
  }

  /**
   * 获取所有选区实例
   */
  getAll(): SelectionInstanceImpl[] {
    return Array.from(this.selections.values());
  }

  /**
   * 获取所有选区数据
   */
  getAllData(): SerializedSelection[] {
    return this.getAll().map(instance => instance.data);
  }

  /**
   * 获取选区数量
   */
  get size(): number {
    return this.selections.size;
  }

  // ===== Range 管理 =====

  /**
   * 注册活跃 Range
   * @returns 是否为新增（数量发生变化）
   */
  registerRange(selectionId: string, range: Range): boolean {
    const prevSize = this.activeRanges.size;
    this.activeRanges.set(selectionId, range.cloneRange());
    return this.activeRanges.size !== prevSize;
  }

  /**
   * 移除活跃 Range
   * @returns 是否成功删除
   */
  unregisterRange(selectionId: string): boolean {
    return this.activeRanges.delete(selectionId);
  }

  /**
   * 获取活跃 Range
   * @returns Range 的克隆（防止外部修改污染内部状态）
   */
  getRange(selectionId: string): Range | undefined {
    const range = this.activeRanges.get(selectionId);
    return range ? range.cloneRange() : undefined;
  }

  /**
   * 检查是否存在活跃 Range
   */
  hasRange(selectionId: string): boolean {
    return this.activeRanges.has(selectionId);
  }

  /**
   * 获取所有活跃 Range 的 ID
   */
  getAllRangeIds(): string[] {
    return Array.from(this.activeRanges.keys());
  }

  /**
   * 获取所有活跃 Range（原始引用，用于遍历检测）
   */
  getAllRanges(): Map<string, Range> {
    return this.activeRanges;
  }

  /**
   * 获取活跃 Range 数量
   */
  get rangeCount(): number {
    return this.activeRanges.size;
  }

  /**
   * 清除所有活跃 Range
   * @returns 是否有数据被清除
   */
  clearAllRanges(): boolean {
    const hadRanges = this.activeRanges.size > 0;
    this.activeRanges.clear();
    return hadRanges;
  }

  // ===== 高亮 ID 管理 =====

  /**
   * 设置高亮 ID
   */
  setHighlightId(selectionId: string, highlightId: string): void {
    this.selectionHighlights.set(selectionId, highlightId);
  }

  /**
   * 获取高亮 ID
   */
  getHighlightId(selectionId: string): string | undefined {
    return this.selectionHighlights.get(selectionId);
  }

  /**
   * 移除高亮 ID
   */
  removeHighlightId(selectionId: string): string | undefined {
    const highlightId = this.selectionHighlights.get(selectionId);
    if (highlightId) {
      this.selectionHighlights.delete(selectionId);
    }
    return highlightId;
  }

  /**
   * 获取高亮映射（用于外部访问）
   */
  getHighlightMap(): Map<string, string> {
    return this.selectionHighlights;
  }

  // ===== 清理 =====

  /**
   * 清除所有数据
   */
  clear(): void {
    this.selections.clear();
    this.activeRanges.clear();
    this.selectionHighlights.clear();
  }
}
