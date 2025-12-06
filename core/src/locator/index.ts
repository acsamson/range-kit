/**
 * Locator 模块
 *
 * 核心算法层，负责 Range <-> JSON 的转换
 * 纯计算模块，无副作用，不操作 DOM 样式
 *
 * @example
 * ```typescript
 * import { RangeLocator } from '@range-kit/core';
 *
 * const locator = new RangeLocator({ rootId: 'article-content' });
 *
 * // 序列化
 * const json = locator.serialize();
 *
 * // 恢复
 * const result = locator.restore(json);
 * ```
 */

// 主类导出
export { RangeLocator, createLocator } from './range-locator';

// 类型导出
export type {
  ILocator,
  LocatorOptions,
  SerializedRange,
  RestoreResult,
  ContainerConfig,
  RestoreData,
  AnchorInfo,
  PathInfo,
  ElementAnchor,
  MultipleAnchorInfo,
  StructuralFingerprint,
  TextContext,
  TextPosition,
  ParentChainItem,
  SiblingPattern,
} from './types';

// 策略函数导出（高级用户使用）
export {
  // 序列化
  serializeSelection,
  serializeRange,
  generateUniqueId,
  getElementPath,
  setCustomIdConfig,
  registerIdFilter,
  clearIdFilter,
  // 恢复
  restoreRange,
} from './strategies';
