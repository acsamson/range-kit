/**
 * 日志接口和实现
 * 提供可配置的日志系统，生产环境默认静默
 */

/**
 * 日志接口
 * 应用层可以实现此接口来自定义日志行为
 */
export interface ILogger {
  /** 调试级别日志 */
  debug(message: string, ...args: unknown[]): void
  /** 信息级别日志 */
  info(message: string, ...args: unknown[]): void
  /** 警告级别日志 */
  warn(message: string, ...args: unknown[]): void
  /** 错误级别日志 */
  error(message: string, ...args: unknown[]): void
}

/**
 * 空日志实现 - 默认实现，不输出任何日志
 * 适用于生产环境，实现零噪音
 */
export const noopLogger: ILogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

/**
 * 控制台日志实现 - 开发环境使用
 * 所有日志带有 [RangeKit] 前缀便于识别
 */
export const consoleLogger: ILogger = {
  debug: (msg, ...args) => console.debug(`[RangeKit] ${msg}`, ...args),
  info: (msg, ...args) => console.info(`[RangeKit] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[RangeKit] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[RangeKit] ${msg}`, ...args),
}

/**
 * 创建带前缀的日志器
 * @param prefix - 日志前缀，如 "SelectionManager"
 * @param baseLogger - 基础日志器，默认为 consoleLogger
 */
export function createPrefixedLogger(prefix: string, baseLogger: ILogger = consoleLogger): ILogger {
  return {
    debug: (msg, ...args) => baseLogger.debug(`[${prefix}] ${msg}`, ...args),
    info: (msg, ...args) => baseLogger.info(`[${prefix}] ${msg}`, ...args),
    warn: (msg, ...args) => baseLogger.warn(`[${prefix}] ${msg}`, ...args),
    error: (msg, ...args) => baseLogger.error(`[${prefix}] ${msg}`, ...args),
  }
}

/**
 * 根据环境自动选择日志器
 * 开发环境使用控制台输出，生产环境静默
 */
export function getDefaultLogger(): ILogger {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return consoleLogger
  }
  return noopLogger
}
