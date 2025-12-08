/**
 * Range 相关工具函数
 */

/**
 * 检测点是否在 Range 范围内
 * 通过检查点坐标是否落在 Range 的任意一个 ClientRect 中来判断
 *
 * @param x - 点的 x 坐标（相对于视口）
 * @param y - 点的 y 坐标（相对于视口）
 * @param range - 要检测的 Range 对象
 * @param tolerance - 容差值（像素），用于扩大检测区域，默认 2
 * @returns 点是否在 Range 范围内
 *
 * @example
 * ```typescript
 * document.addEventListener('click', (e) => {
 *   const range = getHighlightRange();
 *   if (isPointInRange(e.clientX, e.clientY, range)) {
 *     console.log('Clicked on highlighted text');
 *   }
 * });
 * ```
 */
export function isPointInRange(
  x: number,
  y: number,
  range: Range,
  tolerance: number = 2
): boolean {
  try {
    const rects = range.getClientRects();

    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      if (
        x >= rect.left - tolerance &&
        x <= rect.right + tolerance &&
        y >= rect.top - tolerance &&
        y <= rect.bottom + tolerance
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 获取 Range 的中心点坐标
 *
 * @param range - Range 对象
 * @returns 中心点坐标，如果无法获取则返回 null
 */
export function getRangeCenter(range: Range): { x: number; y: number } | null {
  try {
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return null;
    }
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  } catch {
    return null;
  }
}

/**
 * 获取 Range 的边界位置信息
 *
 * @param range - Range 对象
 * @returns 位置信息，包含 x, y, width, height
 */
export function getRangePosition(range: Range): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  try {
    const rect = range.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  } catch {
    return null;
  }
}
