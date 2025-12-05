import { SelectionManager } from './selection-manager'
import type { RangeData, RangeSDKEvents } from './types'
import { PerformanceMonitor, PerformanceMonitorConfig, IPerformanceMonitor } from './performance-monitor'

// RangeSDK 配置选项
export interface RangeSDKOptions {
  // 容器元素
  container?: Element
  // 是否启用调试模式
  debug?: boolean
  // 性能监控配置
  performance?: PerformanceMonitorConfig | boolean
}

/**
 * RangeSDK - 统一的 SDK 入口
 * 集成了选区管理、高亮管理等功能
 */
export class RangeSDK {
  private selectionManager: SelectionManager
  private performanceMonitor?: IPerformanceMonitor
  private options: RangeSDKOptions
  private eventListeners: Map<keyof RangeSDKEvents, Set<Function>> = new Map()

  constructor(options: RangeSDKOptions = {}) {
    this.options = options;

    // 初始化性能监控器
    if (options.performance !== false) {
      const performanceConfig = typeof options.performance === 'boolean'
        ? {}
        : options.performance || {}

      this.performanceMonitor = new PerformanceMonitor({
        ...performanceConfig,
        warningCallback: (warning) => {
          if (this.options.debug) {
            console.warn('[RangeSDK Performance Warning]', warning)
          }
        }
      })
    }

    // 初始化选区管理器
    this.selectionManager = new SelectionManager(
      options.container || document.body,
      this.performanceMonitor
    )

    // 设置事件转发
    this.setupEventForwarding()
  }

  /**
   * 获取当前选区数据
   */
  async getCurrentSelection(): Promise<RangeData | null> {
    return this.selectionManager.getCurrentRangeData()
  }

  /**
   * 清除当前选区
   */
  clearSelection(): void {
    this.selectionManager.clearSelection()
  }

  /**
   * 恢复选区
   */
  async restoreSelection(rangeData: RangeData): Promise<Range | null> {
    return this.selectionManager.restoreSelection(rangeData)
  }

  /**
   * 高亮选区
   */
  async highlightRange(rangeData: RangeData, duration?: number): Promise<string | null> {
    return this.selectionManager.highlightRange(rangeData, duration)
  }

  /**
   * 清除所有高亮
   */
  clearAllHighlights(): void {
    this.selectionManager.clearAllHighlights()
  }

  /**
   * 监听事件
   */
  on<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  private emit<K extends keyof RangeSDKEvents>(event: K, ...args: Parameters<RangeSDKEvents[K]>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args)
        } catch (error) {
          console.error(`[RangeSDK] Error in ${event} listener:`, error)
        }
      })
    }
  }

  /**
   * 设置事件转发
   */
  private setupEventForwarding(): void {
    // 转发选区管理器的事件
    this.selectionManager.on('range-selected', (rangeData) => {
      this.emit('range-selected', rangeData)
    })

    this.selectionManager.on('mark-clicked', (markData) => {
      this.emit('mark-clicked', markData)
    })
  }

  /**
   * 获取性能监控器
   */
  getPerformanceMonitor(): IPerformanceMonitor | undefined {
    return this.performanceMonitor
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(startTime?: number, endTime?: number): any {
    if (!this.performanceMonitor) {
      console.warn('[RangeSDK] Performance monitoring is not enabled')
      return null
    }
    return this.performanceMonitor.getReport(startTime, endTime)
  }

  /**
   * 清除性能指标
   */
  clearPerformanceMetrics(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.clearMetrics()
    }
  }

  /**
   * 销毁 SDK
   */
  destroy(): void {
    if (this.options.debug) {
      console.log('[RangeSDK] Destroying SDK instance')
    }

    // 输出最终性能报告
    if (this.performanceMonitor && this.options.debug) {
      const report = this.performanceMonitor.getReport()
      console.log('[RangeSDK] Final Performance Report:', report)
    }

    // 销毁选区管理器
    this.selectionManager.destroy()

    // 销毁性能监控器
    if (this.performanceMonitor && 'destroy' in this.performanceMonitor) {
      (this.performanceMonitor as PerformanceMonitor).destroy()
    }

    // 清理事件监听器
    this.eventListeners.clear()
  }

  /**
   * 获取 SDK 版本
   */
  static get version(): string {
    return '1.0.0'
  }

  /**
   * 创建 SDK 实例的静态方法
   */
  static create(options?: RangeSDKOptions): RangeSDK {
    return new RangeSDK(options)
  }
}

/**
 * 创建 RangeSDK 实例
 */
export function createRangeSDK(options?: RangeSDKOptions): RangeSDK {
  return new RangeSDK(options)
}
