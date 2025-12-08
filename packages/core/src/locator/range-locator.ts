/**
 * RangeLocator - Range 定位器
 *
 * 核心算法层，负责 Range <-> JSON 的转换
 * 纯计算模块，无副作用，不操作 DOM 样式
 *
 * @example
 * ```typescript
 * import { RangeLocator } from '@range-kit/core';
 *
 * // 创建定位器
 * const locator = new RangeLocator({ rootId: 'article-content' });
 *
 * // 序列化当前选区
 * const json = locator.serialize();
 *
 * // 应用层存储
 * await myDatabase.save(json);
 *
 * // 从存储恢复
 * const result = locator.restore(json);
 * if (result.success) {
 *   console.log('恢复成功，使用层级:', result.layerName);
 * }
 * ```
 */

import type {
  ILocator,
  LocatorOptions,
  SerializedRange,
  RestoreResult,
  ContainerConfig,
} from './types';

import {
  serializeSelection,
  serializeRange,
  setCustomIdConfig,
  restoreRange,
} from './strategies';

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: LocatorOptions = {
  contextLength: 50,
};

/**
 * Range 定位器类
 *
 * 职责：Range ↔ JSON 转换
 * 特性：纯计算，无副作用，不操作 DOM 样式
 */
export class RangeLocator implements ILocator {
  private options: LocatorOptions;

  constructor(options: LocatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // 设置自定义 ID 属性
    if (this.options.customIdAttribute) {
      setCustomIdConfig(this.options.customIdAttribute);
    }
  }

  /**
   * 序列化当前选区为 JSON
   *
   * @param id - 可选的自定义 ID
   * @returns 序列化的选区数据，失败返回 null
   */
  serialize(id?: string): SerializedRange | null {
    return serializeSelection(id, this.options.contextLength);
  }

  /**
   * 序列化指定 Range 为 JSON
   *
   * @param range - 要序列化的 Range
   * @param id - 可选的自定义 ID
   * @returns 序列化的选区数据，失败返回 null
   */
  serializeRange(range: Range, id?: string): SerializedRange | null {
    return serializeRange(range, id, this.options.contextLength);
  }

  /**
   * 从序列化数据恢复 Range
   *
   * @param data - 序列化的选区数据
   * @returns 恢复结果
   */
  restore(data: SerializedRange): RestoreResult {
    const containerConfig: ContainerConfig = {
      rootNodeId: this.options.rootId,
    };

    return restoreRange(data, containerConfig);
  }

  /**
   * 设置配置
   */
  setOptions(options: Partial<LocatorOptions>): void {
    this.options = { ...this.options, ...options };

    if (options.customIdAttribute !== undefined) {
      setCustomIdConfig(options.customIdAttribute);
    }
  }

  /**
   * 获取当前配置
   */
  getOptions(): LocatorOptions {
    return { ...this.options };
  }

  /**
   * 设置根节点 ID
   */
  setRootId(rootId: string | undefined): void {
    this.options.rootId = rootId;
  }

  /**
   * 获取根节点 ID
   */
  getRootId(): string | undefined {
    return this.options.rootId;
  }

}

/**
 * 创建 RangeLocator 实例的工厂函数
 */
export function createLocator(options?: LocatorOptions): RangeLocator {
  return new RangeLocator(options);
}
