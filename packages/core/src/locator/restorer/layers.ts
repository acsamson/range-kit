// 导出工具函数
export {
  calculateTextSimilarity,
  calculateStructuralSimilarity,
  findElementsByText,
  findElementsByStructure,
  findTextPositionInElement,
  createTextRange,
} from './utils';

// 导出四层级联恢复函数（已移除L5）
export {
  restoreByIdAnchors,
  restoreByOriginalPaths,
  restoreByMultipleAnchors,
  restoreByStructuralFingerprint,
} from './layers/index';
