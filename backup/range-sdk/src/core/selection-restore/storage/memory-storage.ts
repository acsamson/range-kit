import { Storage, SerializedSelection, SelectionStats, RestoreStatus } from '../types';

/**
 * 内存存储实现
 * 仅在内存中存储数据，页面刷新后数据丢失
 * 用于禁用持久化存储时的替代方案
 */
export class MemoryStorage implements Storage {
  private data: Map<string, SerializedSelection> = new Map();

  /**
   * 保存选区数据
   */
  async save(key: string, data: SerializedSelection): Promise<void> {
    this.data.set(key, { ...data });
  }

  /**
   * 获取选区数据
   */
  async get(key: string): Promise<SerializedSelection | null> {
    const data = this.data.get(key);
    return data ? { ...data } : null;
  }

  /**
   * 获取所有选区数据
   */
  async getAll(): Promise<SerializedSelection[]> {
    return Array.from(this.data.values()).map(data => ({ ...data }));
  }

  /**
   * 根据URL获取选区
   */
  async getByUrl(url: string): Promise<SerializedSelection[]> {
    const results: SerializedSelection[] = [];
    for (const selection of this.data.values()) {
      if (selection.metadata?.url === url) {
        results.push({ ...selection });
      }
    }
    return results;
  }

  /**
   * 根据内容哈希查找选区
   */
  async getByContentHash(contentHash: string): Promise<SerializedSelection[]> {
    const results: SerializedSelection[] = [];
    for (const selection of this.data.values()) {
      if (selection.contentHash === contentHash) {
        results.push({ ...selection });
      }
    }
    return results;
  }

  /**
   * 删除选区数据
   */
  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.data.clear();
  }

  /**
   * 更新选区的恢复状态
   */
  async updateRestoreStatus(key: string, status: RestoreStatus): Promise<void> {
    const selection = this.data.get(key);
    if (selection) {
      selection.restoreStatus = status;
      this.data.set(key, selection);
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<SelectionStats> {
    const allSelections = Array.from(this.data.values());

    const totalSaved = allSelections.length;
    const successfulRestores = allSelections.filter(s => s.restoreStatus === RestoreStatus.SUCCESS).length;
    const failedRestores = allSelections.filter(s => s.restoreStatus === RestoreStatus.FAILED).length;
    const successRate = totalSaved > 0 ? (successfulRestores / (successfulRestores + failedRestores)) * 100 : 0;

    // 计算各层级统计（这里需要额外的恢复记录来统计）
    const layerStats = [
      { layer: 1, name: 'ID锚点', successes: 0, attempts: 0, successRate: 0 },
      { layer: 2, name: '原始路径', successes: 0, attempts: 0, successRate: 0 },
      { layer: 3, name: '多重锚点', successes: 0, attempts: 0, successRate: 0 },
      { layer: 4, name: '结构指纹', successes: 0, attempts: 0, successRate: 0 },
      { layer: 5, name: '降级恢复', successes: 0, attempts: 0, successRate: 0 },
    ];

    return {
      totalSaved,
      successfulRestores,
      failedRestores,
      successRate: Math.round(successRate),
      layerStats,
    };
  }

  /**
   * 获取当前页面的选区统计
   */
  async getCurrentPageStats(): Promise<SelectionStats> {
    if (typeof window === 'undefined') {
      return this.getStats();
    }

    const currentUrl = window.location.href;
    const pageSelections = await this.getByUrl(currentUrl);

    const totalSaved = pageSelections.length;
    const successfulRestores = pageSelections.filter(s => s.restoreStatus === RestoreStatus.SUCCESS).length;
    const failedRestores = pageSelections.filter(s => s.restoreStatus === RestoreStatus.FAILED).length;
    const successRate = totalSaved > 0 ? (successfulRestores / (successfulRestores + failedRestores)) * 100 : 0;

    const layerStats = [
      { layer: 1, name: 'ID锚点', successes: 0, attempts: 0, successRate: 0 },
      { layer: 2, name: '原始路径', successes: 0, attempts: 0, successRate: 0 },
      { layer: 3, name: '多重锚点', successes: 0, attempts: 0, successRate: 0 },
      { layer: 4, name: '结构指纹', successes: 0, attempts: 0, successRate: 0 },
      { layer: 5, name: '降级恢复', successes: 0, attempts: 0, successRate: 0 },
    ];

    return {
      totalSaved,
      successfulRestores,
      failedRestores,
      successRate: Math.round(successRate),
      layerStats,
    };
  }

  /**
   * 清理过期数据（内存存储中无需实现）
   */
  async cleanupOldData(maxAgeInDays: number = 30): Promise<number> {
    // 内存存储不需要清理过期数据，因为页面刷新后数据就会丢失
    return 0;
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<string> {
    const allSelections = Array.from(this.data.values());
    return JSON.stringify(allSelections, null, 2);
  }

  /**
   * 导入数据
   */
  async importData(jsonData: string): Promise<number> {
    try {
      const selections: SerializedSelection[] = JSON.parse(jsonData);
      let importedCount = 0;

      for (const selection of selections) {
        this.data.set(selection.id, selection);
        importedCount++;
      }

      return importedCount;
    } catch (error) {
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  /**
   * 关闭存储连接（内存存储无需实现）
   */
  close(): void {
    // 内存存储无需关闭连接
  }
}