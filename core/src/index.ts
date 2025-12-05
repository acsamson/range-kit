/**
 * @file Range SDK 主入口文件
 * @description 导出所有公共接口和类型
 */

// 导出类型
export * from './types';
export { RangeSdkAppIdNameMap } from './constants';

// 导出核心功能
export * from './selection-manager';
export { RangeSDK } from './range-sdk';
export type { RangeSDKOptions } from './range-sdk';
export * from './performance-monitor';

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
  type SelectionContent,
  type SerializedSelectionSimple,
  type StructuralFingerprint as SelectionStructuralFingerprint,
  type HighlightStyle as SelectionHighlightStyle,
  type SearchMatchItem,
  type SearchMatchFilter,
  type OverlappedRange,
  convertToSimple,
  convertSelectionsToSimple
} from './selection-restore';
