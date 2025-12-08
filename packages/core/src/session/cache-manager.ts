/**
 * Range缓存管理器
 *
 * 负责缓存Range边界信息以优化性能
 * 提供缓存的创建、更新、过期清理等功能
 */

import { logWarn } from '../common/debug';
import { CachedRangeInfo, PERFORMANCE_CONFIG } from './types';

/**
 * Range缓存管理器
 * 管理选区Range的边界信息缓存，提升交互检测性能
 */
export class RangeCacheManager {
  /** Range信息缓存映射 */
  private rangeCache: Map<string, CachedRangeInfo> = new Map();
  /** 缓存清理定时器 */
  private cacheCleanupTimer: number | null = null;

  constructor() {
    this.startCacheCleanupTimer();
  }

  /**
   * 启动缓存清理定时器
   * 定期清理过期的缓存项
   */
  private startCacheCleanupTimer(): void {
    this.cacheCleanupTimer = setInterval(() => {
      this.cleanupExpiredCache();
    }, PERFORMANCE_CONFIG.CACHE_EXPIRE_TIME / 2) as unknown as number;
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // 收集过期的缓存键
    for (const [key, cachedInfo] of this.rangeCache.entries()) {
      if (now - cachedInfo.lastUpdated > PERFORMANCE_CONFIG.CACHE_EXPIRE_TIME) {
        expiredKeys.push(key);
      }
    }

    // 删除过期项
    for (const key of expiredKeys) {
      this.rangeCache.delete(key);
    }

    // 如果缓存数量超过限制，删除最旧的项
    if (this.rangeCache.size > PERFORMANCE_CONFIG.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.rangeCache.entries())
        .sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);

      const deleteCount = this.rangeCache.size - PERFORMANCE_CONFIG.MAX_CACHE_SIZE;
      for (let i = 0; i < deleteCount; i++) {
        this.rangeCache.delete(sortedEntries[i][0]);
      }
    }
  }

  /**
   * 获取或创建Range缓存信息
   * @param selectionId - 选区ID
   * @param range - Range对象
   * @returns 缓存的Range信息
   */
  getCachedRangeInfo(selectionId: string, range: Range): CachedRangeInfo {
    const existing = this.rangeCache.get(selectionId);
    const now = Date.now();

    // 如果缓存存在且未过期，直接返回
    if (existing && (now - existing.lastUpdated) < PERFORMANCE_CONFIG.CACHE_EXPIRE_TIME) {
      return existing;
    }

    // 创建新的缓存信息
    try {
      const rects = range.getClientRects();
      const boundingRect = range.getBoundingClientRect();

      const cachedInfo: CachedRangeInfo = {
        id: selectionId,
        range: range.cloneRange(),
        rects,
        lastUpdated: now,
        boundingRect,
      };

      this.rangeCache.set(selectionId, cachedInfo);
      return cachedInfo;
    } catch (error) {
      logWarn('cache-manager', 'Range缓存创建失败:', error);
      // 返回一个空的缓存信息
      return {
        id: selectionId,
        range,
        rects: [] as unknown as DOMRectList,
        lastUpdated: now,
        boundingRect: new DOMRect(0, 0, 0, 0),
      };
    }
  }

  /**
   * 删除指定选区的缓存
   * @param selectionId - 选区ID
   */
  deleteCache(selectionId: string): void {
    this.rangeCache.delete(selectionId);
  }

  /**
   * 清空所有缓存
   */
  clearAll(): void {
    this.rangeCache.clear();
  }

  /**
   * 检查缓存是否存在
   * @param selectionId - 选区ID
   * @returns 是否存在缓存
   */
  hasCache(selectionId: string): boolean {
    return this.rangeCache.has(selectionId);
  }

  /**
   * 获取缓存数量
   * @returns 缓存数量
   */
  getCacheSize(): number {
    return this.rangeCache.size;
  }

  /**
   * 销毁缓存管理器
   * 清理定时器和所有缓存
   */
  destroy(): void {
    if (this.cacheCleanupTimer) {
      clearInterval(this.cacheCleanupTimer);
      this.cacheCleanupTimer = null;
    }
    this.rangeCache.clear();
  }
}
