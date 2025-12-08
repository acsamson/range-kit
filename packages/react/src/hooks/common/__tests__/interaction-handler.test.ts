import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createInteractionHandler, checkPointOnKeyword, createKeywordRange } from '../interaction-handler'

describe('hooks/common/interaction-handler', () => {
  let textNode: Text
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()

    container = document.createElement('div')
    container.textContent = 'hello keyword world'
    document.body.appendChild(container)
    textNode = container.firstChild as Text

    // Mock caretRangeFromPoint to return a range positioned at offset 7 (inside "keyword")
    ;(document as any).caretRangeFromPoint = (x: number, y: number) => {
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

  it('createInteractionHandler attaches listeners and triggers callbacks for events', () => {
    const keywordsRef = { current: ['keyword'] }
    const onInteraction = vi.fn()
    const handler = createInteractionHandler({
      keywordsRef,
      containers: ['body'],
      onInteraction
    })

    handler.setup()

    // click
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click', text: 'keyword' }))

    // dblclick
    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'dblclick', text: 'keyword' }))

    // contextmenu
    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }))
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'contextmenu', text: 'keyword' }))

    // hover (debounced, deduped)
    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    // advance debounce
    vi.advanceTimersByTime(60)
    expect(onInteraction).toHaveBeenCalledTimes(1)
    expect(onInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'hover', text: 'keyword' }))

    handler.cleanup()
  })

  it('returns null when no caret range or not on keyword', () => {
    // No caretRangeFromPoint
    ;(document as any).caretRangeFromPoint = undefined
    const e = new MouseEvent('click', { clientX: 0, clientY: 0 })
    expect(checkPointOnKeyword(e, ['keyword'])).toBeNull()

    // caret on element node
    ;(document as any).caretRangeFromPoint = () => {
      const range = document.createRange()
      range.setStart(container, 0)
      range.setEnd(container, 0)
      return range
    }
    expect(checkPointOnKeyword(new MouseEvent('click'), ['keyword'])).toBeNull()
  })

  it('hover branch resets when leaving keyword area', () => {
    const keywordsRef = { current: ['keyword'] }
    const onInteraction = vi.fn()
    const handler = createInteractionHandler({ keywordsRef, containers: ['body'], onInteraction })
    handler.setup()

    // First move on keyword
    ;(document as any).caretRangeFromPoint = () => {
      const range = document.createRange()
      range.setStart(textNode, 7)
      range.setEnd(textNode, 7)
      return range
    }
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    vi.advanceTimersByTime(60)
    expect(onInteraction).toHaveBeenCalledTimes(1)

    // Now move outside keyword
    ;(document as any).caretRangeFromPoint = () => {
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 0)
      return range
    }
    onInteraction.mockReset()
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    vi.advanceTimersByTime(60)
    // Should not trigger
    expect(onInteraction).toHaveBeenCalledTimes(0)

    handler.cleanup()
  })
})
