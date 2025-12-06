/**
 * 高亮导航 Hook 常量定义
 */

import type { CurrentHighlightStyle } from './types'

/**
 * 默认当前高亮样式
 * 模仿 Chrome 浏览器搜索高亮的橙色样式
 */
export const DEFAULT_CURRENT_HIGHLIGHT_STYLE: CurrentHighlightStyle = {
  backgroundColor: '#ff9632',  // Chrome 搜索高亮橙色
  color: '#000000',
  border: 'none',
  borderRadius: '2px',
  transition: 'background-color 0.15s ease'
}

/**
 * CSS 高亮名称 - 当前选中的高亮
 */
export const CURRENT_HIGHLIGHT_NAME = 'current-navigation-highlight'
