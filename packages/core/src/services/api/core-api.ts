/**
 * 核心 API 方法
 * 包含序列化和恢复选区的核心方法
 */

import type {
  SerializedSelection,
  RestoreResult,
  SelectionRestoreOptions,
  SelectionTypeConfig,
} from '../../types';

import type {
  SelectionValidator,
  SelectionSerializerWrapper,
  SelectionRestorer,
  SelectionHighlighter,
} from '../wrappers';
import type { SelectionSession } from '../../session';

import { logInfo, logWarn, logError } from '../../common/debug';

/**
 * 核心 API 依赖接口
 * Kit 遵循无状态设计（stateless），不包含内置存储
 */
export interface CoreAPIDependencies {
  validator: SelectionValidator;
  serializer: SelectionSerializerWrapper;
  restorer: SelectionRestorer;
  highlighter: SelectionHighlighter;
  selectionManager: SelectionSession;
  options: Required<SelectionRestoreOptions>;
  getRegisteredType: (type: string) => SelectionTypeConfig | undefined;
}

/**
 * 序列化当前选区（纯函数，不自动存储）
 *
 * Kit 遵循无状态设计，serialize() 只负责将 Range 转换为 JSON
 * 数据的持久化（存储到 LocalStorage/数据库）由应用层负责
 *
 * @example
 * // 无状态工作流
 * const json = await kit.serialize();  // 只序列化，不存储
 * await myStorage.save(json);          // 应用层决定如何存储
 * await kit.restore(json);             // 传入数据恢复
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

    // 不再自动存储，由应用层决定
    // 如果需要存储，应用层可以调用 storage API

    return serialized;
  } catch (error) {
    logError('serializer', '序列化选区时发生错误', error);
    return null;
  }
}

/**
 * 恢复选区（纯函数，不涉及存储）
 *
 * Kit 遵循无状态设计，restore() 只负责将 JSON 恢复为 Range
 * 数据需要由应用层直接传入，不再支持通过 ID 从内部存储获取
 *
 * @param data - 序列化的选区数据（必须是完整的 SerializedSelection 对象）
 * @param clearPrevious - 是否清除之前的高亮
 * @param autoScroll - 是否自动滚动到选区位置
 */
export async function restore(
  deps: CoreAPIDependencies,
  data: SerializedSelection,
  clearPrevious: boolean = true,
  autoScroll: boolean = true,
): Promise<RestoreResult> {
  try {
    const selectionData = data;

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
      // 默认类型：优先使用 data.type，否则使用 selectionStyles[0].type，最后使用 'default'
      const selectionType = selectionData.type || deps.options.selectionStyles?.[0]?.type || 'default';

      // 注册类型样式
      if (selectionType !== 'default') {
        const typeConfig = deps.getRegisteredType(selectionType);
        if (typeConfig?.style) {
          deps.highlighter.registerTypeStyle(selectionType, typeConfig.style);
        }
      }

      // 应用高亮并获取 highlightId
      const highlightId = deps.highlighter.highlightWithType(result.range, selectionType, autoScroll);

      // 在 SelectionSession 中创建选区实例（内存管理，非持久化存储）
      const instance = deps.selectionManager.addSelection(selectionData);
      (instance as { currentRange?: Range }).currentRange = result.range;
      deps.selectionManager.registerActiveRange(selectionData.id, result.range);

      // 设置 selectionHighlights 映射，用于后续删除单个高亮
      if (highlightId) {
        deps.selectionManager.selectionHighlights.set(selectionData.id, highlightId);
      }

      // 不再自动保存运行时状态到存储
      // 如果需要记录恢复状态，应用层可以自行处理
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
  data: SerializedSelection,
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
