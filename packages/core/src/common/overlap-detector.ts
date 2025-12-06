// 从 types/core 直接导入，避免通过 types/index.ts 的循环依赖
import type { SerializedSelection, RestoreResult, OverlappedRange } from '../types/core';
// 重新导出 OverlapType 和 OverlappedRange（定义在 types/core.ts）
export { OverlapType } from '../types/core';
export type { OverlappedRange } from '../types/core';
import { OverlapType } from '../types/core';
import { MAX_SELECTIONS_TO_CHECK } from '../constants';

/**
 * 边界比较结果接口
 * 包含Range.compareBoundaryPoints的所有比较结果
 */
export interface BoundaryComparisons {
  /** current.start vs existing.end (-1: before, 0: equal, 1: after) */
  startToEnd: number;
  /** current.end vs existing.start (-1: before, 0: equal, 1: after) */
  endToStart: number;
  /** current.start vs existing.start (-1: before, 0: equal, 1: after) */
  startToStart: number;
  /** current.end vs existing.end (-1: before, 0: equal, 1: after) */
  endToEnd: number;
}

/**
 * 核心重叠检测结果接口
 * 包含重叠状态、类型和详细的边界比较信息
 */
export interface CoreOverlapResult {
  /** 是否存在重叠 */
  hasOverlap: boolean;
  /** 重叠类型 */
  overlapType: OverlapType;
  /** 详细的边界比较结果 */
  boundaryComparisons: BoundaryComparisons;
}

/**
 * Range信息接口
 * 用于序列化Range对象的关键信息，便于调试和日志记录
 */
export interface RangeInfo {
  /** 起始容器节点名称 */
  startContainer: string;
  /** 起始偏移量 */
  startOffset: number;
  /** 结束容器节点名称 */
  endContainer: string;
  /** 结束偏移量 */
  endOffset: number;
  /** Range的文本内容 */
  toString: string;
}

/**
 * 重叠选区检测结果接口
 * 包含单个选区的完整检测信息，用于调试和分析
 */
export interface OverlapDetectionResult {
  /** 选区ID */
  selectionId: string;
  /** 选区恢复结果 */
  restoreResult: {
    success: boolean;
    hasRange: boolean;
    error?: string;
    layer?: string;
    layerName?: string;
  } | null;
  /** 重叠检查结果 */
  overlapCheck: {
    existingRangeInfo: RangeInfo;
    boundaryComparison: {
      aEndVsBStart: number;
      aStartVsBEnd: number;
    };
    hasOverlap: boolean;
  } | null;
  /** 是否存在重叠 */
  hasOverlap: boolean;
  /** 错误信息 */
  error: string | null;
}

// OverlappedRange 接口现在从 types/core.ts 导入，避免重复定义
// 请参见文件顶部的 export type { OverlappedRange } from '../types/core';

/**
 * 调试数据接口
 * 包含完整的重叠检测过程信息，用于问题排查和性能分析
 */
export interface OverlapDebugData {
  /** 当前选区信息 */
  currentSelection: {
    text: string;
    range: RangeInfo;
  };
  /** 所有已保存选区的基本信息 */
  allSavedSelections: Array<{
    id: string;
    text: string;
    type: string;
  }>;
  /** 每个选区的详细检测结果 */
  overlapDetectionResults: OverlapDetectionResult[];
  /** 最终的重叠选区摘要 */
  finalOverlappedRanges: Array<{
    selectionId: string;
    text: string;
    overlapType: OverlapType;
  }>;
}

/**
 * 将Range对象转换为RangeInfo对象
 * 用于序列化Range信息，便于调试和日志记录
 * 
 * @param range - 要转换的Range对象
 * @returns 包含Range关键信息的RangeInfo对象
 */
function rangeToInfo(range: Range): RangeInfo {
  return {
    startContainer: range.startContainer.nodeName,
    startOffset: range.startOffset,
    endContainer: range.endContainer.nodeName,
    endOffset: range.endOffset,
    toString: range.toString()
  };
}

