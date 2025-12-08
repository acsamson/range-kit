/**
 * 选区操作 API 方法
 * 包含选区高亮、清除、获取当前选区等方法
 */

import type { HighlightStyle, SelectionTypeConfig, SerializedSelection } from '../../types';

import type { SelectionValidator, SelectionHighlighter } from '../wrappers';
import type { SelectionSession } from '../../session';

/**
 * 选区操作 API 依赖接口
 */
export interface SelectionAPIDependencies {
  validator: SelectionValidator;
  highlighter: SelectionHighlighter;
  selectionManager: SelectionSession;
}

/**
 * 设置高亮样式
 * 直接设置高亮器的默认样式，用于运行时动态调整
 */
export function setHighlightStyle(
  deps: SelectionAPIDependencies,
  style: HighlightStyle,
): void {
  deps.highlighter.setDefaultStyle(style);
}

/**
 * 高亮当前选区
 */
export function highlightSelection(
  deps: SelectionAPIDependencies,
  duration: number = 3000,
): void {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      deps.highlighter.highlight(range);

      if (duration > 0) {
        setTimeout(() => {
          deps.highlighter.clearHighlight();
        }, duration);
      }
    }
  }
}

/**
 * 清除高亮
 */
export function clearHighlight(deps: SelectionAPIDependencies): void {
  deps.highlighter.clearHighlight();
  deps.selectionManager.clearAllActiveRanges();
}

/**
 * 检测指定坐标点的所有选区（返回所有重叠的选区）
 * 用于点击时获取该位置的所有重叠选区
 */
export function detectAllSelectionsAtPoint(
  deps: SelectionAPIDependencies,
  x: number,
  y: number,
): Array<{
  selectionId: string;
  text: string;
  selectionData: SerializedSelection;
}> {
  return deps.selectionManager.detectAllSelectionsAtPoint(x, y);
}

/**
 * 获取指定选区的活跃 Range 对象
 */
export function getActiveRange(
  deps: SelectionAPIDependencies,
  selectionId: string,
): Range | undefined {
  return deps.selectionManager.getActiveRange(selectionId);
}

/**
 * 获取所有活跃选区的 ID 列表
 */
export function getAllActiveSelectionIds(
  deps: SelectionAPIDependencies,
): string[] {
  return deps.selectionManager.getAllActiveSelectionIds();
}

/**
 * 注册新的选区类型
 */
export function registerSelectionType(
  deps: SelectionAPIDependencies,
  config: SelectionTypeConfig,
): void {
  deps.selectionManager.registerType(config);
}

/**
 * 获取注册的选区类型配置
 */
export function getRegisteredType(
  deps: SelectionAPIDependencies,
  type: string,
): SelectionTypeConfig | undefined {
  return deps.selectionManager.getRegisteredType(type);
}

/**
 * 获取所有注册的选区类型配置
 */
export function getAllRegisteredTypes(
  deps: SelectionAPIDependencies,
): SelectionTypeConfig[] {
  return deps.selectionManager.getAllRegisteredTypes();
}

/**
 * 获取当前选区信息
 */
export function getCurrentSelection(deps: SelectionAPIDependencies): {
  selection: Selection | null;
  range: Range | null;
  text: string;
  isValid: boolean;
  isEmpty: boolean;
} {
  const selection = window.getSelection();

  if (!selection || selection.isCollapsed) {
    return {
      selection,
      range: null,
      text: '',
      isValid: false,
      isEmpty: true,
    };
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();
  const isValid = deps.validator.isSelectionInValidRange(selection);

  return {
    selection,
    range,
    text,
    isValid,
    isEmpty: !text,
  };
}

/**
 * 检查是否有有效选区
 */
export function hasValidSelection(deps: SelectionAPIDependencies): boolean {
  const current = getCurrentSelection(deps);
  return !current.isEmpty && current.isValid;
}

/**
 * 获取当前选区文本
 */
export function getCurrentSelectionText(deps: SelectionAPIDependencies): string {
  return getCurrentSelection(deps).text;
}

/**
 * 获取当前选区 Range
 */
export function getCurrentSelectionRange(deps: SelectionAPIDependencies): Range | null {
  return getCurrentSelection(deps).range;
}

/**
 * 获取 Highlighter 实例
 */
export function getHighlighter(deps: SelectionAPIDependencies) {
  return deps.highlighter.getHighlighter();
}
