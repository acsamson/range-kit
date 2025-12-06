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

// 重叠检测
export {
  OverlapType,
  detectRangeOverlap,
  detectOverlappingSelections,
  type BoundaryComparisons,
  type CoreOverlapResult,
  type RangeInfo,
  type OverlapDetectionResult,
  type OverlappedRange,
  type OverlapDebugData,
} from './overlap-detector'
