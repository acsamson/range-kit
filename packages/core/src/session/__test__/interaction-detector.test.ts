/**
 * InteractionDetector 测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InteractionDetector } from '../interaction-detector';
import { RangeCacheManager } from '../cache-manager';
import { PERFORMANCE_CONFIG } from '../types';
import type { SerializedSelection } from '../../types';

describe('InteractionDetector', () => {
  let detector: InteractionDetector;
  let cacheManager: RangeCacheManager;
  let activeRanges: Map<string, Range>;
  let getSelectionDataMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    cacheManager = new RangeCacheManager();
    activeRanges = new Map();
    getSelectionDataMock = vi.fn();

    detector = new InteractionDetector(
      cacheManager,
      activeRanges,
      getSelectionDataMock
    );
  });

  afterEach(() => {
    cacheManager.destroy();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('应该正确初始化', () => {
      expect(detector.getCurrentHoveredSelection()).toBeNull();
    });
  });

  describe('detectSelectionAtPoint', () => {
    it('当没有活跃选区时应该返回 null', () => {
      const result = detector.detectSelectionAtPoint(100, 100);
      expect(result).toBeNull();
    });

    it('应该进行节流控制', () => {
      const mockRange = createMockRange(10, 10, 100, 50);
      activeRanges.set('test-id', mockRange);

      // 第一次检测
      detector.detectSelectionAtPoint(50, 30);

      // 立即再次检测（应该被节流）
      const result = detector.detectSelectionAtPoint(50, 30);

      // 应该返回上次的结果（来自缓存的悬浮状态）
      expect(result).toBe(detector.getCurrentHoveredSelection());
    });

    it('节流时间过后应该进行新的检测', () => {
      const mockRange = createMockRange(10, 10, 100, 50);
      activeRanges.set('test-id', mockRange);

      detector.detectSelectionAtPoint(50, 30);

      // 推进时间超过节流间隔
      vi.advanceTimersByTime(PERFORMANCE_CONFIG.DETECTION_THROTTLE + 10);

      // 应该进行新的检测
      const result = detector.detectSelectionAtPoint(50, 30);
      expect(result).toBeDefined();
    });

    it('当点不在任何选区内时应该返回 null', () => {
      const mockRange = createMockRange(100, 100, 50, 20);
      activeRanges.set('test-id', mockRange);

      // 推进时间确保不被节流
      vi.advanceTimersByTime(PERFORMANCE_CONFIG.DETECTION_THROTTLE + 10);

      const result = detector.detectSelectionAtPoint(10, 10);
      expect(result).toBeNull();
    });

    it('当点在选区边界内时应该返回选区 ID（通过 Range 降级检测）', () => {
      // 创建一个从 (10, 10) 到 (110, 60) 的选区
      const mockRange = createMockRange(10, 10, 100, 50);
      activeRanges.set('test-id', mockRange);

      // Mock document.elementFromPoint 返回 null，触发降级到 Range 检测
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn().mockReturnValue(null);

      // 推进时间确保不被节流
      vi.advanceTimersByTime(PERFORMANCE_CONFIG.DETECTION_THROTTLE + 10);

      // 点在选区边界内
      const result = detector.detectSelectionAtPoint(50, 30);
      expect(result).toBe('test-id');

      // 恢复原始方法
      document.elementFromPoint = originalElementFromPoint;
    });
  });

  describe('detectAllSelectionsAtPoint', () => {
    it('当没有活跃选区时应该返回空数组', () => {
      const result = detector.detectAllSelectionsAtPoint(100, 100);
      expect(result).toEqual([]);
    });

    it('应该返回包含指定点的所有选区', () => {
      // Mock document.elementFromPoint 返回 null，触发降级到 Range 检测
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn().mockReturnValue(null);

      // 创建两个重叠的选区
      const mockRange1 = createMockRange(10, 10, 100, 50);
      const mockRange2 = createMockRange(20, 20, 80, 40);

      activeRanges.set('id-1', mockRange1);
      activeRanges.set('id-2', mockRange2);

      const mockSelectionData: SerializedSelection = {
        id: 'id-1',
        text: '测试文本',
        restore: {
          anchors: { startId: '', endId: '', startOffset: 0, endOffset: 0 },
          paths: { startPath: '', endPath: '', startOffset: 0, endOffset: 0, startTextOffset: 0, endTextOffset: 0 },
          multipleAnchors: {
            startAnchors: { tagName: '', className: '', id: '', attributes: {} },
            endAnchors: { tagName: '', className: '', id: '', attributes: {} },
            commonParent: '',
            siblingInfo: null,
          },
          fingerprint: {
            tagName: '',
            className: '',
            attributes: {},
            textLength: 0,
            childCount: 0,
            depth: 0,
            parentChain: [],
            siblingPattern: null,
          },
          context: {
            precedingText: '',
            followingText: '',
            parentText: '',
            textPosition: { start: 0, end: 0, totalLength: 0 },
          },
        },
      };

      getSelectionDataMock.mockImplementation((id: string) => {
        if (id === 'id-1' || id === 'id-2') {
          return { text: '测试文本', data: { ...mockSelectionData, id } };
        }
        return undefined;
      });

      // 点在两个选区的重叠区域内
      const result = detector.detectAllSelectionsAtPoint(50, 40);

      expect(result.length).toBe(2);
      expect(result.map(r => r.selectionId)).toContain('id-1');
      expect(result.map(r => r.selectionId)).toContain('id-2');

      // 恢复原始方法
      document.elementFromPoint = originalElementFromPoint;
    });

    it('应该只返回包含该点的选区', () => {
      // Mock document.elementFromPoint 返回 null，触发降级到 Range 检测
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn().mockReturnValue(null);

      const mockRange1 = createMockRange(10, 10, 100, 50);
      const mockRange2 = createMockRange(200, 200, 80, 40);

      activeRanges.set('id-1', mockRange1);
      activeRanges.set('id-2', mockRange2);

      getSelectionDataMock.mockImplementation((id: string) => {
        return { text: '测试文本', data: { id, text: '测试文本' } };
      });

      // 点只在第一个选区内
      const result = detector.detectAllSelectionsAtPoint(50, 30);

      expect(result.length).toBe(1);
      expect(result[0].selectionId).toBe('id-1');

      // 恢复原始方法
      document.elementFromPoint = originalElementFromPoint;
    });
  });

  describe('getCurrentHoveredSelection / setCurrentHoveredSelection', () => {
    it('应该正确获取和设置当前悬浮选区', () => {
      expect(detector.getCurrentHoveredSelection()).toBeNull();

      detector.setCurrentHoveredSelection('test-id');
      expect(detector.getCurrentHoveredSelection()).toBe('test-id');

      detector.setCurrentHoveredSelection(null);
      expect(detector.getCurrentHoveredSelection()).toBeNull();
    });
  });

  describe('reset', () => {
    it('应该重置检测状态', () => {
      detector.setCurrentHoveredSelection('test-id');

      detector.reset();

      expect(detector.getCurrentHoveredSelection()).toBeNull();
    });
  });
});

/**
 * 创建模拟的 Range 对象
 * @param left - 左边界
 * @param top - 上边界
 * @param width - 宽度
 * @param height - 高度
 */
function createMockRange(left: number, top: number, width: number, height: number): Range {
  const mockRect = new DOMRect(left, top, width, height);

  // 创建一个支持索引访问的 DOMRectList mock
  const mockRectList = {
    length: 1,
    0: mockRect, // 支持索引访问
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
