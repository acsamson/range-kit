import { Storage, SerializedSelection, SelectionStats, APIStorageHandlers } from '../types';

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
   * 注意：使用 runtime 中的状态进行统计
   */
  private calculateStats(selections: SerializedSelection[]): SelectionStats {
    const totalSaved = selections.length;
    const successfulRestores = selections.filter(s => s.runtime?.restoreStatus === 'success').length;
    const failedRestores = selections.filter(s => s.runtime?.restoreStatus === 'failed').length;
    const successRate = totalSaved > 0 && (successfulRestores + failedRestores) > 0
      ? (successfulRestores / (successfulRestores + failedRestores)) * 100
      : 0;

    // 计算各层级统计
    const layerStats = [1, 2, 3, 4].map(layer => {
      const layerSelections = selections.filter(s => s.runtime?.successLayer === layer);
      const layerSuccesses = layerSelections.filter(s => s.runtime?.restoreStatus === 'success').length;
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
