import { SelectionManager } from './selection-manager'
import { PluginManager } from './plugin-manager'
import type { RangePlugin, PluginAPI } from './plugin-manager'
import type { RangeData, RangeSDKEvents } from '../types'
import { PerformanceMonitor, PerformanceMonitorConfig, IPerformanceMonitor } from './performance-monitor'
import { initTea } from '../tea'

// RangeSDK 配置选项
export interface RangeSDKOptions {
  // 容器元素
  container?: Element
  // 是否启用调试模式
  debug?: boolean
  // 性能监控配置
  performance?: PerformanceMonitorConfig | boolean
  // 其他配置项...
}

// 插件注册映射类型
export interface PluginRegistry {
  // 插件会在注册时动态添加到这里
  // 例如：dictionary: DictionaryAPI
}

/**
 * RangeSDK - 统一的 SDK 入口
 * 集成了选区管理、插件系统、高亮管理等功能
 */
export class RangeSDK {
  // 插件 API 属性会在运行时动态添加


  private selectionManager: SelectionManager
  private pluginManager: PluginManager
  private performanceMonitor?: IPerformanceMonitor
  private options: RangeSDKOptions
  private eventListeners: Map<keyof RangeSDKEvents, Set<Function>> = new Map()
  private _pluginProxies: Record<string, any> = {}

  constructor(options: RangeSDKOptions = {}) {
    this.options = options;

    initTea();

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

    // 初始化插件管理器
    this.pluginManager = new PluginManager(
      this.selectionManager,
      this.emit.bind(this),
      {},
      this.performanceMonitor
    )

    // 转发选区管理器的事件
    this.setupEventForwarding()
  }

  /**
   * 注册插件
   */
  async registerPlugin<T extends PluginAPI>(plugin: RangePlugin<T>): Promise<void> {
    if (this.options.debug) {
      console.log(`[RangeSDK] Registering plugin: ${plugin.name}`)
    }
    await this.pluginManager.register(plugin)

    // 为插件创建代理属性，支持 rangeSDK.pluginId.xxx 访问
    const api = this.pluginManager.getPluginAPI<T>(plugin.id)
    if (api) {
      Object.defineProperty(this, plugin.id, {
        get: () => api,
        configurable: true
      })
      // 保存到代理列表以便 TypeScript 类型推导
      this._pluginProxies[plugin.id] = api
    }
  }

  /**
   * 注销插件
   */
  unregisterPlugin(pluginId: string): void {
    if (this.options.debug) {
      console.log(`[RangeSDK] Unregistering plugin: ${pluginId}`)
    }
    this.pluginManager.unregister(pluginId)
  }

  /**
   * 获取插件实例
   */
  getPlugin<T extends RangePlugin>(pluginId: string): T | undefined {
    return this.pluginManager.getPlugin(pluginId) as T
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
      this.pluginManager.notifyRangeSelected(rangeData)
    })

    this.selectionManager.on('mark-clicked', (markData) => {
      this.emit('mark-clicked', markData)
      this.pluginManager.notifyMarkClicked(markData)
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

    // 销毁插件管理器
    this.pluginManager.destroy()

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
   * @deprecated 使用 new RangeSDK() 代替
   */
  static create(options?: RangeSDKOptions): RangeSDK {
    return new RangeSDK(options)
  }

  /**
   * 注册插件（向后兼容）
   * @deprecated 使用 registerPlugin 代替
   */
  async use<T extends PluginAPI>(plugin: RangePlugin<T>): Promise<void> {
    return this.registerPlugin(plugin)
  }

  /**
   * 注销插件（向后兼容）
   * @deprecated 使用 unregisterPlugin 代替
   */
  unuse(pluginId: string): void {
    return this.unregisterPlugin(pluginId)
  }
}
