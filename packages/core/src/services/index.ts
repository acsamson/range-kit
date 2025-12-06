/**
 * Facade 模块 - 用户侧入口
 *
 * 提供简化的 SelectionManager API，整合 SelectionRestore 引擎
 */

// 主类导出
export { SelectionManager } from './selection-manager';
export type { SelectionManagerOptions, ContainerInput } from './selection-manager';

// 工具函数导出
export { convertSelectionToRange, convertRangeToSelection } from './data-converter';
export { detectOverlappedRanges, checkRangeOverlap } from './overlap-detector';
