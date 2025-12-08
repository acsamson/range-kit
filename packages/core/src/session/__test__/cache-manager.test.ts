/**
 * RangeCacheManager 测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RangeCacheManager } from '../cache-manager';
import { PERFORMANCE_CONFIG } from '../types';

describe('RangeCacheManager', () => {
  let cacheManager: RangeCacheManager;

  beforeEach(() => {
    vi.useFakeTimers();
    cacheManager = new RangeCacheManager();
  });

  afterEach(() => {
    cacheManager.destroy();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('应该正确初始化并启动清理定时器', () => {
      expect(cacheManager.getCacheSize()).toBe(0);
    });
  });

  describe('getCachedRangeInfo', () => {
    it('应该为新的 Range 创建缓存', () => {
      const mockRange = createMockRange();
      const result = cacheManager.getCachedRangeInfo('test-id', mockRange);

      expect(result.id).toBe('test-id');
      expect(result.range).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
      expect(cacheManager.getCacheSize()).toBe(1);
    });

    it('应该返回未过期的缓存', () => {
      const mockRange = createMockRange();
      const first = cacheManager.getCachedRangeInfo('test-id', mockRange);

      // 推进时间但未过期
      vi.advanceTimersByTime(PERFORMANCE_CONFIG.CACHE_EXPIRE_TIME / 2);

      const second = cacheManager.getCachedRangeInfo('test-id', mockRange);

      // 应该返回同一个缓存（时间戳相同）
      expect(second.lastUpdated).toBe(first.lastUpdated);
    });

    it('应该更新已过期的缓存', () => {
      const mockRange = createMockRange();
      const first = cacheManager.getCachedRangeInfo('test-id', mockRange);
      const firstTimestamp = first.lastUpdated;

      // 推进时间使缓存过期
      vi.advanceTimersByTime(PERFORMANCE_CONFIG.CACHE_EXPIRE_TIME + 100);

      const second = cacheManager.getCachedRangeInfo('test-id', mockRange);

      // 应该创建新的缓存
      expect(second.lastUpdated).toBeGreaterThan(firstTimestamp);
    });

    it('应该在 Range 操作失败时返回空的缓存信息', () => {
      const badRange = {
        getClientRects: () => {
          throw new Error('Range error');
        },
        getBoundingClientRect: () => new DOMRect(0, 0, 0, 0),
        cloneRange: () => badRange,
      } as unknown as Range;

      const result = cacheManager.getCachedRangeInfo('bad-id', badRange);

      expect(result.id).toBe('bad-id');
      expect(result.boundingRect.width).toBe(0);
    });
  });

  describe('deleteCache', () => {
    it('应该删除指定的缓存', () => {
      const mockRange = createMockRange();
      cacheManager.getCachedRangeInfo('test-id', mockRange);
      expect(cacheManager.hasCache('test-id')).toBe(true);

      cacheManager.deleteCache('test-id');

      expect(cacheManager.hasCache('test-id')).toBe(false);
    });

    it('删除不存在的缓存不应报错', () => {
      expect(() => cacheManager.deleteCache('nonexistent')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('应该清空所有缓存', () => {
      const mockRange = createMockRange();
      cacheManager.getCachedRangeInfo('id-1', mockRange);
      cacheManager.getCachedRangeInfo('id-2', mockRange);

      expect(cacheManager.getCacheSize()).toBe(2);

      cacheManager.clearAll();

      expect(cacheManager.getCacheSize()).toBe(0);
    });
  });

  describe('hasCache', () => {
    it('应该正确判断缓存是否存在', () => {
      expect(cacheManager.hasCache('test-id')).toBe(false);

      const mockRange = createMockRange();
      cacheManager.getCachedRangeInfo('test-id', mockRange);

      expect(cacheManager.hasCache('test-id')).toBe(true);
    });
  });

  describe('自动清理过期缓存', () => {
    it('应该定期清理过期的缓存', () => {
      const mockRange = createMockRange();
      cacheManager.getCachedRangeInfo('test-id', mockRange);

      expect(cacheManager.getCacheSize()).toBe(1);

      // 推进时间使缓存过期，并触发清理定时器
      // 清理定时器间隔是 CACHE_EXPIRE_TIME / 2，所以需要推进足够的时间
      vi.advanceTimersByTime(PERFORMANCE_CONFIG.CACHE_EXPIRE_TIME * 2);

      expect(cacheManager.getCacheSize()).toBe(0);
    });

    it('应该在超过最大缓存数量时删除最旧的项', () => {
      const mockRange = createMockRange();

      // 添加超过限制数量的缓存
      for (let i = 0; i < PERFORMANCE_CONFIG.MAX_CACHE_SIZE + 10; i++) {
        vi.advanceTimersByTime(10); // 确保时间戳不同
        cacheManager.getCachedRangeInfo(`id-${i}`, mockRange);
      }

      // 触发清理
      vi.advanceTimersByTime(PERFORMANCE_CONFIG.CACHE_EXPIRE_TIME / 2);

      // 缓存数量应该不超过最大限制
      expect(cacheManager.getCacheSize()).toBeLessThanOrEqual(PERFORMANCE_CONFIG.MAX_CACHE_SIZE);
    });
  });

  describe('destroy', () => {
    it('应该清理定时器和所有缓存', () => {
      const mockRange = createMockRange();
      cacheManager.getCachedRangeInfo('test-id', mockRange);

      cacheManager.destroy();

      expect(cacheManager.getCacheSize()).toBe(0);
    });
  });
});

/**
 * 创建模拟的 Range 对象
 */
function createMockRange(): Range {
  const mockRect = new DOMRect(10, 20, 100, 50);
  const mockRectList = {
    length: 1,
    item: (index: number) => (index === 0 ? mockRect : null),
    [Symbol.iterator]: function* () {
      yield mockRect;
    },
  } as unknown as DOMRectList;

  const mockRange = {
    getClientRects: () => mockRectList,
    getBoundingClientRect: () => mockRect,
    cloneRange: () => mockRange,
    startContainer: document.createTextNode('test'),
    endContainer: document.createTextNode('test'),
    startOffset: 0,
    endOffset: 4,
    collapsed: false,
    commonAncestorContainer: document.body,
  } as unknown as Range;

  return mockRange;
}
