import type { SelectionHighlightStyle as HighlightStyle, SelectionTypeConfig } from 'range-kit'
import { DEFAULT_SELECTION_STYLE } from '../use-selection-restore/constants'

/**
 * 默认搜索高亮样式 - 与划词选中保持一致（浅黄色背景加深黄色下划线）
 */
export const DEFAULT_SEARCH_HIGHLIGHT_STYLE: HighlightStyle = DEFAULT_SELECTION_STYLE

/**
 * 默认搜索高亮类型配置
 */
export const DEFAULT_SEARCH_HIGHLIGHT_TYPES: SelectionTypeConfig[] = [
  {
    type: 'search',
    label: '搜索高亮',
    style: DEFAULT_SEARCH_HIGHLIGHT_STYLE,
    description: '默认的搜索高亮样式'
  }
]
