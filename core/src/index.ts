/**
 * @file Range SDK 主入口文件
 * @description 导出所有公共接口和类型
 *
 * 架构设计：
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      Range Kit SDK                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │  高级 API（推荐使用）                                        │
 * │  - SelectionManager：用户侧唯一入口                         │
 * │  - SelectionRestore：内部引擎，高级用户可直接使用            │
 * ├─────────────────────────────────────────────────────────────┤
 * │  三层独立模块（可单独使用）                                   │
 * │  - RangeLocator：定位器（Range ↔ JSON）                     │
 * │  - Highlighter：高亮器（DOM 绘制）                          │
 * │  - InteractionManager：交互管理器（事件监听）                │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Common 模块                                                │
 * │  - 日志、错误处理、共享类型                                  │
 * └─────────────────────────────────────────────────────────────┘
 */

// ========== 类型导出 ==========
export * from './types';
export { RangeSdkAppIdNameMap } from './constants';

// ========== Common 模块 ==========
// 日志
export {
  type ILogger,
  noopLogger,
  consoleLogger,
  createPrefixedLogger,
  getDefaultLogger,
} from './common/logger';

// 错误
export {
  RangeKitError,
  ContainerNotFoundError,
  InvalidRangeError,
  RestoreFailedError,
  SerializationError as CommonSerializationError,
  OutOfContainerError,
  ConfigurationError,
  HighlightError,
} from './common/errors';

// 共享类型
export type {
  ConfigMode,
  ContainerConfig as CommonContainerConfig,
  Position,
  OperationResult,
  Destroyable,
} from './common';

// ========== 三层独立模块（新架构） ==========

// 1. Locator 模块 - 核心算法层（Range ↔ JSON）
// 纯计算，无副作用，不操作 DOM 样式
export {
  RangeLocator,
  createLocator,
  // 策略函数
  serializeSelection as locatorSerialize,
  serializeRange as locatorSerializeRange,
  restoreRange as locatorRestore,
  generateUniqueId,
  setCustomIdConfig,
} from './locator';

export type {
  ILocator,
  LocatorOptions,
  SerializedRange,
  RestoreResult as LocatorRestoreResult,
  RestoreData,
  AnchorInfo as LocatorAnchorInfo,
  PathInfo as LocatorPathInfo,
  StructuralFingerprint as LocatorFingerprint,
  TextContext as LocatorTextContext,
} from './locator';

// 2. Highlighter 模块 - 渲染层（DOM 高亮）
// 只接收 Range，不关心来源
export {
  Highlighter,
  createHighlighter as createNewHighlighter,
  isHighlightSupported as highlighterSupported,
  CSSPainter,
  HighlightEvent,
} from './highlighter';

export type {
  IHighlighter,
  IEventfulHighlighter,
  HighlightStyle,
  HighlightEventType,
  HighlightEventData,
  HighlightEventListener,
  HighlighterOptions as NewHighlighterOptions,
} from './highlighter';

// 3. Interaction 模块 - 事件层（交互监听）
// 监听 SelectionChange, Click, Hover 等事件
export {
  InteractionManager,
  createInteractionManager,
  InteractionEventType,
} from './interaction';

export type {
  IInteractionManager,
  InteractionManagerOptions,
  InteractionEventData,
  InteractionEventHandler,
  SelectionPosition,
} from './interaction';

// ========== 高级 API（整合模块） ==========

// SelectionManager - 用户侧唯一入口
export {
  SelectionManager,
  type SelectionManagerOptions,
  type ContainerInput,
} from './services';

// SelectionRestore - 内部引擎（高级用法）
export {
  SelectionRestore,
  createSelectionRestore,
  getDefaultInstance,
} from './services/selection-restore';

// SelectionInstanceManager - 选区实例管理
export { SelectionInstanceManager } from './manager';

// 类型定义（从 types 模块导出）
export type {
  SelectionRestoreAPI,
  SelectionRestoreOptions,
  SerializedSelection,
  SelectionBehaviorEvent,
  SelectionTypeConfig,
  SelectionInteractionEvent,
  SelectionInstance,
  SelectionCompleteEvent,
  RestoreResult,
  SelectionStats,
  AnchorInfo,
  PathInfo,
  MultipleAnchorInfo,
  TextContext,
  SerializedSelectionSimple,
  StructuralFingerprint as SelectionStructuralFingerprint,
  HighlightStyle as SelectionHighlightStyle,
} from './types';

export { SelectionBehaviorType } from './types';

// 搜索匹配类型（从 services/helpers 导出）
export type {
  SearchMatchItem,
  SearchMatchFilter,
} from './services/helpers/text-highlight-manager';

// 重叠检测（从 common 导出）
export type { OverlappedRange } from './common/overlap-detector';

// 工具函数
export { convertToSimple, convertSelectionsToSimple } from './common/convert';

// ========== 兼容性导出（保持向后兼容） ==========

// 独立 Highlighter 模块（旧 API）
export {
  SelectionHighlighter,
  createHighlighter,
  type HighlighterOptions,
} from './services/wrappers';

// CSSBasedHighlighter 别名（向后兼容）
export { CSSPainter as CSSBasedHighlighter } from './highlighter/painters';
export { isHighlightSupported } from './highlighter/painters';

// 独立 TextSearch 模块
export {
  SelectionText,
  type TextSearchOptions,
} from './services/wrappers';

// ========== 性能统计模块 ==========
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
} from './locator/restorer/metrics';
