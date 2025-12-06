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

// SelectionManager - 用户侧唯一入口（从 selection-restore 导出）
export {
  SelectionManager,
  type SelectionManagerOptions,
} from './restore';

// SelectionRestore - 内部引擎（高级用法）
export {
  SelectionRestore,
  createSelectionRestore,
  SelectionInstanceManager,
  // 类型定义
  type SelectionRestoreAPI,
  SelectionBehaviorType,
  type SelectionRestoreOptions,
  type SerializedSelection,
  type SelectionBehaviorEvent,
  type SelectionTypeConfig,
  type SelectionInteractionEvent,
  type SelectionInstance,
  type SelectionCompleteEvent,
  type RestoreResult,
  type SelectionStats,
  type AnchorInfo,
  type PathInfo,
  type MultipleAnchorInfo,
  type TextContext,
  type SerializedSelectionSimple,
  type StructuralFingerprint as SelectionStructuralFingerprint,
  type HighlightStyle as SelectionHighlightStyle,
  type SearchMatchItem,
  type SearchMatchFilter,
  type OverlappedRange,
  // 工具函数
  convertToSimple,
  convertSelectionsToSimple,
} from './restore';

// ========== 兼容性导出（保持向后兼容） ==========

// 独立 Highlighter 模块（旧 API）
export {
  SelectionHighlighter,
  createHighlighter,
  type HighlighterOptions,
  CSSBasedHighlighter,
  isHighlightSupported,
} from './restore';

// 独立 TextSearch 模块
export {
  SelectionText,
  type TextSearchOptions,
} from './restore';
