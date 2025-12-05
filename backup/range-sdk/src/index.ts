/**
 * @file Range SDK 主入口文件
 * @description 导出所有公共接口和类型
 */

// 导出类型 - 包括 RangeSdkAppId 枚举
export * from './types';
export type {
  BaseRangeSDK,
  CommonPlugins,
  MyRangeSDK,
  WithDictionary,
  WithComment,
  WithHighlight,
  CombinePlugins
} from './types/plugin-types';
export { createTypedRangeSDK } from './types/plugin-types';
export { RangeSdkAppIdNameMap } from './constants';
// 导出核心功能
export * from './core';

// 导出带插件的SDK
export { createRangeSDK } from './core/range-sdk-with-plugins';

// 导出 selection-restore 的类型和功能
export {
  SelectionRestore,
  createSelectionRestore,
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
  type HighlightStyle as SelectionHighlightStyle
} from './core/selection-restore';
