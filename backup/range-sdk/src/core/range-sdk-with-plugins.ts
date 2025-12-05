import { SelectionManager } from './selection-manager'
import { PluginManager } from './plugin-manager'
import type { RangePlugin, PluginAPI } from './plugin-manager'
import { RangeData, RangeSDKEvents, RangeSdkAppId } from '../types'
import { PerformanceMonitor, type IPerformanceMonitor } from './performance-monitor'
import { globalTeaTracker, initTea } from '../tea'
import { SDKSingletonManager } from '../utils/singleton-manager'

// RangeSDK 配置选项
export interface RangeSDKOptions {
  appid: RangeSdkAppId | number;
  // 容器元素
  container?: Element
  // 是否启用调试模式
  debug?: boolean
  // 是否启用性能监控
  enablePerformanceMonitor?: boolean
  // 是否暴露到全局window对象
  exposeToWindow?: boolean
  // 其他配置项...
}

// 插件注册辅助类型
export type WithPlugin<T extends Record<string, PluginAPI>> = T

/**
 * RangeSDK - 统一的 SDK 入口
 * 集成了选区管理、插件系统、高亮管理等功能
 */
export class RangeSDK {
  private selectionManager: SelectionManager
  private pluginManager: PluginManager
  private options: RangeSDKOptions
  private eventListeners: Map<keyof RangeSDKEvents, Set<Function>> = new Map()
  private _pluginProxies: Record<string, any> = {}
  private performanceMonitor: IPerformanceMonitor | null = null
  private activeSelections: Map<string, RangeData> = new Map() // 追踪活跃的选区
  private isDestroyed: boolean = false // 防止重复销毁

  constructor(options: RangeSDKOptions = {
    appid: RangeSdkAppId.RANGE_SDK
  }) {
    this.options = {
      enablePerformanceMonitor: true,
      exposeToWindow: true,
      ...options
    }

    // 初始化性能监控器
    if (this.options.enablePerformanceMonitor) {
      this.performanceMonitor = new PerformanceMonitor({
        enabled: true,
        enableConsoleWarnings: this.options.debug
      })
    }

    console.log('[RangeSDK] SDK初始化完成, appid:', this.options.appid)
    
    // 记录 SDK 初始化时间，供性能埋点使用
    if (typeof window !== 'undefined') {
      if (!(window as any).__rangesdk__) {
        (window as any).__rangesdk__ = {};
      }
      (window as any).__rangesdk__.initTime = Date.now();
    }

    // 初始化Tea埋点系统
    try {
      initTea()
      console.log('[RangeSDK] Tea埋点系统初始化完成')
    } catch (error) {
      console.warn('[RangeSDK] Tea埋点系统初始化失败:', error)
    }

    // 初始化选区管理器
    this.selectionManager = new SelectionManager(options.container || document.body)

    // 初始化插件管理器
    this.pluginManager = new PluginManager(
      this.selectionManager,
      this.emit.bind(this),
      {}
    )

    // 转发选区管理器的事件
    this.setupEventForwarding()

    // 暴露到全局window对象
    if (this.options.exposeToWindow) {
      this.exposeToGlobal()
    }
  }

  /**
   * 注册插件 - 支持类型推导
   */
  async registerPlugin<
    TPlugin extends RangePlugin<TAPI>,
    TAPI extends PluginAPI,
    TId extends string = TPlugin['id']
  >(plugin: TPlugin): Promise<RangeSDK & Record<TId, TAPI>> {
    if (this.options.debug) {
      console.log(`[RangeSDK] Registering plugin: ${plugin.name}`)
    }
    await this.pluginManager.register(plugin)

    // 为插件创建代理属性，支持 rangeSDK.pluginId.xxx 访问
    const api = this.pluginManager.getPluginAPI<TAPI>(plugin.id)
    if (api) {
      Object.defineProperty(this, plugin.id, {
        get: () => api,
        configurable: true
      })
      // 保存到代理列表以便 TypeScript 类型推导
      this._pluginProxies[plugin.id] = api

      // 更新全局暴露
      if (this.options.exposeToWindow && typeof window !== 'undefined' && window.__rangesdk__) {
        Object.defineProperty(window.__rangesdk__, plugin.id, {
          get: () => api,
          configurable: true
        })
      }
    }

    return this as RangeSDK & Record<TId, TAPI>
  }

  /**
   * 注销插件
   */
  unregisterPlugin(pluginId: string): void {
    if (this.options.debug) {
      console.log(`[RangeSDK] Unregistering plugin: ${pluginId}`)
    }
    this.pluginManager.unregister(pluginId)

    // 删除代理属性
    delete (this as any)[pluginId]
    delete this._pluginProxies[pluginId]
  }

