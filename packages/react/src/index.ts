/**
 * React Hooks 入口文件
 */

export * from './hooks/useSelectionRestore';
export * from './hooks/useSearchHighlight';
export * from './hooks/useHighlightNavigation';

export type {
  SelectionInteractionEvent,
  SelectionInstance,
  SerializedSelection,
  SelectionCompleteEvent,
  SelectionRestoreOptions,
  SelectionBehaviorEvent,
  SelectionTypeConfig,
  SelectionHighlightStyle as HighlightStyle,
  SelectionBehaviorType
} from '@l2c/range-kit-core';
