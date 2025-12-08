import { describe, it, expect } from 'vitest'
import { useNavigation } from '../index'

describe('hooks/use-navigation per-folder tests', () => {
  it('exports a hook function', () => {
    expect(typeof useNavigation).toBe('function')
  })
})

