/**
 * 词典卡片位置计算器
 * 智能计算卡片位置，避免遮挡目标元素
 */

export interface PositionOptions {
  /** 目标元素的位置信息 */
  targetRect: DOMRect
  /** 卡片宽度 */
  cardWidth: number
  /** 卡片高度（如果已知） */
  cardHeight?: number
  /** 与目标元素的间距 */
  offset?: number
  /** 优先显示位置 */
  preferredPosition?: 'right' | 'left' | 'top' | 'bottom'
}

export interface CalculatedPosition {
  x: number
  y: number
  position: 'right' | 'left' | 'top' | 'bottom'
}

/**
 * 计算词典卡片的最佳位置
 */
export function calculateOptimalPosition(options: PositionOptions): CalculatedPosition {
  const {
    targetRect,
    cardWidth,
    cardHeight = 300, // 默认高度
    offset = 8,
    preferredPosition = 'right'
  } = options

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  }

  // 计算各个方向的可用空间
  const spaceRight = viewport.width - (targetRect.right + offset)
  const spaceLeft = targetRect.left - offset
  const spaceBottom = viewport.height - (targetRect.bottom + offset)
  const spaceTop = targetRect.top - offset

  // 定义各个位置的计算方法
  const positions = {
    right: {
      x: targetRect.right + offset,
      y: targetRect.top,
      feasible: spaceRight >= cardWidth,
      space: spaceRight
    },
    left: {
      x: targetRect.left - cardWidth - offset,
      y: targetRect.top,
      feasible: spaceLeft >= cardWidth,
      space: spaceLeft
    },
    bottom: {
      x: targetRect.left,
      y: targetRect.bottom + offset,
      feasible: spaceBottom >= cardHeight,
      space: spaceBottom
    },
    top: {
      x: targetRect.left,
      y: targetRect.top - cardHeight - offset,
      feasible: spaceTop >= cardHeight,
      space: spaceTop
    }
  }

  // 尝试优先位置
  if (positions[preferredPosition].feasible) {
    return adjustPosition({
      x: positions[preferredPosition].x,
      y: positions[preferredPosition].y,
      position: preferredPosition
    }, cardWidth, cardHeight, viewport)
  }

  // 按空间大小排序，选择最佳位置
  const sortedPositions = Object.entries(positions)
    .filter(([_, pos]) => pos.feasible)
    .sort((a, b) => b[1].space - a[1].space)

  if (sortedPositions.length > 0) {
    const [bestPosition, posData] = sortedPositions[0]
    return adjustPosition({
      x: posData.x,
      y: posData.y,
      position: bestPosition as any
    }, cardWidth, cardHeight, viewport)
  }

  // 如果所有方向都没有足够空间，选择右侧并调整位置
  return adjustPosition({
    x: Math.min(targetRect.right + offset, viewport.width - cardWidth - 10),
    y: targetRect.top,
    position: 'right'
  }, cardWidth, cardHeight, viewport)
}

/**
 * 调整位置确保卡片完全在视口内
 */
function adjustPosition(
  position: CalculatedPosition,
  cardWidth: number,
  cardHeight: number,
  viewport: { width: number; height: number }
): CalculatedPosition {
  const margin = 10 // 距离视口边缘的最小距离

  // 调整 X 坐标
  if (position.x < margin) {
    position.x = margin
  } else if (position.x + cardWidth > viewport.width - margin) {
    position.x = viewport.width - cardWidth - margin
  }

  // 调整 Y 坐标
  if (position.y < margin) {
    position.y = margin
  } else if (position.y + cardHeight > viewport.height - margin) {
    position.y = viewport.height - cardHeight - margin
  }

  return position
}

/**
 * 计算避免遮挡的智能位置
 * 优先级：右侧 > 左侧 > 下方 > 上方
 */
export function calculateSmartPosition(
  targetElement: HTMLElement,
  cardWidth: number = 400,
  cardHeight: number = 300
): CalculatedPosition {
  const targetRect = targetElement.getBoundingClientRect()
  
  // 检测目标元素在视口中的位置
  const viewportCenterX = window.innerWidth / 2
  const targetCenterX = targetRect.left + targetRect.width / 2
  
  // 如果目标在右半部分，优先显示在左侧
  const preferredPosition = targetCenterX > viewportCenterX ? 'left' : 'right'
  
  return calculateOptimalPosition({
    targetRect,
    cardWidth,
    cardHeight,
    offset: 8,
    preferredPosition
  })
}