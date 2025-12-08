/**
 * 公共模块导出
 *
 * 包含日志、错误处理、共享类型等通用功能
 */

// 日志
export {
  type ILogger,
  noopLogger,
  consoleLogger,
  createPrefixedLogger,
  getDefaultLogger,
} from './logger'

// 错误
export {
  RangeKitError,
  ContainerNotFoundError,
  InvalidRangeError,
  RestoreFailedError,
  SerializationError,
  OutOfContainerError,
  ConfigurationError,
  HighlightError,
} from './errors'

// 类型
export type {
  ConfigMode,
  ContainerConfig,
  Position,
  OperationResult,
  Destroyable,
} from './types'

// 调试日志系统
export {
  LogLevel,
  debugLogger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logSuccess,
  PerformanceTimer,
  logPerformance,
  type DebugLogEntry,
  type LogSubscriber,
} from './debug'

// ============================================
// 重叠检测算法
// ============================================
// 注意：虽然重叠检测涉及业务概念（选区），但这里只导出纯算法函数和基础类型。
// - detectRangeOverlap: 核心算法，仅依赖 DOM Range API
// - detectOverlappingSelections: 业务封装，依赖 SerializedSelection
//
// OverlappedRange 类型定义在 types/core.ts，通过 types/index.ts 统一导出。
// 这样做是为了：
// 1. 保持 common 模块的纯粹性（算法+工具）
// 2. 避免类型定义分散在多处
// ============================================
export {
  OverlapType,
  detectRangeOverlap,
  detectOverlappingSelections,
  type BoundaryComparisons,
  type CoreOverlapResult,
  type RangeInfo,
  type OverlapDetectionResult,
  type OverlapDebugData,
} from './overlap-detector'

// OverlappedRange 从 types/core.ts 重新导出（避免重复定义）
export type { OverlappedRange } from '../types/core'

// Range 工具函数
export {
  isPointInRange,
  getRangeCenter,
  getRangePosition,
} from './range-utils'
