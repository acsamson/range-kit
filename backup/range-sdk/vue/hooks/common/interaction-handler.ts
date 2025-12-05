import type { Ref } from 'vue'
import type { InteractionType } from './types'

/**
 * 交互处理器配置
 */
export interface InteractionHandlerConfig {
  /** 关键词列表（响应式） */
  keywords: Ref<string[]>
  /** 容器选择器 */
  containers: string[]
  /** 交互回调 */
  onInteraction: (event: {
    type: InteractionType
    text: string
    range: Range
    originalEvent: MouseEvent
  }) => void
  /** 是否在 click 时设置浏览器选区，默认 true */
  setSelectionOnClick?: boolean
}

/**
 * 交互处理器返回值
 */
export interface InteractionHandler {
  /** 设置事件监听 */
  setup: () => void
  /** 清理事件监听 */
  cleanup: () => void
}

/**
 * 检查鼠标位置是否在关键词上
 */
export const checkPointOnKeyword = (
  e: MouseEvent,
  keywords: string[]
): string | null => {
  if (keywords.length === 0) return null

  const caretRange = document.caretRangeFromPoint?.(e.clientX, e.clientY)
  if (!caretRange) return null

  const node = caretRange.startContainer
  if (node.nodeType !== Node.TEXT_NODE) return null

  const textContent = node.textContent || ''
  const offset = caretRange.startOffset

  // 遍历关键词检查是否命中
  for (const keyword of keywords) {
    let searchIndex = 0
    while (searchIndex < textContent.length) {
      const matchIndex = textContent.indexOf(keyword, searchIndex)
      if (matchIndex === -1) break

      const matchEnd = matchIndex + keyword.length
      if (offset >= matchIndex && offset <= matchEnd) {
        return keyword
      }
      searchIndex = matchIndex + 1
    }
  }
  return null
}

/**
 * 创建关键词的精确 Range
 */
export const createKeywordRange = (
  e: MouseEvent,
  keyword: string
): Range | null => {
  const caretRange = document.caretRangeFromPoint?.(e.clientX, e.clientY)
  if (!caretRange) return null

  const node = caretRange.startContainer
  const offset = caretRange.startOffset

  if (node.nodeType !== Node.TEXT_NODE) return null

  const textContent = node.textContent || ''

  // 查找点击位置的关键词范围
  let foundStart = -1
  let foundEnd = -1
  let searchIndex = 0

  while (searchIndex < textContent.length) {
    const matchIndex = textContent.indexOf(keyword, searchIndex)
    if (matchIndex === -1) break

    const matchEnd = matchIndex + keyword.length
    if (offset >= matchIndex && offset <= matchEnd) {
      foundStart = matchIndex
      foundEnd = matchEnd
      break
    }
    searchIndex = matchIndex + 1
  }

  if (foundStart === -1) return null

  // 创建精确的 Range
  const range = document.createRange()
  range.setStart(node, foundStart)
  range.setEnd(node, foundEnd)
  return range
}

/**
 * 事件类型映射
 */
const EVENT_TYPE_MAP: Array<{ type: InteractionType; domEvent: string }> = [
  { type: 'click', domEvent: 'click' },
  { type: 'dblclick', domEvent: 'dblclick' },
  { type: 'hover', domEvent: 'mouseover' },
  { type: 'contextmenu', domEvent: 'contextmenu' }
]

/**
 * 创建交互处理器
 * 通用的事件监听设置和清理逻辑
 */
export function createInteractionHandler(
  config: InteractionHandlerConfig
): InteractionHandler {
  const eventHandlers: Map<string, Map<string, EventListener>> = new Map()
  const setSelectionOnClick = config.setSelectionOnClick ?? true

  /**
   * 处理交互事件
   */
  const handleInteraction = (
    e: MouseEvent,
    keyword: string,
    type: InteractionType
  ) => {
    const range = createKeywordRange(e, keyword)
    if (!range) return

    // click 时设置浏览器选区
    if (type === 'click' && setSelectionOnClick) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }

    // 触发回调
    config.onInteraction({
      type,
      text: keyword,
      range,
      originalEvent: e
    })
  }

  /**
   * 创建事件监听器
   */
  const createEventListener = (type: InteractionType): EventListener => {
    return ((e: Event) => {
      const mouseEvent = e as MouseEvent
      const keyword = checkPointOnKeyword(mouseEvent, config.keywords.value)
      if (keyword) {
        handleInteraction(mouseEvent, keyword, type)
        // click、dblclick、contextmenu 阻止冒泡，hover 不阻止
        if (type !== 'hover') {
          e.stopPropagation()
        }
      }
    }) as EventListener
  }

  /**
   * 设置事件监听
   */
  const setup = () => {
    const containerSelectors = config.containers.length > 0 ? config.containers : ['body']

    containerSelectors.forEach(selector => {
      const container = document.querySelector(selector)
      if (!container) return

      const selectorHandlers = new Map<string, EventListener>()

      EVENT_TYPE_MAP.forEach(({ type, domEvent }) => {
        const handler = createEventListener(type)
        selectorHandlers.set(domEvent, handler)
        container.addEventListener(domEvent, handler, true)
      })

      eventHandlers.set(selector, selectorHandlers)
    })
  }

  /**
   * 清理事件监听
   */
  const cleanup = () => {
    eventHandlers.forEach((selectorHandlers, selector) => {
      const container = document.querySelector(selector)
      if (container) {
        selectorHandlers.forEach((handler, domEvent) => {
          container.removeEventListener(domEvent, handler, true)
        })
      }
    })
    eventHandlers.clear()
  }

  return { setup, cleanup }
}
