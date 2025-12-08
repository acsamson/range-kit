import { describe, it, expect } from 'vitest'
import { createInteractionHandler } from '../index'

describe('hooks/common per-folder tests', () => {
  it('exports createInteractionHandler', () => {
    expect(typeof createInteractionHandler).toBe('function')
  })
})

