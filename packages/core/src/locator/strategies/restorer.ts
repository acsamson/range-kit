/**
 * 恢复策略
 *
 * 负责将序列化的 JSON 数据恢复为 Range
 * 采用四层级联恢复算法
 */

import type { SerializedRange, RestoreResult, ContainerConfig } from '../types';
import type { SerializedSelection } from '../../types';

// 从 locator/restorer 导入恢复层实现
import {
  restoreByIdAnchors,
  restoreByOriginalPaths,
  restoreByMultipleAnchors,
  restoreByStructuralFingerprint,
} from '../restorer';

import {
  recordLayerAttempt,
  recordRestoreResult,
} from '../restorer/metrics';

/**
 * 四层级联恢复算法
 *
 * L1: ID 锚点恢复（最精确，适用于有 ID 的元素）
 * L2: DOM 路径恢复（结构稳定时的可靠选择）
 * L3: 多锚点恢复（跨元素选区的专业处理）
 * L4: 结构指纹恢复（容忍适度结构变化的智能匹配）
 */
export function restoreRange(
  data: SerializedRange,
  containerConfig?: ContainerConfig,
): RestoreResult {
  const startTime = performance.now();

  // 转换数据格式以兼容现有恢复层
  // SerializedRange 和 SerializedSelection 结构兼容，只是来源不同
  const selectionData: SerializedSelection = {
    id: data.id,
    text: data.text,
    type: data.type || 'default',
    restore: data.restore,
  };

  const config = containerConfig ? {
    rootNodeId: containerConfig.rootNodeId,
  } : undefined;

  // L1: ID 锚点恢复
  let l1Time = 0;
  try {
    const l1Start = performance.now();
    const l1Result = restoreByIdAnchors(selectionData, config);
    l1Time = performance.now() - l1Start;
    recordLayerAttempt('L1', l1Result.success, l1Time);

    if (l1Result.success && l1Result.range) {
      const restoreTime = performance.now() - startTime;
      recordRestoreResult(true, restoreTime, 'L1');
      return {
        success: true,
        layer: 1,
        layerName: 'ID锚点恢复',
        restoreTime,
        range: l1Result.range,
      };
    }
  } catch {
    recordLayerAttempt('L1', false, l1Time);
  }

  // L2: DOM 路径恢复
  let l2Time = 0;
  try {
    const l2Start = performance.now();
    const l2Result = restoreByOriginalPaths(selectionData, config);
    l2Time = performance.now() - l2Start;
    recordLayerAttempt('L2', l2Result.success, l2Time);

    if (l2Result.success && l2Result.range) {
      const restoreTime = performance.now() - startTime;
      recordRestoreResult(true, restoreTime, 'L2');
      return {
        success: true,
        layer: 2,
        layerName: 'DOM路径恢复',
        restoreTime,
        range: l2Result.range,
      };
    }
  } catch {
    recordLayerAttempt('L2', false, l2Time);
  }

  // L3: 多锚点恢复
  let l3Time = 0;
  try {
    const l3Start = performance.now();
    const l3Result = restoreByMultipleAnchors(selectionData, config);
    l3Time = performance.now() - l3Start;
    recordLayerAttempt('L3', l3Result.success, l3Time);

    if (l3Result.success && l3Result.range) {
      const restoreTime = performance.now() - startTime;
      recordRestoreResult(true, restoreTime, 'L3');
      return {
        success: true,
        layer: 3,
        layerName: '多锚点恢复',
        restoreTime,
        range: l3Result.range,
      };
    }
  } catch {
    recordLayerAttempt('L3', false, l3Time);
  }

  // L4: 结构指纹恢复
  let l4Time = 0;
  try {
    const l4Start = performance.now();
    const l4Result = restoreByStructuralFingerprint(selectionData, config);
    l4Time = performance.now() - l4Start;
    recordLayerAttempt('L4', l4Result.success, l4Time);

    if (l4Result.success && l4Result.range) {
      const restoreTime = performance.now() - startTime;
      recordRestoreResult(true, restoreTime, 'L4');
      return {
        success: true,
        layer: 4,
        layerName: '结构指纹恢复',
        restoreTime,
        range: l4Result.range,
      };
    }
  } catch {
    recordLayerAttempt('L4', false, l4Time);
  }

  // 所有层级都失败
  const restoreTime = performance.now() - startTime;
  recordRestoreResult(false, restoreTime);

  return {
    success: false,
    layer: 0,
    layerName: '恢复失败',
    restoreTime,
    error: '内容已变化，无法精确定位原始选区。请重新选择文本进行评论。',
  };
}
