/**
 * Vue 入口文件
 * 专门导出 Vue 相关的功能，包括 Composition API Hooks
 */

// 导出 Vue Hooks
export * from './hooks'

// 导出相关类型（来自核心模块）
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
} from '@life2code/range-kit-core'