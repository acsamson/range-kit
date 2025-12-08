import { describe, it, expect } from 'vitest'
import { useSearchHighlight } from '../index'

describe('vue composables/use-search-highlight per-folder tests', () => {
  it('exports a function', () => {
    expect(typeof useSearchHighlight).toBe('function')
  })
})

