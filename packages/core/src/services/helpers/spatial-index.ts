/**
 * 空间索引优化
 * 用于快速查找鼠标位置附近的高亮元素
 */

import type { HighlightedRange } from './types';
import { logDebug, logInfo } from '../../common/debug';

interface GridCell {
  highlights: Set<HighlightedRange>;
}

export interface SpatialIndexOptions {
  gridSize?: number; // 网格大小（像素）
  enableDebug?: boolean;
}

/**
 * 空间索引类
 * 使用网格索引来加速高亮查找
 */
export class SpatialIndex {
  private grid: Map<string, GridCell> = new Map();
  private highlightToGridKeys: Map<string, Set<string>> = new Map();
  private gridSize: number;
  private enableDebug: boolean;
  private stats = {
    totalHighlights: 0,
    gridCells: 0,
    averageHighlightsPerCell: 0,
  };

  constructor(options: SpatialIndexOptions = {}) {
    this.gridSize = options.gridSize || 50; // 默认50px网格
    this.enableDebug = options.enableDebug || false;
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.grid.clear();
    this.highlightToGridKeys.clear();
    this.stats.totalHighlights = 0;
    this.stats.gridCells = 0;
    this.stats.averageHighlightsPerCell = 0;
  }

  /**
   * 添加高亮到索引
   */
  addHighlight(highlight: HighlightedRange): void {
    try {
      const rects = highlight.range.getClientRects();
      const gridKeys = new Set<string>();

      // 为每个矩形添加到对应的网格单元
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        // 考虑滚动偏移
        const adjustedRect = {
          left: rect.left + window.scrollX,
          right: rect.right + window.scrollX,
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
        };

        const keys = this.getGridKeysForRect(adjustedRect);
        keys.forEach(key => {
          gridKeys.add(key);

          if (!this.grid.has(key)) {
            this.grid.set(key, { highlights: new Set() });
          }
          this.grid.get(key)!.highlights.add(highlight);
        });
      }

      // 存储高亮到网格键的映射，便于后续删除
      this.highlightToGridKeys.set(highlight.highlightId, gridKeys);
      this.updateStats();

      if (this.enableDebug) {
        logDebug('spatial-index', '添加高亮到索引', {
          highlightId: highlight.highlightId,
          gridKeys: Array.from(gridKeys),
          rectsCount: rects.length,
        });
      }
    } catch (error) {
      logDebug('spatial-index', '添加高亮失败', { error: (error as Error).message });
    }
  }

  /**
   * 批量添加高亮
   */
  addHighlights(highlights: HighlightedRange[]): void {
    const startTime = performance.now();

    highlights.forEach(highlight => {
      this.addHighlight(highlight);
    });

    const duration = performance.now() - startTime;
    logInfo('spatial-index', `批量添加 ${highlights.length} 个高亮完成`, {
      duration: `${duration.toFixed(2)}ms`,
      stats: this.stats,
    });
  }

  /**
   * 从索引中移除高亮
   */
  removeHighlight(highlightId: string): void {
    const gridKeys = this.highlightToGridKeys.get(highlightId);
    if (!gridKeys) return;

    gridKeys.forEach(key => {
      const cell = this.grid.get(key);
      if (cell) {
        // 移除高亮引用
        const highlightToRemove = Array.from(cell.highlights).find(h => h.highlightId === highlightId);
        if (highlightToRemove) {
          cell.highlights.delete(highlightToRemove);
        }

        // 如果单元格为空，删除它
        if (cell.highlights.size === 0) {
          this.grid.delete(key);
        }
      }
    });

    this.highlightToGridKeys.delete(highlightId);
    this.updateStats();
  }

  /**
   * 获取指定坐标点的候选高亮
   */
  getCandidates(x: number, y: number): HighlightedRange[] {
    // 考虑滚动偏移
    const adjustedX = x + window.scrollX;
    const adjustedY = y + window.scrollY;

    const gridX = Math.floor(adjustedX / this.gridSize);
    const gridY = Math.floor(adjustedY / this.gridSize);
    const key = this.makeGridKey(gridX, gridY);

    const cell = this.grid.get(key);
    if (!cell) return [];

    // 使用 Set 去重，因为一个高亮可能跨越多个单元格
    const candidates = new Set<HighlightedRange>();

    // 检查当前单元格和相邻单元格（处理边界情况）
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = this.makeGridKey(gridX + dx, gridY + dy);
        const neighborCell = this.grid.get(neighborKey);
        if (neighborCell) {
          neighborCell.highlights.forEach(h => candidates.add(h));
        }
      }
    }

    if (this.enableDebug) {
      logDebug('spatial-index', '获取候选高亮', {
        x,
        y,
        gridKey: key,
        candidatesCount: candidates.size,
      });
    }

    return Array.from(candidates);
  }

  /**
   * 获取可视区域内的高亮
   */
  getVisibleHighlights(): HighlightedRange[] {
    const viewport = {
      left: window.scrollX,
      top: window.scrollY,
      right: window.scrollX + window.innerWidth,
      bottom: window.scrollY + window.innerHeight,
    };

    const visibleHighlights = new Set<HighlightedRange>();

    // 计算可视区域覆盖的网格范围
    const startX = Math.floor(viewport.left / this.gridSize);
    const endX = Math.ceil(viewport.right / this.gridSize);
    const startY = Math.floor(viewport.top / this.gridSize);
    const endY = Math.ceil(viewport.bottom / this.gridSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = this.makeGridKey(x, y);
        const cell = this.grid.get(key);
        if (cell) {
          cell.highlights.forEach(h => visibleHighlights.add(h));
        }
      }
    }

    return Array.from(visibleHighlights);
  }

  /**
   * 获取索引统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * 获取矩形覆盖的网格键
   */
  private getGridKeysForRect(rect: { left: number; right: number; top: number; bottom: number }): string[] {
    const keys: string[] = [];

    const startX = Math.floor(rect.left / this.gridSize);
    const endX = Math.floor(rect.right / this.gridSize);
    const startY = Math.floor(rect.top / this.gridSize);
    const endY = Math.floor(rect.bottom / this.gridSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        keys.push(this.makeGridKey(x, y));
      }
    }

    return keys;
  }

  /**
   * 创建网格键
   */
  private makeGridKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.totalHighlights = this.highlightToGridKeys.size;
    this.stats.gridCells = this.grid.size;

    if (this.stats.gridCells > 0) {
      let totalHighlightsInCells = 0;
      this.grid.forEach(cell => {
        totalHighlightsInCells += cell.highlights.size;
      });
      this.stats.averageHighlightsPerCell = totalHighlightsInCells / this.stats.gridCells;
    } else {
      this.stats.averageHighlightsPerCell = 0;
    }
  }
}