/**
 * 核心重叠检测函数 - SOTA实现
 * 
 * 使用统一的Range.compareBoundaryPoints方法进行精确的重叠检测。
 * 这是最准确和标准的方法，适用于所有情况（同一文本节点或跨节点）。
 * 
 * 算法原理：
 * 1. 使用Range.compareBoundaryPoints进行四个关键边界比较
 * 2. 通过边界比较结果判断是否存在重叠
 * 3. 根据包含关系确定具体的重叠类型
 * 
 * 重叠判断条件：current.start < existing.end && current.end > existing.start
 * 
 * @param currentRange - 当前选区Range对象
 * @param existingRange - 已存在的选区Range对象
 * @returns 包含重叠状态、类型和详细比较信息的结果对象
 * 
 * @example
 * ```typescript
 * const current = document.createRange();
 * const existing = document.createRange();
 * const result = detectRangeOverlap(current, existing);
 * 
 * if (result.hasOverlap) {
 *   console.log(`重叠类型: ${result.overlapType}`);
 *   console.log(`边界比较:`, result.boundaryComparisons);
 * }
 * ```
 */
export function detectRangeOverlap(currentRange: Range, existingRange: Range): CoreOverlapResult {
  try {
    // 获取范围信息用于调试
    const currentInfo = rangeToInfo(currentRange);
    const existingInfo = rangeToInfo(existingRange);
    
    // 使用Range.compareBoundaryPoints进行边界比较
    // 注意：Range.compareBoundaryPoints(how, sourceRange) 的含义：
    // - START_TO_END: 比较 existingRange.start 与 currentRange.end
    // - END_TO_START: 比较 existingRange.end 与 currentRange.start
    const startToEnd = currentRange.compareBoundaryPoints(Range.START_TO_END, existingRange);
    const endToStart = currentRange.compareBoundaryPoints(Range.END_TO_START, existingRange);
    const startToStart = currentRange.compareBoundaryPoints(Range.START_TO_START, existingRange);
    const endToEnd = currentRange.compareBoundaryPoints(Range.END_TO_END, existingRange);

    const boundaryComparisons: BoundaryComparisons = {
      startToEnd,
      endToStart,
      startToStart,
      endToEnd
    };

    // 重叠条件分析：
    // startToEnd > 0 表示 existing.start < current.end
    // endToStart < 0 表示 existing.end > current.start  
    // 这两个条件同时满足时表示有重叠
    const hasOverlap = startToEnd > 0 && endToStart < 0;

    // 统一的调试对象
    const debugInfo = {
      currentRange: {
        startContainer: currentInfo.startContainer,
        startOffset: currentInfo.startOffset,
        endContainer: currentInfo.endContainer,
        endOffset: currentInfo.endOffset,
        text: currentInfo.toString
      },
      existingRange: {
        startContainer: existingInfo.startContainer,
        startOffset: existingInfo.startOffset,
        endContainer: existingInfo.endContainer,
        endOffset: existingInfo.endOffset,
        text: existingInfo.toString
      },
      // Range.compareBoundaryPoints 的详细解释
      boundaryComparisonsExplained: {
        startToEnd: {
          value: startToEnd,
          meaning: `currentRange.compareBoundaryPoints(Range.START_TO_END, existingRange)`,
          explanation: `比较 existing.start 与 current.end 的位置关系`,
          interpretation: startToEnd < 0 ? 'existing.start < current.end' : startToEnd > 0 ? 'existing.start > current.end' : 'existing.start = current.end'
        },
        endToStart: {
          value: endToStart,
          meaning: `currentRange.compareBoundaryPoints(Range.END_TO_START, existingRange)`,
          explanation: `比较 existing.end 与 current.start 的位置关系`,
          interpretation: endToStart < 0 ? 'existing.end < current.start' : endToStart > 0 ? 'existing.end > current.start' : 'existing.end = current.start'
        },
        startToStart: {
          value: startToStart,
          meaning: `currentRange.compareBoundaryPoints(Range.START_TO_START, existingRange)`,
          explanation: `比较 existing.start 与 current.start 的位置关系`,
          interpretation: startToStart < 0 ? 'existing.start < current.start' : startToStart > 0 ? 'existing.start > current.start' : 'existing.start = current.start'
        },
        endToEnd: {
          value: endToEnd,
          meaning: `currentRange.compareBoundaryPoints(Range.END_TO_END, existingRange)`,
          explanation: `比较 existing.end 与 current.end 的位置关系`,
          interpretation: endToEnd < 0 ? 'existing.end < current.end' : endToEnd > 0 ? 'existing.end > current.end' : 'existing.end = current.end'
        }
      },
      // 基于偏移量的手动计算（仅适用于同一文本节点）
      manualCalculations: {
        note: '基于 startOffset/endOffset 的手动计算（仅在同一文本节点时准确）',
        currentOffsets: `${currentInfo.startOffset}-${currentInfo.endOffset}`,
        existingOffsets: `${existingInfo.startOffset}-${existingInfo.endOffset}`,
        expectedStartToEnd: {
          calculation: `existing.start(${existingInfo.startOffset}) vs current.end(${currentInfo.endOffset})`,
          expected: existingInfo.startOffset < currentInfo.endOffset ? -1 : existingInfo.startOffset > currentInfo.endOffset ? 1 : 0,
          actual: startToEnd,
          matches: (existingInfo.startOffset < currentInfo.endOffset ? -1 : existingInfo.startOffset > currentInfo.endOffset ? 1 : 0) === startToEnd
        },
        expectedEndToStart: {
          calculation: `existing.end(${existingInfo.endOffset}) vs current.start(${currentInfo.startOffset})`,
          expected: existingInfo.endOffset < currentInfo.startOffset ? -1 : existingInfo.endOffset > currentInfo.startOffset ? 1 : 0,
          actual: endToStart,
          matches: (existingInfo.endOffset < currentInfo.startOffset ? -1 : existingInfo.endOffset > currentInfo.startOffset ? 1 : 0) === endToStart
        }
      },
      // 重叠逻辑分析
      overlapAnalysis: {
        condition: 'startToEnd > 0 && endToStart < 0',
        meaning: '(existing.start < current.end) && (existing.end > current.start)',
        startToEndCheck: {
          test: `${startToEnd} > 0`,
          result: startToEnd > 0,
          meaning: startToEnd > 0 ? 'existing.start < current.end ✓' : 'existing.start >= current.end ✗'
        },
        endToStartCheck: {
          test: `${endToStart} < 0`,
          result: endToStart < 0,
          meaning: endToStart < 0 ? 'existing.end > current.start ✓' : 'existing.end <= current.start ✗'
        },
        finalResult: hasOverlap,
        shouldOverlap: existingInfo.startOffset < currentInfo.endOffset && existingInfo.endOffset > currentInfo.startOffset,
        logicalConsistency: hasOverlap === (existingInfo.startOffset < currentInfo.endOffset && existingInfo.endOffset > currentInfo.startOffset)
      },
      // DOM 结构信息
      domStructure: {
        sameStartContainer: currentInfo.startContainer === existingInfo.startContainer,
        sameEndContainer: currentInfo.endContainer === existingInfo.endContainer,
        bothInSameTextNode: currentInfo.startContainer === currentInfo.endContainer && 
                           existingInfo.startContainer === existingInfo.endContainer &&
                           currentInfo.startContainer === existingInfo.startContainer
      }
    };

    if (!hasOverlap) {
      return {
        hasOverlap: false,
        overlapType: OverlapType.NO_OVERLAP,
        boundaryComparisons
      };
    }

    // 确定重叠类型
    let overlapType: OverlapType;
    if (startToStart >= 0 && endToEnd <= 0) {
      // current的开始不早于existing的开始，且current的结束不晚于existing的结束
      // 即：existing包含current
      overlapType = OverlapType.EXISTING_CONTAINS_CURRENT;
    } else if (startToStart <= 0 && endToEnd >= 0) {
      // current的开始不晚于existing的开始，且current的结束不早于existing的结束
      // 即：current包含existing
      overlapType = OverlapType.CURRENT_CONTAINS_EXISTING;
    } else {
      // 部分重叠
      overlapType = OverlapType.PARTIAL_OVERLAP;
    }

    return {
      hasOverlap: true,
      overlapType,
      boundaryComparisons
    };
  } catch (error) {
    // 如果比较失败（例如Range不在同一文档中），返回无重叠
    return {
      hasOverlap: false,
      overlapType: OverlapType.NO_OVERLAP,
      boundaryComparisons: {
        startToEnd: 0,
        endToStart: 0,
        startToStart: 0,
        endToEnd: 0
      }
    };
  }
}

