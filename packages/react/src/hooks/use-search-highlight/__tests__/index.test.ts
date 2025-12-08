import { describe, it, expect } from 'vitest'
import { useSearchHighlight } from '../index'

describe('hooks/use-search-highlight per-folder tests', () => {
  it('exports a hook function', () => {
    expect(typeof useSearchHighlight).toBe('function')
  })
})

