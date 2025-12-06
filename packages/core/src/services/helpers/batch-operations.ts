/**
 * 批量操作助手
 * 处理批量高亮、批量恢复等操作
 */

import { SerializedSelection } from '../../types';
import { SelectionValidator, SelectionRestorer, SelectionHighlighter } from '../wrappers';
import { logInfo, logSuccess, logError } from '../../common/debug';

export interface BatchOperationDependencies {
  validator: SelectionValidator;
  restorer: SelectionRestorer;
  highlighter: SelectionHighlighter;
}

export interface BatchHighlightResult {
  success: number;
  total: number;
  errors: string[];
  results: Array<{
    id: string;
    success: boolean;
    layer?: number;
    layerName?: string;
    error?: string;
    range?: Range; // 新增：恢复的Range引用
  }>;
  // 新增：Range信息数组，用于事件绑定
  rangeInfos?: Array<{
    range: Range;
    selection: SerializedSelection;
    layer: number;
    layerName: string;
    highlightId: string;  // 新增：高亮ID，用于后续删除
  }>;
}

/**
 * 批量高亮选区
 */
export async function highlightSelections(
  selections: SerializedSelection[],
  scrollToIndex: number = -1,
  deps: BatchOperationDependencies,
): Promise<BatchHighlightResult> {
  const result: BatchHighlightResult = {
    success: 0,
    total: selections.length,
    errors: [],
    results: [],
    // 新增：返回恢复的Range信息供事件绑定使用
    rangeInfos: [],
  };

  try {
    if (selections.length === 0) {
      return result;
    }

    logInfo('highlight', `开始批量高亮 ${selections.length} 个选区`);

    deps.highlighter.clearHighlight();

    const rangeInfos: Array<{ range: Range; selection: SerializedSelection; layer: number; layerName: string; highlightId: string }> = [];

    for (const selection of selections) {
      try {
        const restoreResult = await deps.restorer.restoreRangeOnly(selection);

        if (restoreResult.success && restoreResult.range) {
          if (deps.validator.isRangeInValidScope(restoreResult.range)) {
            // highlightId 将在批量高亮阶段设置
            const rangeInfo = {
              range: restoreResult.range,
              selection: selection,
              layer: restoreResult.layer || 0,
              layerName: restoreResult.layerName || 'unknown',
              highlightId: ''  // 占位，后续在批量高亮时设置
            };
            rangeInfos.push(rangeInfo);
            result.success++;

            result.results.push({
              id: selection.id,
              success: true,
              layer: restoreResult.layer,
              layerName: restoreResult.layerName,
              // 新增：在结果中包含Range引用
              range: restoreResult.range.cloneRange(),
            });
          } else {
            const errorMsg = `选区不在有效范围内: ${selection.text.substring(0, 30)}...`;
            result.errors.push(errorMsg);
            result.results.push({
              id: selection.id,
              success: false,
              error: errorMsg,
            });
          }
        } else {
          const errorMsg = `恢复失败: ${selection.text.substring(0, 30)}...`;
          result.errors.push(errorMsg);
          result.results.push({
            id: selection.id,
            success: false,
            error: errorMsg,
          });
        }
      } catch (error) {
        const errorMsg = `处理选区时发生错误: ${selection.text.substring(0, 30)}... - ${error}`;
        result.errors.push(errorMsg);
        result.results.push({
          id: selection.id,
          success: false,
          error: errorMsg,
        });
      }
    }

    // 批量应用高亮，使用每个选区的类型，并记录 highlightId
    if (rangeInfos.length > 0) {
      for (const rangeInfo of rangeInfos) {
        const { range, selection } = rangeInfo;
        const selectionType = selection.type || 'default';
        const highlightId = deps.highlighter.highlightWithType(range, selectionType, false);
        // 记录 highlightId 以便后续删除单个高亮
        rangeInfo.highlightId = highlightId;
      }

      // 滚动逻辑：当 scrollToIndex >= 0 且有成功恢复的选区时进行滚动
      if (scrollToIndex >= 0 && rangeInfos.length > 0) {
        // 确保 scrollToIndex 在有效范围内，如果超出范围则滚动到第一个选区
        const targetIndex = scrollToIndex < rangeInfos.length ? scrollToIndex : 0;
        const targetRange = rangeInfos[targetIndex].range;
        deps.highlighter.getHighlighter().scrollToRange(targetRange);

        logInfo('highlight', `滚动到选区索引 ${targetIndex}，共 ${rangeInfos.length} 个选区`);
      }
    }

    // 将Range信息存储到结果中
    result.rangeInfos = rangeInfos;

    logSuccess('highlight', `批量高亮完成: ${result.success}/${result.total} 个选区成功高亮`);

  } catch (error) {
    logError('highlight', '批量高亮过程中发生错误', error);
    result.errors.push(`批量高亮失败: ${error}`);
  }

  return result;
}

/**
 * 批量高亮所有选区
 */
export async function highlightAllSelections(
  getAllSelectionsFn: () => Promise<SerializedSelection[]>,
  scrollToIndex: number = -1,
  deps: BatchOperationDependencies,
): Promise<{ success: number; total: number; errors: string[] }> {
  const allSelections = await getAllSelectionsFn();
  const result = await highlightSelections(allSelections, scrollToIndex, deps);
  return { success: result.success, total: result.total, errors: result.errors };
}

/**
 * 批量高亮所有选区但不滚动
 */
export async function highlightAllSelectionsWithoutScroll(
  getAllSelectionsFn: () => Promise<SerializedSelection[]>,
  deps: BatchOperationDependencies,
): Promise<{ success: number; total: number; errors: string[] }> {
  return highlightAllSelections(getAllSelectionsFn, -1, deps);
}

/**
 * 批量高亮所有选区并滚动到最后一个
 */
export async function highlightAllSelectionsScrollToLast(
  getAllSelectionsFn: () => Promise<SerializedSelection[]>,
  deps: BatchOperationDependencies,
): Promise<{ success: number; total: number; errors: string[] }> {
  const allSelections = await getAllSelectionsFn();
  const result = await highlightSelections(allSelections, allSelections.length - 1, deps);
  return { success: result.success, total: result.total, errors: result.errors };
}

/**
 * 批量高亮所有选区并滚动到中间位置
 */
export async function highlightAllSelectionsScrollToMiddle(
  getAllSelectionsFn: () => Promise<SerializedSelection[]>,
  deps: BatchOperationDependencies,
): Promise<{ success: number; total: number; errors: string[] }> {
  const allSelections = await getAllSelectionsFn();
  const middleIndex = Math.floor(allSelections.length / 2);
  const result = await highlightSelections(allSelections, middleIndex, deps);
  return { success: result.success, total: result.total, errors: result.errors };
}
