import { describe, it, expect } from 'vitest'
import { useSelectionRestore } from '../index'

describe('vue composables/use-selection-restore per-folder tests', () => {
  it('exports a function', () => {
    expect(typeof useSelectionRestore).toBe('function')
  })
})

