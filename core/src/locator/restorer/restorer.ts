/**
 * ===================================================================
 * 四层级联选区恢复器 (专为选区评论功能优化)
 * ===================================================================
 *
 * 🎯 设计理念：
 * 为选区评论功能量身定制的四层级联恢复策略，专注精确匹配而非宽松恢复。
 * 每一层都执行严格的文本验证，确保评论永远不会错位。
 *
 * 📋 层级职责：
 * L1: ID锚点恢复 - 最精确，适用于有ID的元素
 * L2: DOM路径恢复 - 结构稳定时的可靠选择
 * L3: 多锚点恢复 - 跨元素选区的专业处理
 * L4: 结构指纹恢复 - 容忍适度结构变化的智能匹配

 * ✅ 失败策略：
 * 当所有层级都失败时，明确告知用户"内容已变化，请重新选择"
 * ===================================================================
 */

import { SerializedSelection, ContainerConfig } from '../../types';
import { logDebug, logWarn, logError } from '../../common/debug';
import {
  restoreByIdAnchors,
  restoreByOriginalPaths,
  restoreByMultipleAnchors,
  restoreByStructuralFingerprint,
} from './layers';
import {
  recordLayerAttempt,
  recordRestoreResult,
  isMetricsEnabled,
  type LayerType,
} from './metrics';

export interface RestoreResult {
  success: boolean;
  layer: number;
  layerName: string;
  restoreTime: number;
  range?: Range;
  error?: string;
}

/**
 * 四层级联选区恢复主函数
 */
export function restoreSelection(data: SerializedSelection, containerConfig?: ContainerConfig): RestoreResult {
  const startTime = performance.now();

  logDebug('restorer', '🚀 开始四层级联选区恢复', {
    selectionId: data.id,
    textPreview: data.text.substring(0, 50) + '...',
    textLength: data.text.length,
    hasContainerConfig: !!containerConfig,
  });

  // L1: ID锚点恢复（最精确）
  let l1Time = 0;
  try {
    const l1Start = performance.now();
    logDebug('restorer', '📍 尝试L1: ID锚点恢复');
    const l1Result = restoreByIdAnchors(data, containerConfig);
    l1Time = performance.now() - l1Start;
    recordLayerAttempt('L1', l1Result.success, l1Time);
    if (l1Result.success) {
      const restoreTime = performance.now() - startTime;
      logDebug('restorer', '✅ L1恢复成功');
      recordRestoreResult(true, restoreTime, 'L1');
      return {
        success: true,
        layer: 1,
        layerName: 'ID锚点恢复',
        restoreTime,
        range: l1Result.range,
      };
    }
  } catch (error) {
    logError('restorer', 'L1恢复异常', error);
    recordLayerAttempt('L1', false, l1Time);
  }

  // L2: DOM路径恢复（结构稳定）
  let l2Time = 0;
  try {
    const l2Start = performance.now();
    logDebug('restorer', '🛣️ 尝试L2: DOM路径恢复');
    const l2Result = restoreByOriginalPaths(data, containerConfig);
    l2Time = performance.now() - l2Start;
    recordLayerAttempt('L2', l2Result.success, l2Time);
    if (l2Result.success) {
      const restoreTime = performance.now() - startTime;
      logDebug('restorer', '✅ L2恢复成功');
      recordRestoreResult(true, restoreTime, 'L2');
      return {
        success: true,
        layer: 2,
        layerName: 'DOM路径恢复',
        restoreTime,
        range: l2Result.range,
      };
    }
  } catch (error) {
    logError('restorer', 'L2恢复异常', error);
    recordLayerAttempt('L2', false, l2Time);
  }

  // L3: 多锚点恢复（跨元素专业）
  let l3Time = 0;
  try {
    const l3Start = performance.now();
    logDebug('restorer', '⚓ 尝试L3: 多锚点恢复');
    const l3Result = restoreByMultipleAnchors(data, containerConfig);
    l3Time = performance.now() - l3Start;
    recordLayerAttempt('L3', l3Result.success, l3Time);
    if (l3Result.success) {
      const restoreTime = performance.now() - startTime;
      logDebug('restorer', '✅ L3恢复成功');
      recordRestoreResult(true, restoreTime, 'L3');
      return {
        success: true,
        layer: 3,
        layerName: '多锚点恢复',
        restoreTime,
        range: l3Result.range,
      };
    }
  } catch (error) {
    logError('restorer', 'L3恢复异常', error);
    recordLayerAttempt('L3', false, l3Time);
  }

  // L4: 结构指纹恢复（智能匹配）
  let l4Time = 0;
  try {
    const l4Start = performance.now();
    logDebug('restorer', '🔍 尝试L4: 结构指纹恢复');
    const l4Result = restoreByStructuralFingerprint(data, containerConfig);
    l4Time = performance.now() - l4Start;
    recordLayerAttempt('L4', l4Result.success, l4Time);
    if (l4Result.success) {
      const restoreTime = performance.now() - startTime;
      logDebug('restorer', '✅ L4恢复成功');
      recordRestoreResult(true, restoreTime, 'L4');
      return {
        success: true,
        layer: 4,
        layerName: '结构指纹恢复',
        restoreTime,
        range: l4Result.range,
      };
    }
  } catch (error) {
    logError('restorer', 'L4恢复异常', error);
    recordLayerAttempt('L4', false, l4Time);
  }

  // 所有层级都失败
  const restoreTime = performance.now() - startTime;
  recordRestoreResult(false, restoreTime);
  logWarn('restorer', '❌ 四层级联恢复全部失败', {
    reason: '内容可能发生了较大变化，建议用户重新选择',
    recommendation: '提示用户"内容已变化，请重新选择文本进行评论"',
  });

  return {
    success: false,
    layer: 0,
    layerName: '恢复失败',
    restoreTime,
    error: '内容已变化，无法精确定位原始选区。请重新选择文本进行评论。',
  };
}
