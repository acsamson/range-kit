/**
 * Vue 入口文件
 * 专门导出 Vue 相关的功能，包括 Composition API Hooks
 *
 * 设计原则：穿透导出 range-kit 的能力，
 * 让使用者只需引入 range-kit-vue 即可
 */

// ========== Vue Hooks ==========
export * from './composables'

// ========== Vue Components ==========
export * from './components'

// ========== 穿透导出 Core 类型 ==========
// 选区相关类型
export type {
  SelectionRestoreAPI,
  SelectionRestoreOptions,
  SerializedSelection,
  SerializedSelectionSimple,
  SelectionBehaviorEvent,
  SelectionTypeConfig,
  SelectionInteractionEvent,
  SelectionInstance,
  SelectionCompleteEvent,
  RestoreResult,
  SelectionHighlightStyle as HighlightStyle,
  OverlappedRange,
  SearchMatchItem,
  SearchMatchFilter
} from 'range-kit'

// 枚举类型需要 value 导出
export { SelectionBehaviorType } from 'range-kit'

// 工具函数
export { convertToSimple, convertSelectionsToSimple } from 'range-kit'

// Range 工具函数
export { isPointInRange, getRangeCenter, getRangePosition } from 'range-kit'

// ========== 穿透导出 Core 类（高级用法） ==========
export {
  SelectionRestore,
  SelectionManager,
  // Highlighter 相关
  Highlighter,
  CSSPainter,
  // Locator 相关
  RangeLocator,
  createLocator,
  // Interaction 相关
  InteractionManager
} from 'range-kit'