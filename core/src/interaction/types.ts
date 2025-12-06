/**
 * Interaction 模块类型定义
 *
 * 事件层，负责监听和归一化交互事件
 */

/**
 * 交互事件类型
 */
export enum InteractionEventType {
  /** 选区变化 */
  SELECT = 'select',
  /** 点击 */
  CLICK = 'click',
  /** 双击 */
  DBLCLICK = 'dblclick',
  /** 悬浮进入 */
  HOVER_ENTER = 'hover_enter',
  /** 悬浮离开 */
  HOVER_LEAVE = 'hover_leave',
  /** 右键菜单 */
  CONTEXTMENU = 'contextmenu',
}

/**
 * 选区位置信息
 */
export interface SelectionPosition {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 交互事件数据
 */
export interface InteractionEventData {
  /** 事件类型 */
  type: InteractionEventType;
  /** 时间戳 */
  timestamp: number;
  /** 选区文本 */
  text?: string;
  /** 选区位置 */
  position?: SelectionPosition;
  /** 原始事件 */
  originalEvent?: Event;
  /** Range */
  range?: Range;
  /** 选区 ID（如果命中已保存的选区） */
  selectionId?: string;
  /** 关联的选区数据 */
  selectionData?: unknown;
}

/**
 * 交互事件处理函数
 */
export type InteractionEventHandler = (event: InteractionEventData) => void;

/**
 * 交互管理器配置
 */
export interface InteractionManagerOptions {
  /** 监听的容器元素或选择器 */
  container?: HTMLElement | string;
  /** 是否监听选区变化 */
  listenSelection?: boolean;
  /** 是否监听点击事件 */
  listenClick?: boolean;
  /** 是否监听悬浮事件 */
  listenHover?: boolean;
  /** 悬浮检测节流间隔（毫秒） */
  hoverThrottle?: number;
  /** 选区变化防抖间隔（毫秒） */
  selectionDebounce?: number;
}

/**
 * 交互管理器接口
 */
export interface IInteractionManager {
  /**
   * 添加事件监听
   * @param event - 事件类型
   * @param handler - 事件处理函数
   */
  on(event: InteractionEventType | 'select' | 'click' | 'hover', handler: InteractionEventHandler): void;

  /**
   * 移除事件监听
   * @param event - 事件类型
   * @param handler - 事件处理函数
   */
  off(event: InteractionEventType | 'select' | 'click' | 'hover', handler: InteractionEventHandler): void;

  /**
   * 注册选区（用于检测是否命中已保存的选区）
   * @param id - 选区 ID
   * @param range - 选区 Range
   * @param data - 选区数据
   */
  registerSelection(id: string, range: Range, data?: unknown): void;

  /**
   * 移除选区
   * @param id - 选区 ID
   */
  unregisterSelection(id: string): void;

  /**
   * 清除所有选区
   */
  clearSelections(): void;

  /**
   * 检测指定坐标点的选区
   * @param x - X 坐标
   * @param y - Y 坐标
   */
  detectSelectionAtPoint(x: number, y: number): string | null;

  /**
   * 销毁
   */
  destroy(): void;
}
