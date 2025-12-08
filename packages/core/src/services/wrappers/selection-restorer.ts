/**
 * 选区恢复器包装类
 * 负责恢复选区到DOM中
 */

import { restoreSelection } from '../../locator/restorer';
import type { SerializedSelection, RestoreResult } from '../../types';
import { logSuccess, logError, logInfo } from '../../common/debug';

export interface RestorerOptions {
  rootNodeId?: string | undefined;
}

/**
 * 选区恢复器 - 负责恢复选区到DOM中
 */
export class SelectionRestorer {
  private options: RestorerOptions;

  constructor(options: RestorerOptions) {
    this.options = options;
  }

  /**
   * 恢复选区
   */
  async restore(
    data: SerializedSelection,
  ): Promise<RestoreResult> {
    try {
      const containerConfig = {
        rootNodeId: this.options.rootNodeId,
      };

      const result = restoreSelection(data, containerConfig);

      if (result.success) {
        logSuccess('restorer', '选区恢复成功', {
          layer: result.layer,
          layerName: result.layerName,
          text: result.range?.toString().substring(0, 50) + '...',
        });
      } else {
        logError('restorer', '选区恢复失败', result);
      }

      return result;
    } catch (error) {
      logError('restorer', '恢复选区时发生错误', error);
      return {
        success: false,
        layer: 0,
        layerName: '恢复失败',
        error: error instanceof Error ? error.message : '未知错误',
        restoreTime: 0,
      };
    }
  }

  /**
   * 纯恢复方法：只恢复Range，不进行高亮
   */
  async restoreRangeOnly(data: SerializedSelection): Promise<RestoreResult> {
    try {
      const containerConfig = {
        rootNodeId: this.options.rootNodeId,
      };

      const result = restoreSelection(data, containerConfig);

      if (result.success) {
        logInfo('restorer', '纯Range恢复成功', {
          layer: result.layer,
          layerName: result.layerName,
        });
      }

      return result;
    } catch (error) {
      logError('restorer', '纯恢复选区时发生错误', error);
      return {
        success: false,
        layer: 0,
        layerName: '恢复失败',
        error: error instanceof Error ? error.message : '未知错误',
        restoreTime: 0,
      };
    }
  }

  /**
   * 更新恢复选项
   */
  updateOptions(options: Partial<RestorerOptions>): void {
    this.options = { ...this.options, ...options };
    logInfo('restorer', '恢复选项已更新', this.options);
  }
}
