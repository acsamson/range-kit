/**
 * Selection Restore 类型定义主入口
 * 从顶层 types 重新导出所有类型，保持向后兼容
 */

// 核心数据结构类型
export type {
  LayerRestoreResult,
  AnchorInfo,
  PathInfo,
  ElementAnchor,
  SiblingInfo,
  MultipleAnchorInfo,
  ParentChainItem,
  SiblingPattern,
  StructuralFingerprint,
  TextPosition,
  TextContext,
  RestoreData,
  RuntimeData,
  SelectionType,
  SerializedSelection,
  SerializedSelectionSimple,
  OverlappedRange,
  RestoreResult,
  SelectionStats,
  LayerStats,
  SimilarityCandidate,
  ContainerConfig,
  LogEntry,
  DebugLogEntry,
  ElementPathGenerator,
  TextSimilarityCalculator,
  StructuralSimilarityCalculator,
} from '../../types/core';

// 核心导出值（枚举和常量）
export {
  RestoreStatus,
  DEFAULT_SELECTION_TYPE,
  LogLevel,
} from '../../types/core';

// 配置选项类型
export type {
  HighlightStyle,
  SelectionTypeConfig,
  StorageMode,
  APIStorageHandlers,
  StorageConfig,
  StorageFactoryConfig,
  SelectionRestoreOptions,
} from '../../types/options';

// 事件相关类型
export type {
  SelectionBehaviorEvent,
  SelectionBehaviorCallback,
  SelectionInteractionEvent,
  SelectionCompleteEvent,
  SelectionChangeInfo,
  ActiveRangesChangeEvent,
  SelectionInstance,
  SelectionChangeCallback,
  SelectionInteractionCallback,
  SelectionCompleteCallback,
  ActiveRangesChangeCallback,
} from '../../types/events';

// 事件枚举
export { SelectionBehaviorType } from '../../types/events';

// 接口类型
export type {
  RestoreLayerFunction,
  Serializer,
  Restorer,
  Storage,
  Highlighter,
  EventfulHighlighter,
  HighlightEventData,
  HighlightEventListener,
} from '../../types/interfaces';

// 高亮事件枚举
export { HighlightEventType } from '../../types/interfaces';

// API 接口类型
export type { SelectionRestoreAPI } from '../../types/api';

// 重新导出 overlap-detector 类型以保持兼容性
export type { OverlapType } from '../helpers/overlap-detector';
