/**
 * API 子模块导出
 * Kit 采用无状态设计
 */

// 核心 API
export {
  serialize,
  restore,
  restoreWithoutClear,
  restoreRangeOnly,
} from './core-api';
export type { CoreAPIDependencies } from './core-api';

// 批量操作 API
export {
  highlightSelections,
  highlightAllSelections,
  highlightAllSelectionsWithoutScroll,
  highlightAllSelectionsScrollToLast,
  highlightAllSelectionsScrollToMiddle,
} from './batch-api';
export type { BatchAPIDependencies } from './batch-api';

// 选区操作 API
export {
  setHighlightStyle,
  highlightSelection,
  clearHighlight,
  detectAllSelectionsAtPoint,
  getActiveRange,
  getAllActiveSelectionIds,
  registerSelectionType,
  getRegisteredType,
  getAllRegisteredTypes,
  getCurrentSelection,
  hasValidSelection,
  getCurrentSelectionText,
  getCurrentSelectionRange,
  getHighlighter,
} from './selection-api';
export type { SelectionAPIDependencies } from './selection-api';
