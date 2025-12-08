import type { SelectionHighlightStyle as HighlightStyle, SelectionTypeConfig } from 'range-kit'

/**
 * 默认选区样式配置 - 浅黄色背景加深黄色下划线
 */
export const DEFAULT_SELECTION_STYLE: HighlightStyle = {
  backgroundColor: '#fff3cd',
  textDecoration: 'underline',
  textDecorationColor: '#f1c40f',
  textDecorationThickness: '2px',
  textUnderlineOffset: '2px'
}

/**
 * 默认选区类型配置
 */
export const DEFAULT_SELECTION_TYPES: SelectionTypeConfig[] = [
  {
    type: 'default',
    label: '默认高亮',
    style: DEFAULT_SELECTION_STYLE,
    description: '默认的选区高亮样式'
  }
]
