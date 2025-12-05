/**
 * 核心 API 方法
 * 包含序列化和恢复选区的核心方法
 */

import type {
  SerializedSelection,
  RestoreResult,
  SelectionRestoreOptions,
} from '../types';

import type { SelectionValidator } from '../core/selection-validator';
import type { SelectionSerializerWrapper } from '../core/selection-serializer';
import type { SelectionRestorer } from '../core/selection-restorer';
import type { SelectionStorage } from '../core/selection-storage';
import type { SelectionHighlighter } from '../core/selection-highlighter';
import type { SelectionManager } from '../manager/selection-manager';

import {
  logInfo,
  logWarn,
  logError,
} from '../debug/logger';

/**
 * 核心 API 依赖接口
 */
export interface CoreAPIDependencies {
  validator: SelectionValidator;
  serializer: SelectionSerializerWrapper;
  restorer: SelectionRestorer;
  storage: SelectionStorage;
  highlighter: SelectionHighlighter;
  selectionManager: SelectionManager;
  options: Required<SelectionRestoreOptions>;
  getRegisteredType: (type: string) => any;
}

/**
 * 序列化当前选区并保存
 */
export async function serialize(
  deps: CoreAPIDependencies,
  id?: string,
): Promise<SerializedSelection | null> {
  try {
    const selection = window.getSelection();

    if (!deps.validator.isSelectionInValidRange(selection)) {
      logInfo('serializer', '选区不在有效范围内，跳过序列化');
      return null;
    }

    const serialized = deps.serializer.serialize(id);
    if (!serialized) {
      return null;
    }

    await deps.storage.save(serialized);

    return serialized;
  } catch (error) {
    logError('serializer', '序列化选区时发生错误', error);
    return null;
  }
}

/**
 * 恢复选区
 */
export async function restore(
  deps: CoreAPIDependencies,
  data: SerializedSelection | string,
  clearPrevious: boolean = true,
  autoScroll: boolean = true,
): Promise<RestoreResult> {
  try {
    let selectionData: SerializedSelection;

    if (typeof data === 'string') {
      const stored = await deps.storage.get(data);
      if (!stored) {
        return {
          success: false,
          layer: 0,
          layerName: '数据不存在',
          error: `找不到ID为 ${data} 的选区数据`,
          restoreTime: 0,
        };
      }
      selectionData = stored;
    } else {
      selectionData = data;
    }

    if (clearPrevious) {
      deps.highlighter.clearHighlight();
    }

    const result = await deps.restorer.restore(selectionData);

    // 验证恢复的Range是否在有效范围内
    if (result.success && result.range) {
      if (!deps.validator.isRangeInValidScope(result.range)) {
        logWarn('restorer', '恢复的选区不在有效范围内，跳过应用');
        return {
          success: false,
          layer: 0,
          layerName: '验证失败',
          error: '恢复的选区不在有效容器范围内',
          restoreTime: 0,
        };
      }
    }

    if (result.success && result.range) {
      // 获取选区类型
      const selectionType = selectionData.type || deps.options.defaultSelectionType || 'default';

      // 注册类型样式
      if (selectionType !== 'default') {
        const typeConfig = deps.getRegisteredType(selectionType);
        if (typeConfig?.style) {
          deps.highlighter.registerTypeStyle(selectionType, typeConfig.style);
        }
      }

      // 应用高亮并获取 highlightId
      const highlightId = deps.highlighter.highlightWithType(result.range, selectionType, autoScroll);

      // 在SelectionManager中创建选区实例
      const instance = deps.selectionManager.addSelection(selectionData);
      (instance as { currentRange?: Range }).currentRange = result.range;
      deps.selectionManager.registerActiveRange(selectionData.id, result.range);

      // 设置 selectionHighlights 映射，用于后续删除单个高亮
      if (highlightId) {
        deps.selectionManager.selectionHighlights.set(selectionData.id, highlightId);
      }

      // 更新成功层级信息
      const updatedSelection: SerializedSelection = {
        ...selectionData,
        successLayer: result.layer,
        successLayerName: result.layerName,
      };
      await deps.storage.save(updatedSelection);
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
 * 恢复选区但不清除之前的高亮
 */
export async function restoreWithoutClear(
  deps: CoreAPIDependencies,
  data: SerializedSelection | string,
  autoScroll: boolean = true,
): Promise<RestoreResult> {
  return restore(deps, data, false, autoScroll);
}

/**
 * 纯恢复方法：只恢复选区并返回Range
 */
export async function restoreRangeOnly(
  deps: CoreAPIDependencies,
  data: SerializedSelection,
): Promise<RestoreResult> {
  return await deps.restorer.restoreRangeOnly(data);
}
