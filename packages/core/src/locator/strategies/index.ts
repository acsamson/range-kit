/**
 * 定位策略导出
 */

// 序列化策略
export {
  generateUniqueId,
  getElementPath,
  getTextOffset,
  registerIdFilter,
  clearIdFilter,
  setCustomIdConfig,
  extractAnchorInfo,
  extractPathInfo,
  extractElementAnchor,
  extractMultipleAnchorInfo,
  extractParentChain,
  extractSiblingPattern,
  extractStructuralFingerprint,
  extractTextContext,
  serializeRange,
  serializeSelection,
} from './serializer';

// 恢复策略
export { restoreRange } from './restorer';
