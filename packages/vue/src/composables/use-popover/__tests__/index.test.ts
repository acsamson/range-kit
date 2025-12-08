import { describe, it, expect } from 'vitest'
import { usePopover } from '../index'

describe('vue composables/use-popover per-folder tests', () => {
  it('exports a function', () => {
    expect(typeof usePopover).toBe('function')
  })
})

