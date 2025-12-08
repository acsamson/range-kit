/**
 * 调试日志管理器
 * 用于收集、存储和分发调试信息，替代console.log
 */

// 生产环境检查
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success'
}

export interface DebugLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string; // 如: 'L1', 'L2', 'serializer', 'storage' 等
  message: string;
  data?: unknown;
  duration?: number; // 操作耗时(ms)
  stackTrace?: string;
}

export interface LogSubscriber {
  (entry: DebugLogEntry): void;
}

/**
 * 空的生产环境实现
 */
const createProductionLogger = () => ({
  log: () => {},
  subscribe: () => () => {},
  getLogs: () => [],
  getLogsByCategory: () => [],
  getLogsByLevel: () => [],
  clear: () => {},
  setEnabled: () => {},
  setMaxLogs: () => {},
  setMinLevel: () => {},
  getMinLevel: () => LogLevel.ERROR,
  exportLogs: () => '[]',
});

/** 日志级别优先级 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.SUCCESS]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * 调试日志管理器单例
 */
class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private subscribers: Set<LogSubscriber> = new Set();
  private maxLogs: number = 1000;
  private enabled: boolean = true;
  private minLevel: LogLevel = LogLevel.DEBUG;

  /**
   * 记录调试信息
   */
  log(level: LogLevel, category: string, message: string, data?: unknown, duration?: number): void {
    if (!this.enabled) return;

    // 检查日志级别是否满足最小级别要求
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    const entry: DebugLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      ...(duration !== undefined && { duration }),
      ...(level === LogLevel.ERROR && { stackTrace: new Error().stack }),
    };

    // 添加到日志列表
    this.logs.push(entry);

    // 保持日志数量限制
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 通知所有订阅者
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(entry);
      } catch (error) {
        // 避免订阅者错误影响日志系统
        console.error('Debug log subscriber error:', error);
      }
    });
  }

  /**
   * 订阅日志更新
   */
  subscribe(subscriber: LogSubscriber): () => void {
    this.subscribers.add(subscriber);

    // 返回取消订阅函数
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * 获取所有日志
   */
  getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  /**
   * 根据分类筛选日志
   */
  getLogsByCategory(category: string): DebugLogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * 根据级别筛选日志
   */
  getLogsByLevel(level: LogLevel): DebugLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
    this.notifySubscribers(LogLevel.INFO, 'system', '日志已清空');
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 设置最大日志数量
   */
  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;

    // 如果当前日志超过限制，移除多余的
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
  }

  /**
   * 设置最小日志级别
   * @param level - 只输出此级别及以上的日志
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * 获取当前最小日志级别
   */
  getMinLevel(): LogLevel {
    return this.minLevel;
  }

  /**
   * 导出日志为JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 通知订阅者（内部使用）
   */
  private notifySubscribers(level: LogLevel, category: string, message: string, data?: unknown): void {
    const entry: DebugLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    this.subscribers.forEach(subscriber => {
      try {
        subscriber(entry);
      } catch (error) {
        console.error('Debug log subscriber error:', error);
      }
    });
  }
}

// 创建全局实例 - 根据环境选择实现
export const debugLogger = IS_PRODUCTION ? createProductionLogger() : new DebugLogger();

/**
 * 便捷的日志记录函数 - 生产环境中为空函数
 */
const createNoopLogger = () => () => {};

// 临时启用调试日志，用于问题排查
const FORCE_ENABLE_DEBUG = false;

export const logDebug = (IS_PRODUCTION && !FORCE_ENABLE_DEBUG) ? createNoopLogger() :
  (category: string, message: string, data?: unknown, duration?: number) =>
    debugLogger.log(LogLevel.DEBUG, category, message, data, duration);

export const logInfo = (IS_PRODUCTION && !FORCE_ENABLE_DEBUG) ? createNoopLogger() :
  (category: string, message: string, data?: unknown, duration?: number) =>
    debugLogger.log(LogLevel.INFO, category, message, data, duration);

export const logWarn = (IS_PRODUCTION && !FORCE_ENABLE_DEBUG) ? createNoopLogger() :
  (category: string, message: string, data?: unknown, duration?: number) =>
    debugLogger.log(LogLevel.WARN, category, message, data, duration);

export const logError = (IS_PRODUCTION && !FORCE_ENABLE_DEBUG) ? createNoopLogger() :
  (category: string, message: string, data?: unknown, duration?: number) =>
    debugLogger.log(LogLevel.ERROR, category, message, data, duration);

export const logSuccess = (IS_PRODUCTION && !FORCE_ENABLE_DEBUG) ? createNoopLogger() :
  (category: string, message: string, data?: unknown, duration?: number) =>
    debugLogger.log(LogLevel.SUCCESS, category, message, data, duration);

/**
 * 性能计时器 - 生产环境中为简化版本
 */
export class PerformanceTimer {
  private startTime: number;
  private category: string;
  private description: string;

  constructor(category: string, description: string) {
    this.category = category;
    this.description = description;
    this.startTime = IS_PRODUCTION ? 0 : performance.now();
    if (!IS_PRODUCTION) {
      logDebug(category, `${description} - 开始`, { startTime: this.startTime });
    }
  }

  /**
   * 结束计时并记录
   */
  end(additionalData?: Record<string, unknown>): number {
    if (IS_PRODUCTION) {
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - this.startTime;

    logInfo(this.category, `${this.description} - 完成`, {
      startTime: this.startTime,
      endTime,
      duration: `${duration.toFixed(2)}ms`,
      ...additionalData,
    }, duration);

    return duration;
  }
}

/**
 * 装饰器：自动记录方法执行时间 - 生产环境中为直通版本
 */
export function logPerformance(category: string, description?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TypeScript 装饰器标准模式需要 any
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    if (IS_PRODUCTION) {
      // 生产环境中不做任何修改，直接返回原始方法
      return descriptor;
    }

    const method = descriptor.value;
    const methodDescription = description || `${(target as { constructor: { name: string } }).constructor.name}.${propertyName}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 装饰器包装器需要接受任意参数
    descriptor.value = async function (...args: unknown[]) {
      const timer = new PerformanceTimer(category, methodDescription);

      try {
        const result = await method.apply(this, args);
        timer.end({ success: true, args: args.length });
        return result;
      } catch (error) {
        timer.end({ success: false, error: error instanceof Error ? error.message : String(error), args: args.length });
        throw error;
      }
    };

    return descriptor;
  };
}
