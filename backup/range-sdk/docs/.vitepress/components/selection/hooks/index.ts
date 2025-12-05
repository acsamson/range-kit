/**
 * Selection Demo Hooks
 *
 * @description
 * 选区演示页面的 Hook 集合，展示如何使用 Range SDK：
 *
 * - usePage: 主入口 Hook，组合所有功能
 * - usePopover: 气泡状态管理
 * - useSelectionCallbacks: 选区行为回调
 * - useSelectionActions: 选区 CRUD 操作
 * - useSearchActions: 搜索高亮操作
 * - useDemoActions: Demo 专用功能
 *
 * @example
 * ```ts
 * // 完整功能使用
 * import { usePage } from './hooks'
 * const page = usePage()
 *
 * // 仅使用气泡状态
 * import { usePopover } from './hooks'
 * const popover = usePopover()
 *
 * // 仅使用选区操作
 * import { useSelectionActions } from './hooks'
 * const actions = useSelectionActions({ ... })
 * ```
 */

// 主入口
export { usePage } from './use-page'

// 拆分的 hooks（可按需单独使用）
export { usePopover } from './use-popover'
export type { PopoverData, UsePopoverReturn } from './use-popover'

export { useSelectionCallbacks } from './use-selection-callbacks'
export type { UseSelectionCallbacksOptions, UseSelectionCallbacksReturn } from './use-selection-callbacks'

export { useSelectionActions } from './use-selection-actions'
export type { UseSelectionActionsOptions, UseSelectionActionsReturn } from './use-selection-actions'

export { useSearchActions } from './use-search-actions'
export type { UseSearchActionsOptions, AddKeywordOptions, UseSearchActionsReturn } from './use-search-actions'

export { useDemoActions } from './use-demo-actions'
export type { UseDemoActionsOptions, UseDemoActionsReturn } from './use-demo-actions'
