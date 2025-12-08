import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sortHighlightIdsByDOMOrder, findScrollableAncestor, scrollToRange } from '../scroll'

function createRangeForNode(node: Node, start: number, end: number): Range {
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  return range
}

describe('utils/scroll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('sortHighlightIdsByDOMOrder sorts by DOM order using compareBoundaryPoints', () => {
    const container = document.createElement('div')
    const t1 = document.createTextNode('aaa bbb ccc')
    const t2 = document.createTextNode('ddd eee fff')
    container.appendChild(t1)
    container.appendChild(document.createElement('br'))
    container.appendChild(t2)
    document.body.appendChild(container)

    const r1 = createRangeForNode(t1, 0, 3) // aaa
    const r2 = createRangeForNode(t1, 4, 7) // bbb
    const r3 = createRangeForNode(t2, 0, 3) // ddd

    const ids = ['id3', 'id1', 'id2']
    const getRangeFn = (id: string) => ({ id1: r1, id2: r2, id3: r3 } as any)[id]
    const sorted = sortHighlightIdsByDOMOrder(ids, getRangeFn)
    expect(sorted).toEqual(['id1', 'id2', 'id3'])
  })

  it('sortHighlightIdsByDOMOrder falls back to rect comparison when compareBoundaryPoints throws', () => {
    const fakeRangeA = {
      compareBoundaryPoints: () => { throw new Error('different docs') },
      getBoundingClientRect: () => ({ top: 10, left: 20 }) as DOMRect
    } as unknown as Range
    const fakeRangeB = {
      compareBoundaryPoints: () => { throw new Error('different docs') },
      getBoundingClientRect: () => ({ top: 5, left: 30 }) as DOMRect
    } as unknown as Range
    const fakeRangeC = {
      compareBoundaryPoints: () => { throw new Error('different docs') },
      getBoundingClientRect: () => ({ top: 10, left: 10 }) as DOMRect
    } as unknown as Range

    const ids = ['c', 'a', 'b']
    const getRangeFn = (id: string) => ({ a: fakeRangeA, b: fakeRangeB, c: fakeRangeC } as any)[id]
    const sorted = sortHighlightIdsByDOMOrder(ids, getRangeFn)
    // top asc then left asc: b (5,30) -> c(10,10) -> a(10,20)
    expect(sorted).toEqual(['b', 'c', 'a'])
  })

  it('findScrollableAncestor finds the closest scrollable parent', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    outer.appendChild(inner)
    document.body.appendChild(outer)

    outer.style.overflowY = 'auto'
    Object.defineProperty(outer, 'scrollHeight', { value: 200 })
    Object.defineProperty(outer, 'clientHeight', { value: 100 })

    const found = findScrollableAncestor(inner)
    expect(found).toBe(outer)
  })

  it('findScrollableAncestor detects horizontal scroll via overflowX and scrollWidth', () => {
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    outer.appendChild(inner)
    document.body.appendChild(outer)

    outer.style.overflowX = 'scroll'
    Object.defineProperty(outer, 'scrollWidth', { value: 500 })
    Object.defineProperty(outer, 'clientWidth', { value: 100 })

    const found = findScrollableAncestor(inner)
    expect(found).toBe(outer)
  })

  it('findScrollableAncestor returns null when no scrollable ancestor or element is null', () => {
    expect(findScrollableAncestor(null)).toBeNull()
    const plain = document.createElement('div')
    document.body.appendChild(plain)
    const child = document.createElement('span')
    plain.appendChild(child)
    // no overflow and no scroll sizes
    expect(findScrollableAncestor(child)).toBeNull()
  })

  it('scrollToRange uses container scroll when out of view', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    Object.defineProperty(container, 'scrollHeight', { value: 1000 })
    Object.defineProperty(container, 'clientHeight', { value: 100 })
    Object.defineProperty(container, 'scrollTop', { writable: true, value: 0 })
    container.style.overflowY = 'auto'
    container.getBoundingClientRect = () => ({ top: 100, bottom: 200, height: 100 } as any)
    // Typed stub to satisfy both overloads: (options) and (x, y)
    container.scrollTo = vi.fn((arg1?: ScrollToOptions | number, arg2?: number) => {}) as unknown as typeof container.scrollTo

    const el = document.createElement('span')
    container.appendChild(el)
    const range = document.createRange()
    // start at TEXT_NODE to exercise parentElement path
    const text = document.createTextNode('x')
    el.appendChild(text)
    range.setStart(text, 0)
    range.setEnd(text, 1)
    // Patch findScrollableAncestor to return our container by ensuring DOM chain
    Object.defineProperty(el, 'parentElement', { get: () => container })
    // Patch range rect far below container
    range.getBoundingClientRect = () => ({ top: 400, bottom: 410, height: 10 } as any)

    scrollToRange(range)
    expect(container.scrollTo).toHaveBeenCalled()
  })

  it('scrollToRange does not scroll container when already in view', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    Object.defineProperty(container, 'scrollHeight', { value: 1000 })
    Object.defineProperty(container, 'clientHeight', { value: 100 })
    Object.defineProperty(container, 'scrollTop', { writable: true, value: 0 })
    container.style.overflowY = 'auto'
    container.getBoundingClientRect = () => ({ top: 100, bottom: 200, height: 100 } as any)
    // Typed stub to satisfy both overloads: (options) and (x, y)
    container.scrollTo = vi.fn((arg1?: ScrollToOptions | number, arg2?: number) => {}) as unknown as typeof container.scrollTo

    const el = document.createElement('span')
    container.appendChild(el)
    const text = document.createTextNode('xx')
    el.appendChild(text)
    const range = document.createRange()
    range.setStart(text, 0); range.setEnd(text, 1)
    Object.defineProperty(el, 'parentElement', { get: () => container })
    range.getBoundingClientRect = () => ({ top: 120, bottom: 130, height: 10 } as any)

    scrollToRange(range)
    expect(container.scrollTo).not.toHaveBeenCalled()
  })

  it('scrollToRange uses window scroll when no container and out of viewport', () => {
    const el = document.createElement('span')
    document.body.appendChild(el)
    const range = document.createRange()
    range.setStart(el, 0)
    range.setEnd(el, 0)
    range.getBoundingClientRect = () => ({ top: 1000, bottom: 1010, height: 10 } as any)

    const spy = vi.spyOn(window, 'scrollTo').mockImplementation((x: number, y: number) => {})
    Object.defineProperty(window, 'innerHeight', { value: 600 })
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })

    scrollToRange(range)
    expect(spy).toHaveBeenCalled()
  })

  it('scrollToRange does not scroll when already in viewport', () => {
    const el = document.createElement('span')
    document.body.appendChild(el)
    const range = document.createRange()
    range.setStart(el, 0)
    range.setEnd(el, 0)
    range.getBoundingClientRect = () => ({ top: 10, bottom: 20, height: 10 } as any)
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation((x: number, y: number) => {})
    Object.defineProperty(window, 'innerHeight', { value: 600 })
    scrollToRange(range)
    expect(spy).not.toHaveBeenCalled()
  })

  it('scrollToRange gracefully catches errors', () => {
    const el = document.createElement('span')
    document.body.appendChild(el)
    const range = document.createRange()
    range.setStart(el, 0)
    range.setEnd(el, 0)
    // Force getBoundingClientRect to throw
    range.getBoundingClientRect = () => { throw new Error('boom') }
    // Should not throw
    expect(() => scrollToRange(range)).not.toThrow()
  })
})
