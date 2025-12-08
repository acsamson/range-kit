/**
 * @file Range Kit 主入口文件
 * @description 导出所有公共接口和类型
 *
 * 架构设计：
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      Range Kit                              │
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

// ============================================
// 用户侧 API（推荐使用）
// ============================================

/**
 * SelectionManager - 用户侧唯一入口
 *
 * 这是大多数用户应该使用的 API，提供：
 * - 选区恢复和高亮
 * - 事件监听（range-selected, mark-clicked 等）
 * - 重叠检测
 *
 * @example
 * ```typescript
 * const manager = new SelectionManager('container-id');
 * manager.on('range-selected', (data) => console.log(data));
 * ```
 */
export {
  SelectionManager,
  type SelectionManagerOptions,
  type ContainerInput,
} from './services';

// ============================================
// 高级 API（需要了解内部机制）
// ============================================

/**
 * SelectionRestore - 内部协调引擎
 *
 * 适用于需要更细粒度控制的高级用户。
 * 大多数场景下，使用 SelectionManager 即可。
 */
export {
  SelectionRestore,
  createSelectionRestore,
  getDefaultInstance,
} from './services/selection-restore';

// ============================================
// 内部 API（可能会变更，不建议直接使用）
// @internal
// ============================================

/**
 * SelectionSession - 内部选区会话管理器
 *
 * @internal 此类为内部实现，API 可能会变更。
 * 如需使用其功能，请通过 SelectionManager 或 SelectionRestore。
 */
export { SelectionSession } from './session';


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

// Range 工具函数
export { isPointInRange, getRangeCenter, getRangePosition } from './common/range-utils';

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
