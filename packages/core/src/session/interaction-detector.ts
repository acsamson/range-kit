/**
 * 选区交互检测器
 *
 * 负责检测鼠标位置是否在选区范围内
 * 提供点击、悬浮等交互的选区检测功能
 */

import { logWarn } from '../common/debug';
import { RangeCacheManager } from './cache-manager';
import { CachedRangeInfo, DetectedSelectionInfo, PERFORMANCE_CONFIG } from './types';
import type { SerializedSelection } from '../types';

/**
 * 选区交互检测器
 * 用于检测鼠标交互位置对应的选区
 */
export class InteractionDetector {
  /** Range缓存管理器 */
  private cacheManager: RangeCacheManager;
  /** 活跃Range映射的引用 */
  private activeRanges: Map<string, Range>;
  /** 获取选区数据的回调 */
  private getSelectionData: (id: string) => { text: string; data: SerializedSelection } | undefined;

  /** 上次检测时间戳 */
  private lastDetectionTime = 0;
  /** 当前悬浮的选区ID */
  private currentHoveredSelection: string | null = null;

  constructor(
    cacheManager: RangeCacheManager,
    activeRanges: Map<string, Range>,
    getSelectionData: (id: string) => { text: string; data: SerializedSelection } | undefined
  ) {
    this.cacheManager = cacheManager;
    this.activeRanges = activeRanges;
    this.getSelectionData = getSelectionData;
  }

  /**
   * 快速边界检查（使用缓存的boundingRect）
   * @param x - X坐标
   * @param y - Y坐标
   * @param boundingRect - 边界矩形
   * @returns 是否在边界内
   */
  private isPointInBoundingRect(x: number, y: number, boundingRect: DOMRect): boolean {
    const tolerance = 2;
    return x >= boundingRect.left - tolerance &&
           x <= boundingRect.right + tolerance &&
           y >= boundingRect.top - tolerance &&
           y <= boundingRect.bottom + tolerance;
  }

  /**
   * 检测点是否在Range范围内
   * @param x - X坐标
   * @param y - Y坐标
   * @param cachedInfo - 缓存的Range信息
   * @returns 是否在范围内
   */
  private isPointInRange(x: number, y: number, cachedInfo: CachedRangeInfo): boolean {
    try {
      // 第一步：快速边界检查
      if (!this.isPointInBoundingRect(x, y, cachedInfo.boundingRect)) {
        return false;
      }

      // 第二步：详细检测（只有通过边界检查的才会执行）
      const rects = cachedInfo.rects;
      const tolerance = 2;

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (x >= rect.left - tolerance &&
            x <= rect.right + tolerance &&
            y >= rect.top - tolerance &&
            y <= rect.bottom + tolerance) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logWarn('interaction-detector', 'Range检测出错:', error);
      return false;
    }
  }

  /**
   * 检测指定坐标点的选区（带节流和缓存）
   * 优先使用DOM elementFromPoint检测最上层元素，降级使用Range边界检测
   * @param x - X坐标
   * @param y - Y坐标
   * @returns 选区ID或null
   */
  detectSelectionAtPoint(x: number, y: number): string | null {
    // 检测节流
    const now = Date.now();
    if (now - this.lastDetectionTime < PERFORMANCE_CONFIG.DETECTION_THROTTLE) {
      return this.currentHoveredSelection;
    }
    this.lastDetectionTime = now;

    if (this.activeRanges.size === 0) {
      return null;
    }

    // 优先方案：使用DOM检测最上层的高亮元素
    try {
      const elementAtPoint = document.elementFromPoint(x, y);
      if (elementAtPoint) {
        const selectionElement = elementAtPoint.closest('[data-selection-id]');
        if (selectionElement) {
          const selectionId = selectionElement.getAttribute('data-selection-id');
          if (selectionId && this.activeRanges.has(selectionId)) {
            this.currentHoveredSelection = selectionId;
            return selectionId;
          }
        }
      }
    } catch (error) {
      logWarn('interaction-detector', 'DOM元素检测失败，使用降级方案', error);
    }

    // 降级方案：使用Range边界检测（遍历所有选区）
    for (const [selectionId, range] of this.activeRanges.entries()) {
      const cachedInfo = this.cacheManager.getCachedRangeInfo(selectionId, range);

      if (this.isPointInRange(x, y, cachedInfo)) {
        this.currentHoveredSelection = selectionId;
        return selectionId;
      }
    }

    this.currentHoveredSelection = null;
    return null;
  }

  /**
   * 检测指定坐标点的所有选区（返回所有重叠的选区）
   * @param x - X坐标
   * @param y - Y坐标
   * @returns 包含该点的所有选区信息数组
   */
  detectAllSelectionsAtPoint(x: number, y: number): DetectedSelectionInfo[] {
    const results: DetectedSelectionInfo[] = [];

    if (this.activeRanges.size === 0) {
      return results;
    }

    // 遍历所有活跃的选区，检查点是否在范围内
    for (const [selectionId, range] of this.activeRanges.entries()) {
      const cachedInfo = this.cacheManager.getCachedRangeInfo(selectionId, range);

      if (this.isPointInRange(x, y, cachedInfo)) {
        const selectionInfo = this.getSelectionData(selectionId);
        if (selectionInfo) {
          results.push({
            selectionId,
            text: selectionInfo.text,
            selectionData: selectionInfo.data,
          });
        }
      }
    }

    return results;
  }

  /**
   * 获取当前悬浮的选区ID
   * @returns 选区ID或null
   */
  getCurrentHoveredSelection(): string | null {
    return this.currentHoveredSelection;
  }

  /**
   * 设置当前悬浮的选区ID
   * @param selectionId - 选区ID或null
   */
  setCurrentHoveredSelection(selectionId: string | null): void {
    this.currentHoveredSelection = selectionId;
  }

  /**
   * 重置检测状态
   */
  reset(): void {
    this.currentHoveredSelection = null;
    this.lastDetectionTime = 0;
  }
}
