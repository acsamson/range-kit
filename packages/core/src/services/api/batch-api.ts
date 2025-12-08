/**
 * 批量操作 API 方法
 * 包含批量高亮选区的方法
 */

import type {
  SerializedSelection,
  SelectionRestoreOptions,
  SelectionTypeConfig,
} from '../../types';

import type { SelectionValidator, SelectionRestorer, SelectionHighlighter } from '../wrappers';
import type { SelectionSession } from '../../session';

import { logInfo, logWarn } from '../../common/debug';

import {
  highlightSelections as highlightSelectionsHelper,
  highlightAllSelections as highlightAllSelectionsHelper,
  highlightAllSelectionsWithoutScroll as highlightAllSelectionsWithoutScrollHelper,
  highlightAllSelectionsScrollToLast as highlightAllSelectionsScrollToLastHelper,
  highlightAllSelectionsScrollToMiddle as highlightAllSelectionsScrollToMiddleHelper,
  type BatchHighlightResult,
} from '../helpers/batch-operations';

/**
 * 批量操作 API 依赖接口
 */
export interface BatchAPIDependencies {
  validator: SelectionValidator;
  restorer: SelectionRestorer;
  highlighter: SelectionHighlighter;
  selectionManager: SelectionSession;
  options: Required<SelectionRestoreOptions>;
  getRegisteredType: (type: string) => SelectionTypeConfig | undefined;
  getAllSelections: () => Promise<SerializedSelection[]>;
}

/**
 * 批量高亮选区
 */
export async function highlightSelections(
  deps: BatchAPIDependencies,
  selections: SerializedSelection[],
  scrollToIndex: number = -1,
): Promise<BatchHighlightResult> {
  // 在高亮之前，先确保所有用到的类型样式都已注册
  const usedTypes = new Set<string>();
  for (const selection of selections) {
    const selectionType = selection.type || 'default';
    usedTypes.add(selectionType);
  }

  // 注册所有用到的类型样式
  for (const type of usedTypes) {
    if (type !== 'default') {
      const typeConfig = deps.getRegisteredType(type);
      if (typeConfig?.style) {
        deps.highlighter.registerTypeStyle(type, typeConfig.style);
      }
    }
  }

  deps.selectionManager.clearAllActiveRanges();

  const result = await highlightSelectionsHelper(selections, scrollToIndex, {
    validator: deps.validator,
    restorer: deps.restorer,
    highlighter: deps.highlighter,
  });

  // 注册成功恢复的选区到Selection Manager以支持事件交互
  if (result.rangeInfos) {
    for (const rangeInfo of result.rangeInfos) {
      const { selection, range, highlightId } = rangeInfo;

      // 添加选区实例
      deps.selectionManager.addSelection(selection);

      // 直接使用已恢复的Range注册事件支持
      deps.selectionManager.registerActiveRange(selection.id, range);

      // 设置 selectionHighlights 映射，用于后续删除单个高亮
      if (highlightId) {
        deps.selectionManager.selectionHighlights.set(selection.id, highlightId);
      }

      logInfo('batch-highlight', `选区事件支持已启用: ${selection.id}`, {
        layer: rangeInfo.layer,
        layerName: rangeInfo.layerName,
        highlightId
      });
    }
  } else {
    // 降级方案：如果没有rangeInfos，使用原来的逻辑
    logWarn('batch-highlight', '未获取到Range信息，使用降级方案');
    for (const resultItem of result.results) {
      if (resultItem.success) {
        const selection = selections.find(s => s.id === resultItem.id);
        if (selection) {
          // 添加选区实例
          deps.selectionManager.addSelection(selection);

          // 如果结果中包含Range，直接使用
          if (resultItem.range) {
            deps.selectionManager.registerActiveRange(selection.id, resultItem.range);
            logInfo('batch-highlight', `选区事件支持已启用(降级): ${selection.id}`);
          } else {
            // 最后的降级方案：重新恢复Range
            try {
              const restoreResult = await deps.restorer.restoreRangeOnly(selection);
              if (restoreResult.success && restoreResult.range) {
                deps.selectionManager.registerActiveRange(selection.id, restoreResult.range);
                logWarn('batch-highlight', `选区事件支持已启用(重新恢复): ${selection.id}`);
              }
            } catch (error) {
              logWarn('batch-highlight', `选区事件注册失败: ${selection.id}`, error);
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * 批量高亮所有已保存的选区
 */
export async function highlightAllSelections(
  deps: BatchAPIDependencies,
  scrollToIndex: number = -1,
): Promise<{ success: number; total: number; errors: string[] }> {
  return await highlightAllSelectionsHelper(
    deps.getAllSelections,
    scrollToIndex,
    {
      validator: deps.validator,
      restorer: deps.restorer,
      highlighter: deps.highlighter,
    },
  );
}

/**
 * 批量高亮所有选区但不滚动
 */
export async function highlightAllSelectionsWithoutScroll(
  deps: BatchAPIDependencies,
): Promise<{ success: number; total: number; errors: string[] }> {
  return await highlightAllSelectionsWithoutScrollHelper(
    deps.getAllSelections,
    {
      validator: deps.validator,
      restorer: deps.restorer,
      highlighter: deps.highlighter,
    },
  );
}

/**
 * 批量高亮所有选区并滚动到最后一个
 */
export async function highlightAllSelectionsScrollToLast(
  deps: BatchAPIDependencies,
): Promise<{ success: number; total: number; errors: string[] }> {
  return await highlightAllSelectionsScrollToLastHelper(
    deps.getAllSelections,
    {
      validator: deps.validator,
      restorer: deps.restorer,
      highlighter: deps.highlighter,
    },
  );
}

/**
 * 批量高亮所有选区并滚动到中间位置
 */
export async function highlightAllSelectionsScrollToMiddle(
  deps: BatchAPIDependencies,
): Promise<{ success: number; total: number; errors: string[] }> {
  return await highlightAllSelectionsScrollToMiddleHelper(
    deps.getAllSelections,
    {
      validator: deps.validator,
      restorer: deps.restorer,
      highlighter: deps.highlighter,
    },
  );
}
