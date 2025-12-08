import { describe, it, expect } from 'vitest'
import { useHighlightNavigation } from '../index'

describe('vue composables/use-highlight-navigation per-folder tests', () => {
  it('exports a function', () => {
    expect(typeof useHighlightNavigation).toBe('function')
  })
})

