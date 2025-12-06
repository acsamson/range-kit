/**
 * 恢复器模块主入口
 * 导出四层级联选区恢复算法和相关工具
 */

// 导出主恢复函数和结果类型
export { restoreSelection, type RestoreResult } from './restorer';

// 导出四层恢复函数
export {
  restoreByIdAnchors,
  restoreByOriginalPaths,
  restoreByMultipleAnchors,
  restoreByStructuralFingerprint,
} from './layers/index';

// 导出工具函数
export {
  calculateTextSimilarity,
  calculateStructuralSimilarity,
  findElementsByText,
  findElementsByStructure,
  findTextPositionInElement,
  createTextRange,
} from './utils';

// 导出性能统计
export {
  enableMetrics,
  disableMetrics,
  isMetricsEnabled,
  recordLayerAttempt,
  recordRestoreResult,
  getMetrics,
  resetMetrics,
  getMetricsReport,
  getLayerDistribution,
  type LayerMetrics,
  type RestoreMetrics,
  type LayerType,
} from './metrics';