  /**
   * 获取插件实例
   */
  getPlugin<T extends RangePlugin>(pluginId: string): T | undefined {
    return this.pluginManager.getPlugin(pluginId) as T
  }

  /**
   * 获取插件 API
   */
  getPluginAPI<T extends PluginAPI>(pluginId: string): T | undefined {
    return this.pluginManager.getPluginAPI<T>(pluginId)
  }

  /**
   * 获取性能监控器
   */
  get performance(): IPerformanceMonitor | null {
    return this.performanceMonitor
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
   * 上报选区展示埋点
   */
  private async trackRangeShow(rangeData: RangeData): Promise<void> {
    try {
      console.log('[RangeSDK] 开始上报选区展示埋点:', rangeData)
      
      // 确定当前激活的插件
      const activePlugin = this.getCurrentActivePlugin()
      console.log('[RangeSDK] 当前激活插件:', activePlugin)
      
      await globalTeaTracker.trackRangeShow({
        appid: this.options.appid,
        rangeData,
        pluginName: activePlugin,
        selectionCount: this.activeSelections.size,
        performanceMonitor: this.performanceMonitor || undefined
      })
    } catch (error) {
      console.error('[RangeSDK] 埋点上报失败 (range_show):', error)
    }
  }

  /**
   * 上报选区点击埋点
   */
  private async trackRangeClick(markData: any): Promise<void> {
    try {
      // 如果markData包含rangeData，使用它；否则尝试从activeSelections中找到
      let rangeData: RangeData
      if (markData.rangeData) {
        rangeData = markData.rangeData
      } else if (markData.id && this.activeSelections.has(markData.id)) {
        rangeData = this.activeSelections.get(markData.id)!
      } else {
        // 创建一个基本的rangeData
        rangeData = {
          id: markData.id || 'unknown',
          startContainerPath: '',
          startOffset: 0,
          endContainerPath: '',
          endOffset: 0,
          selectedText: markData.text || '',
          pageUrl: window.location.href,
          timestamp: Date.now()
        }
      }

      const activePlugin = this.getCurrentActivePlugin()
      
      await globalTeaTracker.trackRangeClick({
        appid: this.options.appid,
        rangeData,
        clickedSelectionId: markData.id || rangeData.id,
        pluginName: activePlugin,
        selectionCount: this.activeSelections.size,
        performanceMonitor: this.performanceMonitor || undefined,
        // 添加重叠选区信息
        additionalData: {
          overlappedTexts: markData.overlappedTexts,
          hasOverlap: !!markData.overlappedTexts && markData.overlappedTexts.length > 1,
          overlapCount: markData.overlappedTexts?.length || 1
        }
      })
    } catch (error) {
      console.error('[RangeSDK] 埋点上报失败 (range_click):', error)
    }
  }

  /**
   * 获取当前激活的插件名称
   */
  private getCurrentActivePlugin(): string | undefined {
    // 这里可以根据具体业务逻辑来确定当前激活的插件
    // 简单实现：返回最后注册的插件
    const pluginIds = Object.keys(this._pluginProxies)
    return pluginIds.length > 0 ? pluginIds[pluginIds.length - 1] : undefined
  }

  /**
   * 设置事件转发
   */
  private setupEventForwarding(): void {
    console.log('[RangeSDK] 设置事件转发...')
    
    // 转发选区管理器的事件
    this.selectionManager.on('range-selected', (rangeData) => {
      console.log('[RangeSDK] 接收到 range-selected 事件:', rangeData)
      
      // 追踪活跃选区
      this.activeSelections.set(rangeData.id, rangeData)
      
      // 上报选区展示埋点
      this.trackRangeShow(rangeData)
      
      this.emit('range-selected', rangeData)
      this.pluginManager.notifyRangeSelected(rangeData)
    })

    this.selectionManager.on('mark-clicked', (markData) => {
      console.log('[RangeSDK] 接收到 mark-clicked 事件:', markData)
      
      // 上报选区点击埋点
      this.trackRangeClick(markData)
      
      this.emit('mark-clicked', markData)
      this.pluginManager.notifyMarkClicked(markData)
    })
  }

  /**
   * 暴露到全局window对象
   */
  private exposeToGlobal(): void {
    if (typeof window === 'undefined') return

    // 确保window.__rangesdk__存在
    if (!window.__rangesdk__) {
      Object.defineProperty(window, '__rangesdk__', {
        value: this,
        writable: false,
        configurable: true
      })
    }

    // 添加插件快捷访问
    Object.keys(this._pluginProxies).forEach(pluginId => {
      Object.defineProperty(window.__rangesdk__, pluginId, {
        get: () => this._pluginProxies[pluginId],
        configurable: true
      })
    })

    // 显式暴露performance监控器
    if (this.performanceMonitor) {
      Object.defineProperty(window.__rangesdk__, 'performance', {
        get: () => this.performanceMonitor,
        configurable: true
      })
    }

    // 暴露内存诊断工具
    import('../utils/memory-diagnostic').then(({ MemoryDiagnostic, diagnoseMemory }) => {
      Object.defineProperty(window.__rangesdk__, 'MemoryDiagnostic', {
        value: MemoryDiagnostic,
        configurable: true
      })
      Object.defineProperty(window.__rangesdk__, 'diagnoseMemory', {
        value: diagnoseMemory,
        configurable: true
      })
    }).catch(error => {
      console.warn('[RangeSDK] Failed to load memory diagnostic tools:', error)
    })
    
    // 暴露单例管理器（用于调试）
    Object.defineProperty(window.__rangesdk__, 'SingletonManager', {
      value: SDKSingletonManager,
      configurable: true
    })

    // 初始化埋点数据存储（保留已有数据）
    if (!(window.__rangesdk__ as any).tea) {
      (window.__rangesdk__ as any).tea = [];
      console.log('[RangeSDK] 首次创建 tea 数组在 exposeToGlobal');
    } else {
      console.log('[RangeSDK] tea 数组已存在，当前长度:', (window.__rangesdk__ as any).tea.length);
    }

    if (this.options.debug) {
      console.log('[RangeSDK] Exposed to window.__rangesdk__', {
        instance: this,
        plugins: Object.keys(this._pluginProxies),
        performance: !!this.performanceMonitor
      })
    }
  }

  /**
   * 销毁 SDK
   */
  destroy(): void {
    // 防止重复销毁
    if (this.isDestroyed) {
      console.warn('[RangeSDK] SDK instance already destroyed')
      return
    }
    
    this.isDestroyed = true
    
    if (this.options.debug) {
      console.log('[RangeSDK] Destroying SDK instance')
    }

    try {
      // 销毁插件管理器
      if (this.pluginManager) {
        this.pluginManager.destroy()
      }

      // 销毁选区管理器
      if (this.selectionManager) {
        this.selectionManager.destroy()
      }

      // 销毁性能监控器
      if (this.performanceMonitor && typeof (this.performanceMonitor as any).destroy === 'function') {
        (this.performanceMonitor as any).destroy()
        this.performanceMonitor = null
      }

      // 清理事件监听器
      this.eventListeners.clear()

      // 清理活跃选区追踪
      this.activeSelections.clear()

      // 清理插件代理
      Object.keys(this._pluginProxies).forEach(pluginId => {
        delete (this as any)[pluginId]
        // 同时清理全局暴露
        if (typeof window !== 'undefined' && window.__rangesdk__) {
          delete (window.__rangesdk__ as any)[pluginId]
        }
      })
      this._pluginProxies = {}

      // 清理全局暴露
      if (this.options.exposeToWindow && typeof window !== 'undefined' && window.__rangesdk__ === this) {
        delete (window as any).__rangesdk__
      }
      
      // 从单例管理器中移除（不会递归调用 destroy）
      SDKSingletonManager.destroy(String(this.options.appid))
    } catch (error) {
      console.error('[RangeSDK] Error during destruction:', error)
    }
  }

  /**
   * 获取埋点数据（调试用）
   */
  getTeaEvents() {
    return globalTeaTracker.getEvents()
  }

  /**
   * 清空埋点数据（调试用）
   */
  clearTeaEvents() {
    globalTeaTracker.clearEvents()
  }

  /**
   * 获取 SDK 版本
   */
  static get version(): string {
    return '1.0.0'
  }
}

// 创建 RangeSDK 实例的工厂函数，支持链式注册插件
export function createRangeSDK(options: RangeSDKOptions = {
  appid: RangeSdkAppId.RANGE_SDK
}): RangeSDK {
  const appid = String(options.appid);
  
  // 使用单例管理器确保每个 appid 只有一个实例
  return SDKSingletonManager.getOrCreate(appid, () => {
    return new RangeSDK(options);
  });
}

// 类型辅助函数，用于更好的类型推导
export function withPlugins<T extends Record<string, PluginAPI>>(sdk: RangeSDK & T): RangeSDK & T {
  return sdk
}

// 常用类型别名
export type RangeSDKWithPlugins<T extends Record<string, PluginAPI>> = RangeSDK & T
export type RangeSDKWithDictionary<T extends PluginAPI> = RangeSDKWithPlugins<{ dictionary: T }>
export type RangeSDKWithComment<T extends PluginAPI> = RangeSDKWithPlugins<{ comment: T }>
export type RangeSDKWithHighlight<T extends PluginAPI> = RangeSDKWithPlugins<{ highlight: T }>
