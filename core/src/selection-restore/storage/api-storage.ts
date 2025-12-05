import { Storage, SerializedSelection, SelectionStats, RestoreStatus, APIStorageHandlers } from '../types';

/**
 * API存储实现
 * 通过用户提供的回调函数与服务端进行数据交互
 */
export class APIStorage implements Storage {
  private handlers: APIStorageHandlers;

  constructor(handlers: APIStorageHandlers) {
    this.handlers = handlers;
  }

  /**
   * 保存选区数据
   */
  async save(key: string, data: SerializedSelection): Promise<void> {
    if (!this.handlers.save) {
      throw new Error('API存储：未提供save处理器');
    }
    return this.handlers.save(key, data);
  }

  /**
   * 获取选区数据
   */
  async get(key: string): Promise<SerializedSelection | null> {
    if (!this.handlers.get) {
      throw new Error('API存储：未提供get处理器');
    }
    return this.handlers.get(key);
  }

  /**
   * 获取所有选区数据
   */
  async getAll(): Promise<SerializedSelection[]> {
    if (!this.handlers.getAll) {
      throw new Error('API存储：未提供getAll处理器');
    }
    return this.handlers.getAll();
  }

  /**
   * 删除选区数据
   */
  async delete(key: string): Promise<void> {
    if (!this.handlers.delete) {
      throw new Error('API存储：未提供delete处理器');
    }
    return this.handlers.delete(key);
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    if (!this.handlers.clear) {
      throw new Error('API存储：未提供clear处理器');
    }
    return this.handlers.clear();
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<SelectionStats> {
    if (!this.handlers.getStats) {
      // 提供默认实现：通过getAll计算统计信息
      const selections = await this.getAll();
      return this.calculateStats(selections);
    }
    return this.handlers.getStats();
  }

  /**
   * 更新恢复状态
   */
  async updateRestoreStatus(key: string, status: RestoreStatus): Promise<void> {
    if (!this.handlers.updateRestoreStatus) {
      // 默认实现：获取数据并重新保存
      const data = await this.get(key);
      if (data) {
        data.restoreStatus = status;
        data.lastUpdated = Date.now();
        await this.save(key, data);
      }
      return;
    }
    return this.handlers.updateRestoreStatus(key, status);
  }

  /**
   * 根据URL获取选区
   */
  async getByUrl(url: string): Promise<SerializedSelection[]> {
    if (!this.handlers.getByUrl) {
      // 默认实现：获取所有数据并过滤
      const allSelections = await this.getAll();
      return allSelections.filter(selection => selection.appUrl === url);
    }
    return this.handlers.getByUrl(url);
  }

  /**
   * 根据内容哈希获取选区
   */
  async getByContentHash(contentHash: string): Promise<SerializedSelection[]> {
    if (!this.handlers.getByContentHash) {
      // 默认实现：获取所有数据并过滤
      const allSelections = await this.getAll();
      return allSelections.filter(selection => selection.contentHash === contentHash);
    }
    return this.handlers.getByContentHash(contentHash);
  }

  /**
   * 获取当前页面统计
   */
  async getCurrentPageStats(): Promise<SelectionStats> {
    if (!this.handlers.getCurrentPageStats) {
      // 默认实现：根据当前URL获取选区并计算统计
      const currentUrl = window.location.href;
      const selections = await this.getByUrl(currentUrl);
      return this.calculateStats(selections);
    }
    return this.handlers.getCurrentPageStats();
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData(maxAgeInDays: number = 30): Promise<number> {
    if (!this.handlers.cleanupOldData) {
      // 默认实现：获取所有数据，删除过期的数据
      const allSelections = await this.getAll();
      const cutoffTime = Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const selection of allSelections) {
        if (selection.timestamp && selection.timestamp < cutoffTime) {
          await this.delete(selection.id);
          deletedCount++;
        }
      }

      return deletedCount;
    }
    return this.handlers.cleanupOldData(maxAgeInDays);
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<string> {
    if (!this.handlers.exportData) {
      // 默认实现：获取所有数据并转换为JSON
      const allSelections = await this.getAll();
      return JSON.stringify({
        version: '1.0',
        exportTime: new Date().toISOString(),
        selections: allSelections,
      }, null, 2);
    }
    return this.handlers.exportData();
  }

  /**
   * 导入数据
   */
  async importData(jsonData: string): Promise<number> {
    if (!this.handlers.importData) {
      // 默认实现：解析JSON并保存数据
      try {
        const data = JSON.parse(jsonData);
        const selections = data.selections || [];
        let importedCount = 0;

        for (const selection of selections) {
          if (selection.id) {
            await this.save(selection.id, selection);
            importedCount++;
          }
        }

        return importedCount;
      } catch (error) {
        throw new Error(`导入数据失败: ${error}`);
      }
    }
    return this.handlers.importData(jsonData);
  }

  /**
   * 计算统计信息的辅助方法
   */
  private calculateStats(selections: SerializedSelection[]): SelectionStats {
    const totalSaved = selections.length;
    const successfulRestores = selections.filter(s => s.restoreStatus === RestoreStatus.SUCCESS).length;
    const failedRestores = selections.filter(s => s.restoreStatus === RestoreStatus.FAILED).length;
    const successRate = totalSaved > 0 ? (successfulRestores / totalSaved) * 100 : 0;

    // 计算各层级统计
    const layerStats = [1, 2, 3, 4].map(layer => {
      const layerSelections = selections.filter(s => s.successLayer === layer);
      const layerSuccesses = layerSelections.filter(s => s.restoreStatus === RestoreStatus.SUCCESS).length;
      const layerAttempts = layerSelections.length;
      const layerSuccessRate = layerAttempts > 0 ? (layerSuccesses / layerAttempts) * 100 : 0;

      return {
        layer,
        name: `L${layer}`,
        successes: layerSuccesses,
        attempts: layerAttempts,
        successRate: layerSuccessRate,
      };
    });

    return {
      totalSaved,
      successfulRestores,
      failedRestores,
      successRate,
      layerStats,
    };
  }
}
