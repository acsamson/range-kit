import { describe, it, expect } from 'vitest'
import { useHighlightNavigation } from '../index'

describe('hooks/use-highlight-navigation per-folder tests', () => {
  it('exports a hook function', () => {
    expect(typeof useHighlightNavigation).toBe('function')
  })
})
