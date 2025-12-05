import { Storage, APIStorageHandlers, StorageFactoryConfig } from '../types';
import { APIStorage } from './api-storage';
import { MemoryStorage } from './memory-storage';

/**
 * 存储工厂类
 * 负责创建不同类型的存储实例
 *
 * 支持的存储类型：
 * - memory: 内存存储（默认，页面刷新后数据丢失）
 * - api: API存储（数据存储在服务端）
 */
export class StorageFactory {
  /**
   * 创建存储实例
   * @param config 存储配置，如果不传则默认使用内存存储
   */
  static create(config?: StorageFactoryConfig): Storage {
    if (!config) {
      // 默认使用内存存储，避免意外的持久化
      return new MemoryStorage();
    }

    switch (config.type) {
      case 'api':
        if (!config.apiHandlers) {
          throw new Error('API endpoint is required for API storage');
        }
        return new APIStorage(config.apiHandlers);
      case 'memory':
      default:
        // 默认使用内存存储
        return new MemoryStorage();
    }
  }
}
