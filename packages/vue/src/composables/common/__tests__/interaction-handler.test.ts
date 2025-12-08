import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { createInteractionHandler, checkPointOnKeyword, createKeywordRange } from '../interaction-handler'

describe('vue composables/common/interaction-handler', () => {
  let textNode: Text
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    container.textContent = 'hello keyword world'
    document.body.appendChild(container)
    textNode = container.firstChild as Text

    document.caretRangeFromPoint = (x: number, y: number) => {
      const range = document.createRange()
      range.setStart(textNode, 7)
      range.setEnd(textNode, 7)
      return range
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('checkPointOnKeyword detects keyword under caret', () => {
    const e = new MouseEvent('click', { clientX: 0, clientY: 0 })
    const hit = checkPointOnKeyword(e, ['keyword'])
    expect(hit).toBe('keyword')
  })

  it('createKeywordRange returns precise range for keyword at caret', () => {
    const e = new MouseEvent('click', { clientX: 0, clientY: 0 })
    const r = createKeywordRange(e, 'keyword')
    expect(r).toBeTruthy()
    expect(r!.toString()).toBe('keyword')
  })

  it('createInteractionHandler attaches listeners and triggers callbacks', () => {
    const keywords = ref<string[]>(['keyword'])
    const onInteraction = vi.fn()
    const handler = createInteractionHandler({
      keywords,
      containers: ['body'],
      onInteraction
    })
    handler.setup()

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click', text: 'keyword' }))

    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'dblclick', text: 'keyword' }))

    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }))
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'contextmenu', text: 'keyword' }))

    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    vi.advanceTimersByTime(60)
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'hover', text: 'keyword' }))

    handler.cleanup()
  })

  it('hover branch resets when leaving keyword area', () => {
    const keywords = ref<string[]>(['keyword'])
    const onInteraction = vi.fn()
    const handler = createInteractionHandler({ keywords, containers: ['body'], onInteraction })
    handler.setup()

    document.caretRangeFromPoint = () => {
      const range = document.createRange()
      range.setStart(textNode, 7)
      range.setEnd(textNode, 7)
      return range
    }
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    vi.advanceTimersByTime(60)
    expect(onInteraction).toHaveBeenCalledTimes(1)

    document.caretRangeFromPoint = () => {
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 0)
      return range
    }
    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    vi.advanceTimersByTime(60)
    expect(onInteraction).toHaveBeenCalledTimes(0)

    handler.cleanup()
  })
})

