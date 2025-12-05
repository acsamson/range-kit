/**
 * @file Range SDK 主入口文件
 * @description 导出所有公共接口和类型
 *
 * API 设计说明：
 * - SelectionManager：用户侧唯一入口，提供完整的选区管理功能
 * - SelectionRestore：内部实现引擎，高级用户可直接使用
 * - SelectionInstanceManager：内部选区实例管理器，不建议直接使用
 */

// 导出类型
export * from './types';
export { RangeSdkAppIdNameMap } from './constants';

// 导出日志相关
export {
  type ILogger,
  noopLogger,
  consoleLogger,
  createPrefixedLogger,
  getDefaultLogger,
} from './common/logger';

// 导出错误类
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

// 导出核心功能 - SelectionManager 是用户侧唯一入口
export * from './selection-manager';

// 导出 selection-restore 的类型和内部引擎（高级用法）
export {
  // 内部引擎 - 高级用户可直接使用
  SelectionRestore,
  createSelectionRestore,
  // 内部选区实例管理器 - 仅供内部使用
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
  convertSelectionsToSimple
} from './selection-restore';

// ========== 独立 Highlighter 模块 ==========
// 用户可以只使用 Highlighter 而不依赖完整的 SelectionRestore/SelectionManager
// 适用于需要独立高亮功能的场景
export {
  // 包装类 - 推荐使用
  SelectionHighlighter,
  // 工厂函数 - 支持依赖注入
  createHighlighter,
  type HighlighterOptions,
  // 底层实现 - 高级用户可直接使用
  CSSBasedHighlighter,
  isHighlightSupported,
} from './selection-restore';

// ========== 独立 TextSearch 模块 ==========
// 用户可以只使用 TextSearcher 而不依赖完整的 SelectionRestore/SelectionManager
// 适用于需要独立文本搜索功能的场景
export {
  // SelectionText - 文本搜索核心类
  SelectionText,
  type TextSearchOptions,
} from './selection-restore';
