/**
 * 选区事件处理器
 *
 * 负责设置和管理选区相关的DOM事件监听
 * 包括点击、悬浮、右键菜单、双击等交互事件
 */

import {
  SelectionInteractionEvent,
  SelectionCompleteEvent,
  SelectionRestoreOptions,
  SelectionTypeConfig,
  SerializedSelection,
  SelectionInstance,
  DEFAULT_SELECTION_TYPE,
} from '../types';
import { InteractionDetector } from './interaction-detector';
import { PERFORMANCE_CONFIG } from './types';

/**
 * 事件处理器配置
 */
export interface EventHandlersConfig {
  /** 配置选项 */
  options: Required<SelectionRestoreOptions>;
  /** 已注册的类型配置映射 */
  registeredTypes: Map<string, SelectionTypeConfig>;
  /** 交互检测器 */
  interactionDetector: InteractionDetector;
  /** 获取活跃Range回调（替代 RangeManager 依赖） */
  getActiveRange: (id: string) => Range | undefined;
  /** 获取选区实例回调 */
  getSelectionInstance: (id: string) => SelectionInstance | undefined;
  /** 创建临时选区实例回调 */
  createTempInstance: (data: SerializedSelection) => SelectionInstance;
}

/**
 * 选区事件处理器
 * 管理所有选区相关的DOM事件监听器
 */
export class SelectionEventHandlers {
  private config: EventHandlersConfig;

  /** 事件监听器引用 */
  private clickListener?: (event: Event) => void;
  private hoverListener?: (event: Event) => void;
  private contextMenuListener?: (event: Event) => void;
  private doubleClickListener?: (event: Event) => void;
  private selectionChangeListener?: () => void;

  /** 鼠标移动相关状态 */
  private lastMousePosition: { x: number; y: number } = { x: -1, y: -1 };
  private mouseMoveDebounceTimer: number | null = null;

  constructor(config: EventHandlersConfig) {
    this.config = config;
  }

  /**
   * 设置所有事件监听器
   */
  setupEventListeners(): void {
    this.setupClickListener();
    this.setupHoverListener();
    this.setupContextMenuListener();
    this.setupDoubleClickListener();
  }

  /**
   * 设置选区完成监听器
   * 注意：选区完成事件现在通过 onSelectionBehavior 回调处理
   */
  setupSelectionCompleteListener(): void {
    // 选区行为监听已由 SelectionBehaviorMonitor 处理
    // 此方法保留为空以保持接口兼容性
  }

  /**
   * 设置点击事件监听器
   */
  private setupClickListener(): void {
    this.clickListener = (event: Event) => {
      const mouseEvent = event as MouseEvent;

      // 检查用户是否正在进行文本选择
      const currentSelection = window.getSelection();
      const isSelecting = currentSelection && !currentSelection.isCollapsed;

      if (isSelecting) return;

      const selectionId = this.config.interactionDetector.detectSelectionAtPoint(
        mouseEvent.clientX,
        mouseEvent.clientY
      );

      if (selectionId && this.config.options.onSelectionInteraction) {
        const instance = this.config.getSelectionInstance(selectionId);
        const range = this.config.getActiveRange(selectionId);

        if (instance && range) {
          const offset = this.calculateOffsetInSelection(event, range);
          const interactionEvent: SelectionInteractionEvent = {
            type: 'click',
            originalEvent: event,
            selection: instance.data,
            ...(offset !== undefined && { offsetInSelection: offset }),
          };

          this.config.options.onSelectionInteraction(interactionEvent, instance);
        }
      }
    };

    document.addEventListener('click', this.clickListener);
  }

  /**
   * 设置悬浮事件监听器
   */
  private setupHoverListener(): void {
    this.hoverListener = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      this.handleHover(mouseEvent.clientX, mouseEvent.clientY);
    };

