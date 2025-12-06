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
  SearchMatchFilter
} from './use-search-highlight/types'

// ========== 高亮导航相关 Hook ==========
export { useHighlightNavigation } from './use-highlight-navigation/index'

export type {
  UseHighlightNavigationOptions,
  UseHighlightNavigationReturn,
  NavigableHighlight,
  CurrentHighlightStyle
} from './use-highlight-navigation/types'