/**
 * 检测重叠选区 - 主要入口函数
 * 
 * 检测当前选区与所有已保存选区之间的重叠关系。
 * 该函数会：
 * 1. 获取所有已保存的选区
 * 2. 逐一恢复每个选区的Range对象
 * 3. 使用核心重叠检测函数判断是否存在重叠
 * 4. 收集所有重叠的选区和详细的调试信息
 * 
 * @param currentRange - 当前选区的Range对象
 * @param currentText - 当前选区的文本内容
 * @param getAllSelections - 获取所有已保存选区的异步函数
 * @param restoreRangeOnly - 仅恢复Range对象的异步函数
 * @returns Promise，解析为包含重叠选区数组和详细调试数据的对象
 * 
 * @example
 * ```typescript
 * const currentRange = window.getSelection()?.getRangeAt(0);
 * const currentText = currentRange?.toString() || '';
 * 
 * const result = await detectOverlappingSelections(
 *   currentRange,
 *   currentText,
 *   () => getStoredSelections(),
 *   (data) => restoreSelection(data)
 * );
 * 
 * console.log(`发现 ${result.overlappedRanges.length} 个重叠选区`);
 * result.overlappedRanges.forEach(overlap => {
 *   console.log(`选区 ${overlap.selectionId}: ${overlap.overlapType}`);
 * });
 * ```
 */
