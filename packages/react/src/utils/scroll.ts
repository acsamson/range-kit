/**
 * 滚动和排序工具函数
 * 处理 Range 滚动定位和 DOM 顺序排序相关逻辑
 */

/**
 * 按 DOM 顺序排序高亮 ID 列表
 * 使用 Range.compareBoundaryPoints 比较位置，实现类似 Chrome 搜索的顺序导航
 * @param ids 高亮 ID 列表
 * @param getRangeFn 获取 Range 的函数
 * @returns 排序后的 ID 列表
 */
export const sortHighlightIdsByDOMOrder = (
  ids: string[],
  getRangeFn: (id: string) => Range | undefined
): string[] => {
  // 收集有效的 ID 和对应的 Range
  const validItems: Array<{ id: string; range: Range }> = []

  for (const id of ids) {
    const range = getRangeFn(id)
    if (range) {
      validItems.push({ id, range })
    }
  }

  // 按 DOM 顺序排序
  validItems.sort((a, b) => {
    try {
      // 使用 compareBoundaryPoints 比较 Range 的起始位置
      // START_TO_START: 比较两个 Range 的起始点
      const result = a.range.compareBoundaryPoints(Range.START_TO_START, b.range)
      return result
    } catch {
      // 如果 Range 不在同一个文档中，回退到位置比较
      const rectA = a.range.getBoundingClientRect()
      const rectB = b.range.getBoundingClientRect()

      // 先按 top 排序，再按 left 排序
      if (rectA.top !== rectB.top) {
        return rectA.top - rectB.top
      }
      return rectA.left - rectB.left
    }
  })

  return validItems.map(item => item.id)
}

/**
 * 查找最近的可滚动祖先容器
 */
export const findScrollableAncestor = (element: Element | null): Element | null => {
  if (!element) return null

  let current: Element | null = element
  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current)
    const overflowY = style.overflowY
    const overflowX = style.overflowX

    // 检查是否可滚动
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll') &&
      (current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth)
    ) {
      return current
    }
    current = current.parentElement
  }

  return null
}

/**
 * 滚动到指定 Range
 * 在包含 Range 的可滚动容器内滚动，避免修改 DOM
 */
export const scrollToRange = (range: Range): void => {
  try {
    // 获取 Range 的起始节点元素
    const startNode = range.startContainer
    const element = startNode.nodeType === Node.ELEMENT_NODE
      ? startNode as Element
      : startNode.parentElement

    // 查找可滚动容器
    const scrollContainer = findScrollableAncestor(element)

    if (scrollContainer) {
      // 在容器内滚动
      const rangeRect = range.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()

      // 检查是否在容器可视区域内
      const isInContainerView = (
        rangeRect.top >= containerRect.top &&
        rangeRect.bottom <= containerRect.bottom
      )

      if (!isInContainerView) {
        // 计算目标滚动位置 - 将元素滚动到容器中央
        const targetScrollTop = scrollContainer.scrollTop +
          (rangeRect.top - containerRect.top) -
          (containerRect.height / 2) +
          (rangeRect.height / 2)

        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      }
    } else {
      // 没有可滚动容器，使用 window 滚动
      const rect = range.getBoundingClientRect()
      const isInViewport = (
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight
      )

      if (!isInViewport) {
        const scrollTop = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2)
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        })
      }
    }
  } catch {
    // 静默处理
  }
}
