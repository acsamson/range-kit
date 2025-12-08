/**
 * RangeKit 错误类定义
 * 所有错误都继承自 RangeKitError 基类
 */

/**
 * RangeKit 错误基类
 */
export class RangeKitError extends Error {
  /** 错误码 */
  readonly code: string
  /** 错误上下文信息 */
  readonly context?: Record<string, unknown>

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message)
    this.name = 'RangeKitError'
    this.code = code
    this.context = context
  }
}

/**
 * 容器未找到错误
 * 当指定的容器元素不存在时抛出
 */
export class ContainerNotFoundError extends RangeKitError {
  constructor(containerId: string) {
    super(
      `容器未找到: ${containerId}`,
      'CONTAINER_NOT_FOUND',
      { containerId }
    )
    this.name = 'ContainerNotFoundError'
  }
}

/**
 * 无效选区错误
 * 当选区无效时抛出
 */
export class InvalidRangeError extends RangeKitError {
  constructor(reason: string) {
    super(
      `无效的选区: ${reason}`,
      'INVALID_RANGE',
      { reason }
    )
    this.name = 'InvalidRangeError'
  }
}

/**
 * 选区恢复失败错误
 * 当选区恢复失败时抛出
 */
export class RestoreFailedError extends RangeKitError {
  constructor(reason: string, layer?: number) {
    super(
      `选区恢复失败: ${reason}`,
      'RESTORE_FAILED',
      { reason, layer }
    )
    this.name = 'RestoreFailedError'
  }
}

/**
 * 序列化错误
 * 当选区序列化失败时抛出
 */
export class SerializationError extends RangeKitError {
  constructor(reason: string) {
    super(
      `序列化失败: ${reason}`,
      'SERIALIZATION_ERROR',
      { reason }
    )
    this.name = 'SerializationError'
  }
}

/**
 * 操作超出容器边界错误
 * 当尝试操作容器外的元素时抛出
 */
export class OutOfContainerError extends RangeKitError {
  constructor(containerId: string, operation?: string) {
    super(
      `操作超出容器边界: ${containerId}`,
      'OUT_OF_CONTAINER',
      { containerId, operation }
    )
    this.name = 'OutOfContainerError'
  }
}

/**
 * 配置错误
 */
export class ConfigurationError extends RangeKitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details)
    this.name = 'ConfigurationError'
  }
}

/**
 * 高亮错误
 * 当高亮操作失败时抛出
 */
export class HighlightError extends RangeKitError {
  constructor(reason: string, highlightId?: string) {
    super(
      `高亮操作失败: ${reason}`,
      'HIGHLIGHT_ERROR',
      { reason, highlightId }
    )
    this.name = 'HighlightError'
  }
}
