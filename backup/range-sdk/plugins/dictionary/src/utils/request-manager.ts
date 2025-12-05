/**
 * 请求管理器
 * 提供请求取消、超时、重试等功能
 */

export interface RequestOptions {
  timeout?: number // 超时时间（毫秒）
  retries?: number // 重试次数
  retryDelay?: number // 重试延迟（毫秒）
  signal?: AbortSignal // 外部传入的取消信号
}

export class RequestManager {
  private activeRequests: Map<string, AbortController> = new Map()

  /**
   * 执行带取消和超时的请求
   */
  async execute<T>(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const { 
      timeout = 5000, 
      retries = 0, 
      retryDelay = 1000,
      signal: externalSignal 
    } = options

    // 取消同 key 的旧请求
    this.cancel(key)

    // 创建新的 AbortController
    const controller = new AbortController()
    this.activeRequests.set(key, controller)

    // 合并外部信号
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort())
    }

    // 设置超时
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    try {
      // 执行请求
      const result = await this.executeWithRetry(
        () => fetcher(controller.signal),
        retries,
        retryDelay,
        controller.signal
      )

      clearTimeout(timeoutId)
      this.activeRequests.delete(key)
      return result

    } catch (error) {
      clearTimeout(timeoutId)
      this.activeRequests.delete(key)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求被取消')
        }
        if (controller.signal.aborted && !externalSignal?.aborted) {
          throw new Error('请求超时')
        }
      }
      throw error
    }
  }

  /**
   * 带重试的执行
   */
  private async executeWithRetry<T>(
    fetcher: () => Promise<T>,
    retries: number,
    retryDelay: number,
    signal: AbortSignal
  ): Promise<T> {
    let lastError: Error | undefined

    for (let i = 0; i <= retries; i++) {
      if (signal.aborted) {
        throw new Error('请求被取消')
      }

      try {
        return await fetcher()
      } catch (error) {
        lastError = error as Error
        
        // 如果是最后一次尝试，直接抛出错误
        if (i === retries) {
          throw lastError
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    throw lastError || new Error('请求失败')
  }

  /**
   * 取消请求
   */
  cancel(key: string): void {
    const controller = this.activeRequests.get(key)
    if (controller) {
      controller.abort()
      this.activeRequests.delete(key)
    }
  }

  /**
   * 取消所有请求
   */
  cancelAll(): void {
    this.activeRequests.forEach(controller => controller.abort())
    this.activeRequests.clear()
  }

  /**
   * 检查请求是否正在进行
   */
  isActive(key: string): boolean {
    return this.activeRequests.has(key)
  }

  /**
   * 获取活动请求数量
   */
  getActiveCount(): number {
    return this.activeRequests.size
  }
}

// 创建全局实例
export const requestManager = new RequestManager()

/**
 * 创建带超时的 Promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  errorMessage = '操作超时'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeout)
    )
  ])
}

/**
 * 批量请求管理器
 * 用于并发控制和批量处理
 */
export class BatchRequestManager {
  private concurrency: number

  constructor(concurrency = 3) {
    this.concurrency = concurrency
  }

  /**
   * 批量执行请求，控制并发数
   */
  async executeBatch<T, R>(
    items: T[],
    processor: (item: T, signal: AbortSignal) => Promise<R>,
    signal?: AbortSignal
  ): Promise<R[]> {
    const results: R[] = []
    const queue = [...items]
    const inProgress = new Set<Promise<void>>()

    while (queue.length > 0 || inProgress.size > 0) {
      // 检查是否被取消
      if (signal?.aborted) {
        throw new Error('批量请求被取消')
      }

      // 填充到并发限制
      while (inProgress.size < this.concurrency && queue.length > 0) {
        const item = queue.shift()!
        const index = items.indexOf(item)

        const promise = processor(item, signal || new AbortController().signal)
          .then(result => {
            results[index] = result
          })
          .catch(error => {
            console.error(`批量请求项失败:`, error)
            results[index] = null as any
          })
          .finally(() => {
            inProgress.delete(promise)
          })

        inProgress.add(promise)
      }

      // 等待至少一个完成
      if (inProgress.size > 0) {
        await Promise.race(inProgress)
      }
    }

    return results
  }
}