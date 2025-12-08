/**
 * 事件相关类型定义
 */

import type { SerializedSelection, SelectionType, OverlappedRange } from './core';

// 选区行为事件类型枚举
export enum SelectionBehaviorType {
  /** 创建新选区 */
  CREATED = 'created',
  /** 选择已有选区 */
  SELECTED = 'selected',
  /** 清除选区 */
  CLEARED = 'cleared',
}

// 选区行为事件
export interface SelectionBehaviorEvent {
  /** 行为类型 */
  type: SelectionBehaviorType;
  /** 选中的文本内容 */
  text: string;
  /** 选区位置信息 */
  position?: { x: number; y: number; width: number; height: number };
  /** 事件发生的容器元素 */
  container?: Element;
  /** 当前选区对象（如果有） */
  selection?: Selection | null;
  /** 当前Range对象（如果有） */
  range?: Range | null;
  /** 事件时间戳 */
  timestamp?: number;
  /** 重叠的选区数组 */
  overlappedRanges?: OverlappedRange[];
}

// 选区行为监听回调
export type SelectionBehaviorCallback = (event: SelectionBehaviorEvent) => void;

// 选区交互事件
export interface SelectionInteractionEvent {
  /** 事件类型 */
  type: 'click' | 'hover' | 'contextmenu' | 'doubleclick';
  /** 原始DOM事件 */
  originalEvent: Event;
  /** 选区数据 */
  selection: SerializedSelection;
  /** 点击位置在选区中的偏移 */
  offsetInSelection?: number;
}

// 选区完成事件
export interface SelectionCompleteEvent {
  /** 选区范围 */
  range: Range;
  /** 选区数据 */
  selection: SerializedSelection;
  /** 默认类型 */
  defaultType: SelectionType;
}

// 选区变化信息
export interface SelectionChangeInfo {
  /** 变化前的选区数据 */
  before: SerializedSelection;
  /** 变化后的选区数据 */
  after: SerializedSelection;
  /** 变化类型 */
  changeType: 'content' | 'position' | 'structure';
  /** 变化详情 */
  details: string;
  /** 变化时间戳 */
  timestamp: number;
  /** 变化程度 (0-1) */
  changeMagnitude: number;
}

// 活跃高亮变化事件
export interface ActiveRangesChangeEvent {
  /** 当前活跃高亮数量 */
  count: number;
  /** 所有活跃高亮的 ID 列表 */
  ids: string[];
}

// 选区实例接口
export interface SelectionInstance {
  /** 选区ID */
  id: string;
  /** 选区类型 */
  type: SelectionType;
  /** 选区数据 */
  data: SerializedSelection;
  /** 更新选区类型 */
  setType(type: SelectionType): void;
  /** 更新选区数据 */
  updateData(data: Partial<SerializedSelection>): void;
  /** 移除选区 */
  remove(): void;
  /** 获取当前Range */
  getRange(): Range | null;
  /** 重新高亮 */
  rehighlight(): void;
  /** 滚动到选区位置 */
  scrollTo(): void;
}

// 回调函数类型定义
export type SelectionChangeCallback = (changeInfo: SelectionChangeInfo, instance: SelectionInstance) => void;
export type SelectionInteractionCallback = (event: SelectionInteractionEvent, instance: SelectionInstance) => void;
export type SelectionCompleteCallback = (event: SelectionCompleteEvent, instance: SelectionInstance) => void;
export type ActiveRangesChangeCallback = (event: ActiveRangesChangeEvent) => void;
