/**
 * @file Range SDK 主入口文件
 * @description 导出所有公共接口和类型
 */

// 导出类型
export * from './types';
export { RangeSdkAppIdNameMap } from './constants';

// 导出核心功能 - SelectionManager 是主入口
export * from './selection-manager';

// 导出 selection-restore 的类型和功能
export {
  SelectionRestore,
  createSelectionRestore,
  type SelectionRestoreAPI,
  SelectionBehaviorType,
  type SelectionRestoreOptions,
  type SerializedSelection,
  type SelectionBehaviorEvent,
  type SelectionTypeConfig,
  type SelectionInteractionEvent,
  type SelectionInstance,
  type SelectionCompleteEvent,
  type RestoreResult,
  type SelectionStats,
  type AnchorInfo,
  type PathInfo,
  type MultipleAnchorInfo,
  type TextContext,
  type SerializedSelectionSimple,
  type StructuralFingerprint as SelectionStructuralFingerprint,
  type HighlightStyle as SelectionHighlightStyle,
  type SearchMatchItem,
  type SearchMatchFilter,
  type OverlappedRange,
  convertToSimple,
  convertSelectionsToSimple
} from './selection-restore';
