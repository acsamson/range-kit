/**
 * Vue Hooks 入口文件
 * 统一导出所有 Vue Composition API Hooks
 */

// ========== 选区恢复相关 Hook ==========
export {
  useSelectionRestore,
  convertToSimple,
  convertSelectionsToSimple
} from './use-selection-restore/index'

export type {
  UseSelectionRestoreOptions,
  UseSelectionRestoreReturn,
  HighlightNavigationState,
  NavigationHighlight,
  SelectionActionEvent,
  SelectionActionType
} from './use-selection-restore/types'

// ========== 搜索高亮相关 Hook ==========
export { useSearchHighlight } from './use-search-highlight/index'

export type {
  UseSearchHighlightOptions,
  UseSearchHighlightReturn,
  SearchHighlightInteractionEvent,
  SearchHighlightInteractionType,
  SearchHighlightOptions,
  SearchHighlightResult,
  SearchMatchItem,
  SearchMatchFilter,
  SearchResultItem
} from './use-search-highlight/types'

// ========== 高亮导航相关类型（内部使用） ==========
// 注意：useHighlightNavigation 不再独立导出
// 请使用 useSelectionRestore 返回的 navigation 对象，它会自动与 Kit 状态同步
export type {
  CurrentHighlightStyle
} from './use-highlight-navigation/types'

// ========== Popover 相关 Hook ==========
export { usePopover } from './use-popover/index'

export type {
  UsePopoverOptions,
  UsePopoverReturn,
  PopoverData,
  PopoverItem,
  PopoverItemType,
  PopoverPosition
} from './use-popover/types'