/**
 * InteractionManager - 交互管理器
 *
 * 事件层，负责监听和归一化交互事件
 *
 * @example
 * ```typescript
 * import { InteractionManager } from '@range-kit/core';
 *
 * const interaction = new InteractionManager(container);
 *
 * interaction.on('select', (event) => {
 *   console.log('选区变化:', event.text);
 * });
 *
 * interaction.on('click', (event) => {
 *   console.log('点击了选区:', event.selectionId);
 * });
 *
 * interaction.destroy();
 * ```
 */

import type {
  IInteractionManager,
  InteractionManagerOptions,
  InteractionEventType,
  InteractionEventData,
  InteractionEventHandler,
  SelectionPosition,
} from './types';

import { InteractionEventType as EventType } from './types';

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: InteractionManagerOptions = {
  listenSelection: true,
  listenClick: true,
  listenHover: true,
  hoverThrottle: 50,
  selectionDebounce: 100,
};

/**
 * 缓存的 Range 信息
 */
interface CachedRangeInfo {
  boundingRect: DOMRect;
  rects: DOMRect[];
  data?: unknown;
}

/**
 * 交互管理器
 *
 * 职责：监听 SelectionChange, Click, Hover 等事件并归一化
 */
export class InteractionManager implements IInteractionManager {
  private container: HTMLElement;
  private options: InteractionManagerOptions;

  // 事件监听器映射
  private eventHandlers: Map<InteractionEventType, Set<InteractionEventHandler>> = new Map();

  // 选区管理
  private activeRanges: Map<string, Range> = new Map();
  private rangeData: Map<string, unknown> = new Map();
  private rangeCache: Map<string, CachedRangeInfo> = new Map();

  // 状态
  private currentHoveredSelection: string | null = null;
  private lastDetectionTime: number = 0;
  private selectionDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // 绑定的事件处理函数
  private boundSelectionChange: () => void;
  private boundClick: (e: MouseEvent) => void;
  private boundDblClick: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundContextMenu: (e: MouseEvent) => void;

  constructor(container: HTMLElement | string, options?: InteractionManagerOptions) {
    // 解析容器
    if (typeof container === 'string') {
      const el = document.querySelector(container) as HTMLElement;
      if (!el) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = el;
    } else {
      this.container = container;
    }

    this.options = { ...DEFAULT_OPTIONS, ...options };

    // 初始化事件监听器映射
    Object.values(EventType).forEach(eventType => {
      this.eventHandlers.set(eventType, new Set());
    });

    // 绑定事件处理函数
    this.boundSelectionChange = this.handleSelectionChange.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundDblClick = this.handleDblClick.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundContextMenu = this.handleContextMenu.bind(this);

    // 启动监听
    this.startListening();
  }

  // ========== 事件接口 ==========

