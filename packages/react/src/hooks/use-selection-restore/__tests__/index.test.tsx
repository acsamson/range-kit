import { describe, it, expect } from 'vitest'
import { useSelectionRestore } from '../index'

describe('hooks/use-selection-restore per-folder tests', () => {
  it('exports a hook function', () => {
    expect(typeof useSelectionRestore).toBe('function')
  })
})

