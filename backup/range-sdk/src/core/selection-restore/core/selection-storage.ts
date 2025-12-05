import { Storage, SerializedSelection, SelectionStats, StorageConfig, StorageFactoryConfig } from '../types';
import { StorageFactory } from '../storage/storage-factory';
import { logSuccess, logError, logInfo } from '../debug/logger';

export interface StorageOptions {
  storage?: StorageConfig | StorageFactoryConfig;
}

/**
 * 选区存储管理器 - 负责选区数据的存储和检索
 *
 * 支持的存储模式：
 * - memory: 内存存储（默认，页面刷新后数据丢失）
 * - api: API存储（数据存储在服务端）
 */
export class SelectionStorage {
  private storage: Storage;
  private options: StorageOptions;

  constructor(options: StorageOptions) {
    this.options = options;
    this.storage = this.createStorage();
  }

  /**
   * 创建存储实例
   */
  private createStorage(): Storage {
    if (this.options.storage) {
      // 检查是否为新的 StorageFactoryConfig 格式
      if ('type' in this.options.storage) {
        return StorageFactory.create(this.options.storage as StorageFactoryConfig);
      }

      // 旧的 StorageConfig 格式，转换为新格式
      const oldConfig = this.options.storage as StorageConfig;
      const newConfig: StorageFactoryConfig = {
        type: oldConfig.mode === 'api' ? 'api' : 'memory',
        apiHandlers: oldConfig.apiHandlers,
      };
      return StorageFactory.create(newConfig);
    }

    // 默认使用内存存储
    return StorageFactory.create();
  }

  /**
   * 保存选区数据
   */
  async save(selection: SerializedSelection): Promise<void> {
    try {
      await this.storage.save(selection.id, selection);
      logSuccess('storage', `选区已保存: ${selection.id}`, {
        text: selection.text.substring(0, 50),
        length: selection.text.length,
      });
    } catch (error) {
      logError('storage', '保存选区时发生错误', error);
      throw error;
    }
  }

  /**
   * 获取选区数据
   */
  async get(id: string): Promise<SerializedSelection | null> {
    try {
      return await this.storage.get(id);
    } catch (error) {
      logError('storage', '获取选区时发生错误', error);
      return null;
    }
  }

  /**
   * 获取所有选区
   */
  async getAll(): Promise<SerializedSelection[]> {
    try {
      return await this.storage.getAll();
    } catch (error) {
      logError('storage', '获取所有选区时发生错误', error);
      return [];
    }
  }

  /**
   * 删除选区
   */
  async delete(id: string): Promise<void> {
    try {
      await this.storage.delete(id);
      logSuccess('storage', `选区已删除: ${id}`);
    } catch (error) {
      logError('storage', '删除选区时发生错误', error);
      throw error;
    }
  }

  /**
   * 清空所有选区
   */
  async clear(): Promise<void> {
    try {
      await this.storage.clear();
      logSuccess('storage', '所有选区已清空');
    } catch (error) {
      logError('storage', '清空选区时发生错误', error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<SelectionStats> {
    try {
      if (this.storage.getStats) {
        return await this.storage.getStats();
      }
      return {
        totalSaved: 0,
        successfulRestores: 0,
        failedRestores: 0,
        successRate: 0,
        layerStats: [],
      };
    } catch (error) {
      logError('storage', '获取统计信息时发生错误', error);
      return {
        totalSaved: 0,
        successfulRestores: 0,
        failedRestores: 0,
        successRate: 0,
        layerStats: [],
      };
    }
  }

  /**
   * 导出数据
   */
  async exportData(): Promise<string> {
    try {
      if (this.storage.exportData) {
        return await this.storage.exportData();
      }
      throw new Error('当前存储实现不支持数据导出');
    } catch (error) {
      logError('storage', '导出数据时发生错误', error);
      throw error;
    }
  }

  /**
   * 导入数据
   */
  async importData(jsonData: string): Promise<number> {
    try {
      if (this.storage.importData) {
        const importedCount = await this.storage.importData(jsonData);
        logSuccess('storage', `成功导入 ${importedCount} 条选区数据`);
        return importedCount;
      }
      throw new Error('当前存储实现不支持数据导入');
    } catch (error) {
      logError('storage', '导入数据时发生错误', error);
      throw error;
    }
  }

  /**
   * 清理过期数据（内存存储不支持，保留接口兼容性）
   */
  async cleanupOldData(maxAgeInDays: number = 30): Promise<number> {
    try {
      if (this.storage.cleanupOldData) {
        const deletedCount = await this.storage.cleanupOldData(maxAgeInDays);
        logSuccess('storage', `清理了 ${deletedCount} 条过期数据`);
        return deletedCount;
      }
      logInfo('storage', '当前存储实现不支持自动清理，跳过操作');
      return 0;
    } catch (error) {
      logError('storage', '清理过期数据时发生错误', error);
      throw error;
    }
  }

  /**
   * 关闭存储连接
   */
  async close(): Promise<void> {
    if (this.storage.close) {
      this.storage.close();
    }
  }
}
