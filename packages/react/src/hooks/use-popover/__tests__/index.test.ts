import { describe, it, expect } from 'vitest'
import { usePopover } from '../index'

describe('hooks/use-popover per-folder tests', () => {
  it('exports a hook function', () => {
    expect(typeof usePopover).toBe('function')
  })
})

