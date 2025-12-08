import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'

vi.mock('@floating-ui/react', () => {
  const refs = {
    reference: { current: null },
    floating: { current: document.createElement('div') },
    setReference: () => {},
    setFloating: () => {},
    setPositionReference: () => {}
  }
  return {
    useFloating: () => ({ refs, floatingStyles: { transform: 'translate(10px, 10px)' } }),
    offset: () => ({}),
    flip: () => ({}),
    shift: () => ({}),
    autoUpdate: () => {}
  }
})

import SelectionPopover from '../SelectionPopover'

describe('components/SelectionPopover (react)', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    vi.useFakeTimers()
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    root.unmount()
    document.body.innerHTML = ''
  })

  it('renders nothing when not visible', () => {
    root.render(<SelectionPopover visible={false} />)
    expect(document.querySelector('.rk-selection-popover')).toBeNull()
  })

  it('renders popover when visible with valid transform', async () => {
    act(() => {
      root.render(
      <SelectionPopover
        visible={true}
        data={{ position: { x: 0, y: 0, width: 10, height: 10 }, items: [] }}
      >
        <span id="child">child</span>
      </SelectionPopover>
      )
    })
    await Promise.resolve()
    const el = document.querySelector('.rk-selection-popover') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.style.visibility).toBe('visible')
    expect(document.getElementById('child')).toBeTruthy()
  })

  it('auto hides after delay', async () => {
    const onClose = vi.fn()
    act(() => {
      root.render(
      <SelectionPopover
        visible={true}
        autoHideDelay={100}
        data={{ position: { x: 0, y: 0, width: 10, height: 10 }, items: [] }}
        onClose={onClose}
      />
      )
    })
    await Promise.resolve()
    vi.advanceTimersByTime(100)
    expect(onClose).toHaveBeenCalled()
  })

  it('click outside triggers close when enabled', async () => {
    const onClose = vi.fn()
    act(() => {
      root.render(
      <SelectionPopover
        visible={true}
        closeOnClickOutside={true}
        data={{ position: { x: 0, y: 0, width: 10, height: 10 }, items: [] }}
        onClose={onClose}
      />
      )
    })
    await Promise.resolve()
    // after 250ms protection window
    vi.advanceTimersByTime(250)
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClose).toHaveBeenCalled()
  })

  it('scroll event closes when enabled', async () => {
    const onClose = vi.fn()
    act(() => {
      root.render(
      <SelectionPopover
        visible={true}
        closeOnScroll={true}
        data={{ position: { x: 0, y: 0, width: 10, height: 10 }, items: [] }}
        onClose={onClose}
      />
      )
    })
    await Promise.resolve()
    window.dispatchEvent(new Event('scroll', { bubbles: true }))
    expect(onClose).toHaveBeenCalled()
  })
})