    document.addEventListener('mousemove', this.hoverListener);
  }

  /**
   * 设置右键菜单事件监听器
   */
  private setupContextMenuListener(): void {
    this.contextMenuListener = (event: Event) => {
      const mouseEvent = event as MouseEvent;

      // 检查用户是否正在进行文本选择
      const currentSelection = window.getSelection();
      const isSelecting = currentSelection && !currentSelection.isCollapsed;

      if (isSelecting) return;

      const selectionId = this.config.interactionDetector.detectSelectionAtPoint(
        mouseEvent.clientX,
        mouseEvent.clientY
      );

      if (selectionId && this.config.options.onSelectionInteraction) {
        const instance = this.config.getSelectionInstance(selectionId);

        if (instance) {
          const interactionEvent: SelectionInteractionEvent = {
            type: 'contextmenu',
            originalEvent: event,
            selection: instance.data,
          };
          this.config.options.onSelectionInteraction(interactionEvent, instance);
        }
      }
    };

    document.addEventListener('contextmenu', this.contextMenuListener);
  }

  /**
   * 设置双击事件监听器
   */
  private setupDoubleClickListener(): void {
    this.doubleClickListener = (event: Event) => {
      const mouseEvent = event as MouseEvent;

      // 检查用户是否正在进行文本选择
      const currentSelection = window.getSelection();
      const isSelecting = currentSelection && !currentSelection.isCollapsed;

      if (isSelecting) return;

      const selectionId = this.config.interactionDetector.detectSelectionAtPoint(
        mouseEvent.clientX,
        mouseEvent.clientY
      );

      if (selectionId && this.config.options.onSelectionInteraction) {
        const instance = this.config.getSelectionInstance(selectionId);

        if (instance) {
          const interactionEvent: SelectionInteractionEvent = {
            type: 'doubleclick',
            originalEvent: event,
            selection: instance.data,
          };
          this.config.options.onSelectionInteraction(interactionEvent, instance);
        }
      }
    };

    document.addEventListener('dblclick', this.doubleClickListener);
  }

  /**
   * 悬浮处理（带防抖和位置变化检测）
   * @param x - X坐标
   * @param y - Y坐标
   */
  private handleHover(x: number, y: number): void {
    const positionChanged = Math.abs(x - this.lastMousePosition.x) > 3 ||
                           Math.abs(y - this.lastMousePosition.y) > 3;

    if (!positionChanged) return;

    this.lastMousePosition = { x, y };

    // 清除之前的防抖定时器
    if (this.mouseMoveDebounceTimer) {
      clearTimeout(this.mouseMoveDebounceTimer);
    }

    this.mouseMoveDebounceTimer = setTimeout(() => {
      // 检查用户是否正在进行文本选择
      const currentSelection = window.getSelection();
      const isSelecting = currentSelection && !currentSelection.isCollapsed;

      if (isSelecting) {
        this.config.interactionDetector.setCurrentHoveredSelection(null);
        return;
      }

      const previousHoveredSelection = this.config.interactionDetector.getCurrentHoveredSelection();
      const foundSelectionId = this.config.interactionDetector.detectSelectionAtPoint(x, y);

      // 只有当悬浮状态发生变化时才触发事件和更新样式
      if (foundSelectionId !== previousHoveredSelection) {
        // 更新鼠标样式
        this.updateCursorStyle(foundSelectionId);

        // 触发悬浮事件回调
        if (foundSelectionId && this.config.options.onSelectionInteraction) {
          const instance = this.config.getSelectionInstance(foundSelectionId);

          if (instance) {
            const interactionEvent: SelectionInteractionEvent = {
              type: 'hover',
              originalEvent: new MouseEvent('mousemove', { clientX: x, clientY: y }),
              selection: instance.data,
            };
            this.config.options.onSelectionInteraction(interactionEvent, instance);
          }
        }
      }
    }, PERFORMANCE_CONFIG.MOUSE_MOVE_DEBOUNCE) as unknown as number;
  }

  /**
   * 更新鼠标样式
   * 注意：仅在 rootNodeId 对应的容器内更新样式，不再回退到 document.body
   * @param selectionId - 选区ID或null
   */
  updateCursorStyle(selectionId: string | null): void {
    const targetElements: HTMLElement[] = [];

    // 严格模式：仅在根节点内操作，不再回退到 document.body
    if (this.config.options.rootNodeId) {
      const rootElement = document.getElementById(this.config.options.rootNodeId);
      if (rootElement) {
        targetElements.push(rootElement);
      }
    }

    let cursorStyle = '';
    if (selectionId) {
      const instance = this.config.getSelectionInstance(selectionId);
      if (instance) {
        const type = instance.type || 'default';
        const typeConfig = this.config.registeredTypes.get(type);
        if (typeConfig?.style?.cursor) {
          cursorStyle = typeConfig.style.cursor;
        } else {
          cursorStyle = 'pointer';
        }
      }
    }

    targetElements.forEach(element => {
      element.style.cursor = cursorStyle;
    });
  }

  /**
   * 计算在选区中的偏移位置
   * @param event - 事件对象
   * @param range - Range对象
   * @returns 偏移百分比
   */
  private calculateOffsetInSelection(event: Event, range: Range): number | undefined {
    if (!(event instanceof MouseEvent)) return undefined;

    try {
      const mouseEvent = event;
      const rect = range.getBoundingClientRect();
      const relativeX = (mouseEvent.clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, relativeX));
    } catch {
      return undefined;
    }
  }

  /**
   * 销毁事件处理器
   */
  destroy(): void {
    // 清理鼠标移动防抖定时器
    if (this.mouseMoveDebounceTimer) {
      clearTimeout(this.mouseMoveDebounceTimer);
      this.mouseMoveDebounceTimer = null;
    }

    // 恢复鼠标样式
    this.updateCursorStyle(null);

    // 移除事件监听器
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
    if (this.hoverListener) {
      document.removeEventListener('mousemove', this.hoverListener);
    }
    if (this.contextMenuListener) {
      document.removeEventListener('contextmenu', this.contextMenuListener);
    }
    if (this.doubleClickListener) {
      document.removeEventListener('dblclick', this.doubleClickListener);
    }
    if (this.selectionChangeListener) {
      document.removeEventListener('selectionchange', this.selectionChangeListener);
    }
  }
}
