/**
 * 选区重叠检测器
 * 负责检测多个选区之间的重叠关系
 */

import type { SelectionRestore } from './selection-restore';
import type { SerializedSelection } from '../types';
import { detectRangeOverlap, OverlapType, type OverlappedRange } from '../common/overlap-detector';

/**
 * 检测当前选区与已有选区的重叠关系
 * @param currentRange 当前选区的Range对象
 * @param selectionRestore SelectionRestore 实例
 * @returns 重叠的选区信息数组
 */
export async function detectOverlappedRanges(
  currentRange: Range,
  selectionRestore: SelectionRestore,
): Promise<OverlappedRange[]> {
  const overlappedRanges: OverlappedRange[] = [];

  // 如果选区为空，直接返回
  if (!currentRange || currentRange.collapsed) {
    return overlappedRanges;
  }

  try {
    // 获取所有已保存的选区数据
    const allSelections = await selectionRestore.getAllSelections();

    // 如果没有保存的选区，直接返回
    if (allSelections.length === 0) {
      return overlappedRanges;
    }

    // 只检查最近的10个选区，超过10个会严重影响性能
    const MAX_SELECTIONS_TO_CHECK = 10;
    const selectionsToCheck = allSelections.length > MAX_SELECTIONS_TO_CHECK
      ? allSelections.slice(-MAX_SELECTIONS_TO_CHECK)
      : allSelections;

    for (const existingSelection of selectionsToCheck) {
      try {
        // 尝试恢复每个选区以获取其Range对象
        const restoreResult = await selectionRestore.restoreRangeOnly(existingSelection);

        if (restoreResult.success && restoreResult.range) {
          const existingRange = restoreResult.range;

          // 检查重叠
          const overlapInfo = checkRangeOverlap(currentRange, existingRange);

          if (overlapInfo.hasOverlap) {
            // 获取重叠区域的文本内容
            let overlappedText = '';
            try {
              if (overlapInfo.overlapRange) {
                overlappedText = overlapInfo.overlapRange.toString();
              }
            } catch (error) {
              console.warn('获取重叠文本失败:', error);
            }

            const overlappedRange: OverlappedRange = {
              selectionId: existingSelection.id,
              text: existingSelection.text,
              overlapType: overlapInfo.overlapType,
              range: existingRange,
              overlappedText,
              selectionData: existingSelection
            };

            overlappedRanges.push(overlappedRange);
          }
        }
      } catch (error) {
        // 静默处理单个选区恢复失败，避免影响其他选区的检测
      }
    }
  } catch (error) {
    console.error('检测重叠选区时出错:', error);
  }

  return overlappedRanges;
}

/**
 * 检查两个Range是否重叠以及重叠类型
 * @param rangeA 第一个Range
 * @param rangeB 第二个Range
 * @returns 重叠检测结果
 */
export function checkRangeOverlap(rangeA: Range, rangeB: Range): {
  hasOverlap: boolean;
  overlapType: OverlapType;
  overlapRange?: Range;
} {
  try {
    // 使用统一的重叠检测逻辑
    const coreResult = detectRangeOverlap(rangeA, rangeB);

    // 如果有重叠，创建重叠区域的Range
    let overlapRange: Range | undefined;
    if (coreResult.hasOverlap) {
      try {
        overlapRange = document.createRange();

        // 根据重叠类型设置重叠区域
        if (coreResult.overlapType === OverlapType.EXISTING_CONTAINS_CURRENT) {
          // 当前选区完全包含在已有选区内，重叠区域就是当前选区
          overlapRange.setStart(rangeA.startContainer, rangeA.startOffset);
          overlapRange.setEnd(rangeA.endContainer, rangeA.endOffset);
        } else if (coreResult.overlapType === OverlapType.CURRENT_CONTAINS_EXISTING) {
          // 当前选区完全包含已有选区，重叠区域就是已有选区
          overlapRange.setStart(rangeB.startContainer, rangeB.startOffset);
          overlapRange.setEnd(rangeB.endContainer, rangeB.endOffset);
        } else {
          // 部分重叠，重叠区域是两个选区的交集
          const startComparison = rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB);
          if (startComparison >= 0) {
            overlapRange.setStart(rangeA.startContainer, rangeA.startOffset);
          } else {
            overlapRange.setStart(rangeB.startContainer, rangeB.startOffset);
          }

          const endComparison = rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB);
          if (endComparison <= 0) {
            overlapRange.setEnd(rangeA.endContainer, rangeA.endOffset);
          } else {
            overlapRange.setEnd(rangeB.endContainer, rangeB.endOffset);
          }
        }
      } catch (error) {
        console.warn('创建重叠Range失败:', error);
        overlapRange = undefined;
      }
    }

    return {
      hasOverlap: coreResult.hasOverlap,
      overlapType: coreResult.overlapType,
      overlapRange
    };

  } catch (error) {
    console.error('Range重叠检测失败:', error);
    return { hasOverlap: false, overlapType: OverlapType.NO_OVERLAP };
  }
}