  on(
    event: InteractionEventType | 'select' | 'click' | 'hover',
    handler: InteractionEventHandler,
  ): void {
    // 映射简化事件名
    const eventType = this.mapEventType(event);
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.add(handler);
    }
  }

  off(
    event: InteractionEventType | 'select' | 'click' | 'hover',
    handler: InteractionEventHandler,
  ): void {
    const eventType = this.mapEventType(event);
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private mapEventType(event: InteractionEventType | 'select' | 'click' | 'hover'): InteractionEventType {
    switch (event) {
      case 'select':
        return EventType.SELECT;
      case 'click':
        return EventType.CLICK;
      case 'hover':
        return EventType.HOVER_ENTER;
      default:
        return event;
    }
  }

  private emit(eventType: InteractionEventType, data: Partial<InteractionEventData>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers && handlers.size > 0) {
      const eventData: InteractionEventData = {
        type: eventType,
        timestamp: Date.now(),
        ...data,
      };

      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch {
          // 忽略处理函数错误
        }
      });
    }
  }

  // ========== 选区管理 ==========

  registerSelection(id: string, range: Range, data?: unknown): void {
    this.activeRanges.set(id, range);
    if (data !== undefined) {
      this.rangeData.set(id, data);
    }
    // 清除缓存以强制更新
    this.rangeCache.delete(id);
  }

  unregisterSelection(id: string): void {
    this.activeRanges.delete(id);
    this.rangeData.delete(id);
    this.rangeCache.delete(id);
  }

  clearSelections(): void {
    this.activeRanges.clear();
    this.rangeData.clear();
    this.rangeCache.clear();
    this.currentHoveredSelection = null;
  }

  // ========== 选区检测 ==========

  detectSelectionAtPoint(x: number, y: number): string | null {
    if (this.activeRanges.size === 0) {
      return null;
    }

    // 优先方案：使用 DOM 检测最上层的高亮元素
    try {
      const elementAtPoint = document.elementFromPoint(x, y);
      if (elementAtPoint) {
        const selectionElement = elementAtPoint.closest('[data-selection-id]');
        if (selectionElement) {
          const selectionId = selectionElement.getAttribute('data-selection-id');
          if (selectionId && this.activeRanges.has(selectionId)) {
            return selectionId;
          }
        }
      }
    } catch {
      // 忽略错误
    }

    // 降级方案：使用 Range 边界检测
    for (const [selectionId, range] of this.activeRanges.entries()) {
      const cachedInfo = this.getCachedRangeInfo(selectionId, range);
      if (this.isPointInRange(x, y, cachedInfo)) {
        return selectionId;
      }
    }

    return null;
  }

  private getCachedRangeInfo(id: string, range: Range): CachedRangeInfo {
    let cached = this.rangeCache.get(id);
    if (!cached) {
      const rects = Array.from(range.getClientRects());
      cached = {
        boundingRect: range.getBoundingClientRect(),
        rects,
        data: this.rangeData.get(id),
      };
      this.rangeCache.set(id, cached);
    }
    return cached;
  }

  private isPointInRange(x: number, y: number, cachedInfo: CachedRangeInfo): boolean {
    const tolerance = 2;

    // 快速边界检查
    const bound = cachedInfo.boundingRect;
    if (
      x < bound.left - tolerance ||
      x > bound.right + tolerance ||
      y < bound.top - tolerance ||
      y > bound.bottom + tolerance
    ) {
      return false;
    }

    // 详细检测
    for (const rect of cachedInfo.rects) {
      if (
        x >= rect.left - tolerance &&
        x <= rect.right + tolerance &&
        y >= rect.top - tolerance &&
        y <= rect.bottom + tolerance
      ) {
        return true;
      }
    }

    return false;
  }

  // ========== 事件监听 ==========

  private startListening(): void {
    if (this.options.listenSelection) {
      document.addEventListener('selectionchange', this.boundSelectionChange);
    }

    if (this.options.listenClick) {
      this.container.addEventListener('click', this.boundClick);
      this.container.addEventListener('dblclick', this.boundDblClick);
      this.container.addEventListener('contextmenu', this.boundContextMenu);
    }

    if (this.options.listenHover) {
      this.container.addEventListener('mousemove', this.boundMouseMove);
    }
  }

  private stopListening(): void {
    document.removeEventListener('selectionchange', this.boundSelectionChange);
    this.container.removeEventListener('click', this.boundClick);
    this.container.removeEventListener('dblclick', this.boundDblClick);
    this.container.removeEventListener('contextmenu', this.boundContextMenu);
    this.container.removeEventListener('mousemove', this.boundMouseMove);
  }

  // ========== 事件处理 ==========

  private handleSelectionChange(): void {
    // 防抖
    if (this.selectionDebounceTimer) {
      clearTimeout(this.selectionDebounceTimer);
    }

    this.selectionDebounceTimer = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        return;
      }

      // 检查选区是否在容器内
      if (!this.container.contains(range.commonAncestorContainer)) {
        return;
      }

      const text = range.toString();
      if (!text.trim()) {
        return;
      }

      const rect = range.getBoundingClientRect();
      const position: SelectionPosition = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };

      this.emit(EventType.SELECT, {
        text,
        position,
        range: range.cloneRange(),
      });
    }, this.options.selectionDebounce);
  }

  private handleClick(e: MouseEvent): void {
    const selectionId = this.detectSelectionAtPoint(e.clientX, e.clientY);

    this.emit(EventType.CLICK, {
      originalEvent: e,
      selectionId: selectionId || undefined,
      selectionData: selectionId ? this.rangeData.get(selectionId) : undefined,
    });
  }

  private handleDblClick(e: MouseEvent): void {
    const selectionId = this.detectSelectionAtPoint(e.clientX, e.clientY);

    this.emit(EventType.DBLCLICK, {
      originalEvent: e,
      selectionId: selectionId || undefined,
      selectionData: selectionId ? this.rangeData.get(selectionId) : undefined,
    });
  }

  private handleContextMenu(e: MouseEvent): void {
    const selectionId = this.detectSelectionAtPoint(e.clientX, e.clientY);

    this.emit(EventType.CONTEXTMENU, {
      originalEvent: e,
      selectionId: selectionId || undefined,
      selectionData: selectionId ? this.rangeData.get(selectionId) : undefined,
    });
  }

  private handleMouseMove(e: MouseEvent): void {
    // 节流
    const now = Date.now();
    if (now - this.lastDetectionTime < (this.options.hoverThrottle || 50)) {
      return;
    }
    this.lastDetectionTime = now;

    const selectionId = this.detectSelectionAtPoint(e.clientX, e.clientY);

    // 悬浮状态变化
    if (selectionId !== this.currentHoveredSelection) {
      // 离开之前的选区
      if (this.currentHoveredSelection) {
        this.emit(EventType.HOVER_LEAVE, {
          originalEvent: e,
          selectionId: this.currentHoveredSelection,
          selectionData: this.rangeData.get(this.currentHoveredSelection),
        });
      }

      // 进入新的选区
      if (selectionId) {
        this.emit(EventType.HOVER_ENTER, {
          originalEvent: e,
          selectionId,
          selectionData: this.rangeData.get(selectionId),
        });
      }

      this.currentHoveredSelection = selectionId;
    }
  }

  // ========== 销毁 ==========

  destroy(): void {
    this.stopListening();

    if (this.selectionDebounceTimer) {
      clearTimeout(this.selectionDebounceTimer);
    }

    this.eventHandlers.forEach(handlers => handlers.clear());
    this.eventHandlers.clear();

    this.clearSelections();
  }
}

/**
 * 创建 InteractionManager 实例的工厂函数
 */
export function createInteractionManager(
  container: HTMLElement | string,
  options?: InteractionManagerOptions,
): InteractionManager {
  return new InteractionManager(container, options);
}
