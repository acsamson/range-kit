/**
 * 公共模块导出
 * 包含日志、错误处理等通用功能
 */

export {
  type ILogger,
  noopLogger,
  consoleLogger,
  createPrefixedLogger,
  getDefaultLogger,
} from './logger'

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