export async function detectOverlappingSelections(
  currentRange: Range,
  currentText: string,
  getAllSelections: () => Promise<SerializedSelection[]>,
  restoreRangeOnly: (data: SerializedSelection) => Promise<RestoreResult>
): Promise<{
  overlappedRanges: OverlappedRange[];
  debugData: OverlapDebugData;
}> {
  const overlappedRanges: OverlappedRange[] = [];
  
  try {
    const allSelections = await getAllSelections();

    // 只检查最近的选区，而不是全部
    const selectionsToCheck = allSelections.length > MAX_SELECTIONS_TO_CHECK
      ? allSelections.slice(-MAX_SELECTIONS_TO_CHECK)
      : allSelections;
    
    // 构建完整的调试数据对象
    const debugData: OverlapDebugData = {
      currentSelection: {
        text: currentText,
        range: rangeToInfo(currentRange)
      },
      allSavedSelections: allSelections.map(sel => ({
        id: sel.id,
        text: sel.text,
        type: sel.type || ''
      })),
      overlapDetectionResults: [],
      finalOverlappedRanges: []
    };
    
    // 遍历（有限数量的）已保存选区进行重叠检测
    for (const existingSelection of selectionsToCheck) {
      const detectionResult: OverlapDetectionResult = {
        selectionId: existingSelection.id,
        restoreResult: null,
        overlapCheck: null,
        hasOverlap: false,
        error: null
      };
      
      try {
        // 尝试恢复已保存的选区
        const restoreResult = await restoreRangeOnly(existingSelection);
        detectionResult.restoreResult = {
          success: restoreResult.success,
          hasRange: !!restoreResult.range,
          error: restoreResult.error,
          layer: restoreResult.layer?.toString(),
          layerName: restoreResult.layerName
        };
        
        if (restoreResult.success && restoreResult.range) {
          const existingRange = restoreResult.range;
          
          try {
            // 使用SOTA核心重叠检测函数
            const overlapResult = detectRangeOverlap(currentRange, existingRange);
            
            // 构建调试信息
            detectionResult.overlapCheck = {
              existingRangeInfo: rangeToInfo(existingRange),
              boundaryComparison: {
                // 修复字段映射：aEndVsBStart 应该对应 endToStart，aStartVsBEnd 应该对应 startToEnd
                aEndVsBStart: overlapResult.boundaryComparisons.endToStart,
                aStartVsBEnd: overlapResult.boundaryComparisons.startToEnd
              },
              hasOverlap: overlapResult.hasOverlap
            };
            detectionResult.hasOverlap = overlapResult.hasOverlap;
            
            // 如果有重叠，添加到结果中
            if (overlapResult.hasOverlap) {
              const overlapInfo: OverlappedRange = {
                selectionId: existingSelection.id,
                text: existingSelection.text,
                overlapType: overlapResult.overlapType,
                range: existingRange,
                overlappedText: existingRange.toString(),
                selectionData: existingSelection
              };
              overlappedRanges.push(overlapInfo);
            }
          } catch (overlapError) {
            detectionResult.error = (overlapError as Error)?.message || 'Unknown overlap error';
          }
        }
      } catch (error) {
        detectionResult.error = (error as Error)?.message || 'Unknown error';
      }
      
      debugData.overlapDetectionResults.push(detectionResult);
    }
    
    // 构建最终的重叠范围调试信息
    debugData.finalOverlappedRanges = overlappedRanges.map(overlap => ({
      selectionId: overlap.selectionId,
      text: overlap.text,
      overlapType: overlap.overlapType
    }));
    
    return {
      overlappedRanges,
      debugData
    };
  } catch (error) {
    console.warn('检测重叠选区失败:', error);
    
    // 返回空结果和基本调试数据
    const debugData: OverlapDebugData = {
      currentSelection: {
        text: currentText,
        range: rangeToInfo(currentRange)
      },
      allSavedSelections: [],
      overlapDetectionResults: [],
      finalOverlappedRanges: []
    };
    
    return {
      overlappedRanges: [],
      debugData
    };
  }
}
