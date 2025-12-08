/**
 * 选区序列化器包装类
 * 负责序列化和反序列化选区
 */

import { SelectionSerializer, createSerializer } from '../../locator/serializer';
import type { SerializedSelection } from '../../types';
import { logSuccess, logWarn, logInfo } from '../../common/debug';

export interface SerializerOptions {
  contextLength: number;
}

/**
 * 选区序列化器 - 负责序列化和反序列化选区
 */
export class SelectionSerializerWrapper {
  private serializer: SelectionSerializer;
  private options: SerializerOptions;

  constructor(options: SerializerOptions) {
    this.options = options;
    this.serializer = createSerializer(options.contextLength);
  }

  /**
   * 序列化当前选区
   */
  serialize(id?: string): SerializedSelection | null {
    try {
      const serialized = this.serializer.serialize(id);

      if (!serialized) {
        logWarn('serializer', '没有有效的选区可序列化');
        return null;
      }

      logSuccess('serializer', `选区已序列化: ${serialized.text.substring(0, 50)}...`, {
        id: serialized.id,
        length: serialized.text.length,
      });

      return serialized;
    } catch (error) {
      logWarn('serializer', '序列化选区时发生错误', error);
      return null;
    }
  }

  /**
   * 更新上下文长度
   */
  setContextLength(length: number): void {
    this.options.contextLength = length;
    this.serializer.setContextLength(length);
    logInfo('serializer', `上下文长度已更新为: ${length}`);
  }

  /**
   * 获取当前上下文长度
   */
  getContextLength(): number {
    return this.options.contextLength;
  }
}
