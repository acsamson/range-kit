/**
 * ContentMonitor 测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentMonitor } from '../content-monitor';
import type { SerializedSelection, SelectionInstance } from '../../types';

// Mock restoreSelection
vi.mock('../../locator/restorer', () => ({
  restoreSelection: vi.fn(),
}));

import { restoreSelection } from '../../locator/restorer';

describe('ContentMonitor', () => {
  let monitor: ContentMonitor;
  let getSelectionInstanceMock: ReturnType<typeof vi.fn>;
  let onContentChangeMock: ReturnType<typeof vi.fn>;
  const mockRestoreSelection = restoreSelection as ReturnType<typeof vi.fn>;

  // 使用 ASCII 文本避免 btoa 编码问题
  const mockSelectionData = createMockSelectionData('test-id', 'original text');
  const mockInstance: SelectionInstance = {
    id: 'test-id',
    type: 'comment',
    data: mockSelectionData,
    highlight: vi.fn(),
    clearHighlight: vi.fn(),
    remove: vi.fn(),
    getData: () => mockSelectionData,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    getSelectionInstanceMock = vi.fn();
    onContentChangeMock = vi.fn();
    mockRestoreSelection.mockReset();

    monitor = new ContentMonitor(
      1000, // 监控间隔
      getSelectionInstanceMock,
      onContentChangeMock
    );
  });

  afterEach(() => {
    monitor.destroy();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('应该正确初始化', () => {
      expect(monitor.getMonitoringCount()).toBe(0);
    });
  });

  describe('startMonitoring', () => {
    it('应该开始监控选区', () => {
      monitor.startMonitoring('test-id', mockSelectionData);

      expect(monitor.getMonitoringCount()).toBe(1);
    });

    it('应该为同一ID覆盖之前的监控（Map 行为）', () => {
      monitor.startMonitoring('test-id', mockSelectionData);
      monitor.startMonitoring('test-id', mockSelectionData);

      // Map.set 会覆盖同一个 key，所以 count 仍然是 1
      expect(monitor.getMonitoringCount()).toBe(1);
    });

    it('应该能同时监控多个不同ID的选区', () => {
      const mockData2 = createMockSelectionData('test-id-2', 'another text');
      monitor.startMonitoring('test-id', mockSelectionData);
      monitor.startMonitoring('test-id-2', mockData2);

      expect(monitor.getMonitoringCount()).toBe(2);
    });

    it('应该定期检查选区变化', async () => {
      getSelectionInstanceMock.mockReturnValue({
        instance: mockInstance,
        data: mockSelectionData,
      });

      // 模拟恢复成功但内容未变化
      mockRestoreSelection.mockResolvedValue({
        success: true,
        range: { toString: () => 'original text' },
      });

      monitor.startMonitoring('test-id', mockSelectionData);

      // 推进时间触发检查
      await vi.advanceTimersByTimeAsync(1100);

      expect(mockRestoreSelection).toHaveBeenCalled();
    });
  });

  describe('stopMonitoring', () => {
    it('应该停止监控选区', () => {
      monitor.startMonitoring('test-id', mockSelectionData);
      expect(monitor.getMonitoringCount()).toBe(1);

      monitor.stopMonitoring('test-id');
      expect(monitor.getMonitoringCount()).toBe(0);
    });

    it('停止不存在的监控不应报错', () => {
      expect(() => monitor.stopMonitoring('nonexistent')).not.toThrow();
    });
  });

  describe('内容变化检测', () => {
    it('当内容变化时应该触发回调', async () => {
      getSelectionInstanceMock.mockReturnValue({
        instance: mockInstance,
        data: mockSelectionData,
      });

      // 模拟恢复成功且内容发生变化
      mockRestoreSelection.mockResolvedValue({
        success: true,
        range: { toString: () => 'changed text' },
      });

      monitor.startMonitoring('test-id', mockSelectionData);

      // 推进时间触发检查
      await vi.advanceTimersByTimeAsync(1100);

      expect(onContentChangeMock).toHaveBeenCalled();
      const [changeInfo] = onContentChangeMock.mock.calls[0];
      expect(changeInfo.changeType).toBe('content');
      expect(changeInfo.before.text).toBe('original text');
      expect(changeInfo.after.text).toBe('changed text');
    });

    it('当内容未变化时不应触发回调', async () => {
      getSelectionInstanceMock.mockReturnValue({
        instance: mockInstance,
        data: mockSelectionData,
      });

      // 模拟恢复成功且内容未变化
      mockRestoreSelection.mockResolvedValue({
        success: true,
        range: { toString: () => 'original text' },
      });

      monitor.startMonitoring('test-id', mockSelectionData);

      // 推进时间触发检查
      await vi.advanceTimersByTimeAsync(1100);

      expect(onContentChangeMock).not.toHaveBeenCalled();
    });

    it('当恢复失败时不应触发回调', async () => {
      getSelectionInstanceMock.mockReturnValue({
        instance: mockInstance,
        data: mockSelectionData,
      });

      // 模拟恢复失败
      mockRestoreSelection.mockResolvedValue({
        success: false,
        range: null,
      });

      monitor.startMonitoring('test-id', mockSelectionData);

      // 推进时间触发检查
      await vi.advanceTimersByTimeAsync(1100);

      expect(onContentChangeMock).not.toHaveBeenCalled();
    });

    it('当选区实例不存在时不应触发回调', async () => {
      getSelectionInstanceMock.mockReturnValue(undefined);

      monitor.startMonitoring('test-id', mockSelectionData);

      // 推进时间触发检查
      await vi.advanceTimersByTimeAsync(1100);

      expect(mockRestoreSelection).not.toHaveBeenCalled();
      expect(onContentChangeMock).not.toHaveBeenCalled();
    });
  });

  describe('setOnContentChange', () => {
    it('应该更新内容变化回调', async () => {
      const newCallback = vi.fn();
      monitor.setOnContentChange(newCallback);

      getSelectionInstanceMock.mockReturnValue({
        instance: mockInstance,
        data: mockSelectionData,
      });

      mockRestoreSelection.mockResolvedValue({
        success: true,
        range: { toString: () => 'changed text' },
      });

      monitor.startMonitoring('test-id', mockSelectionData);

      await vi.advanceTimersByTimeAsync(1100);

      expect(newCallback).toHaveBeenCalled();
      expect(onContentChangeMock).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('应该停止所有监控并清理资源', () => {
      monitor.startMonitoring('id-1', mockSelectionData);
      monitor.startMonitoring('id-2', mockSelectionData);

      expect(monitor.getMonitoringCount()).toBe(2);

      monitor.destroy();

      expect(monitor.getMonitoringCount()).toBe(0);
    });
  });
});

/**
 * 创建模拟的选区数据
 */
function createMockSelectionData(id: string, text: string): SerializedSelection {
  return {
    id,
    text,
    restore: {
      anchors: { startId: '', endId: '', startOffset: 0, endOffset: 0 },
      paths: { startPath: '/body', endPath: '/body', startOffset: 0, endOffset: text.length, startTextOffset: 0, endTextOffset: text.length },
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
}
