import type { RangeData, RangeSDKEvents } from '../types'
import { SelectionManager } from './selection-manager'
import { IPerformanceMonitor, MetricType } from './performance-monitor'

// 插件 API 接口
export interface PluginAPI {
  [key: string]: any
}

// 插件接口定义
export interface RangePlugin<T extends PluginAPI = PluginAPI> {
  // 插件唯一标识
  id: string
  // 插件名称
  name: string
  // 插件版本
  version?: string
  // 插件初始化
  initialize(context: PluginContext): Promise<void> | void
  // 插件销毁
  destroy?(): void
  // 获取插件 API - 返回插件暴露的方法
  getAPI?(): T
  // 处理选区选择
  onRangeSelected?(rangeData: RangeData): void
  // 处理标记点击
  onMarkClicked?(markData: any): void
}

// 插件上下文 - 提供给插件使用的 API
export interface PluginContext {
  // 选区管理器
  selectionManager: SelectionManager
  // 事件发射器
  emit: <K extends keyof RangeSDKEvents>(event: K, ...args: Parameters<RangeSDKEvents[K]>) => void
  // 获取配置
  getConfig: () => any
  // 更新配置
  updateConfig: (config: any) => void
}

// 插件管理器
export class PluginManager {
  private plugins = new Map<string, RangePlugin<any>>()
  private pluginAPIs = new Map<string, PluginAPI>()
  private performanceMonitor?: IPerformanceMonitor
  private isDestroyed = false // 防止重复销毁
  
  constructor(
    private selectionManager: SelectionManager,
    private emitFn: <K extends keyof RangeSDKEvents>(event: K, ...args: Parameters<RangeSDKEvents[K]>) => void,
    private config: any = {},
    performanceMonitor?: IPerformanceMonitor
  ) {
    this.performanceMonitor = performanceMonitor
  }
  
  // 注册插件
  async register<T extends PluginAPI>(plugin: RangePlugin<T>): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered`)
      return
    }
    
    // 开始性能监控
    const metricId = this.performanceMonitor?.startMetric(
      MetricType.PLUGIN_INITIALIZE,
      `register_${plugin.id}`,
      { pluginId: plugin.id, pluginName: plugin.name }
    )
    
    try {
      // 创建插件上下文
      const context: PluginContext = {
        selectionManager: this.selectionManager,
        emit: this.emitFn,
        getConfig: () => this.config,
        updateConfig: (newConfig) => {
          Object.assign(this.config, newConfig)
        }
      }
      
      // 初始化插件
      await plugin.initialize(context)
      this.plugins.set(plugin.id, plugin)
      
      // 如果插件提供了 API，保存它
      if (plugin.getAPI) {
        const api = plugin.getAPI()
        this.pluginAPIs.set(plugin.id, api)
      }
      
      // 结束性能监控
      if (metricId) {
        this.performanceMonitor?.endMetric(metricId, true)
      }
      
      console.log(`Plugin ${plugin.name} (${plugin.id}) registered successfully`)
    } catch (error) {
      // 记录失败
      if (metricId) {
        this.performanceMonitor?.endMetric(metricId, false, error as Error)
      }
      throw error
    }
  }
  
  // 注销插件
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      console.warn(`Plugin ${pluginId} not found`)
      return
    }
    
    // 开始性能监控
    const metricId = this.performanceMonitor?.startMetric(
      MetricType.PLUGIN_DESTROY,
      `unregister_${pluginId}`,
      { pluginId, pluginName: plugin.name }
    )
    
    try {
      // 调用插件销毁方法
      if (plugin.destroy) {
        plugin.destroy()
      }
      
      this.plugins.delete(pluginId)
      this.pluginAPIs.delete(pluginId)
      
      // 结束性能监控
      if (metricId) {
        this.performanceMonitor?.endMetric(metricId, true)
      }
      
      console.log(`Plugin ${plugin.name} (${pluginId}) unregistered`)
    } catch (error) {
      // 记录失败
      if (metricId) {
        this.performanceMonitor?.endMetric(metricId, false, error as Error)
      }
      console.error(`Error unregistering plugin ${pluginId}:`, error)
    }
  }
  
  // 获取插件
  getPlugin<T extends RangePlugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T
  }
  
  // 获取插件 API
  getPluginAPI<T extends PluginAPI>(pluginId: string): T | undefined {
    const api = this.pluginAPIs.get(pluginId) as T
    
    // 如果启用了性能监控，包装 API 方法
    if (api && this.performanceMonitor) {
      const wrappedApi = {} as T
      
      Object.keys(api).forEach(key => {
        const value = (api as any)[key]
        if (typeof value === 'function') {
          (wrappedApi as any)[key] = (...args: any[]) => {
            const metricId = this.performanceMonitor!.startMetric(
              MetricType.PLUGIN_API_CALL,
              `${pluginId}.${key}`,
              { pluginId, method: key, argsCount: args.length }
            )
            
            try {
              const result = value.apply(api, args)
              
              // 处理异步方法
              if (result instanceof Promise) {
                return result
                  .then(res => {
                    this.performanceMonitor!.endMetric(metricId, true)
                    return res
                  })
                  .catch(err => {
                    this.performanceMonitor!.endMetric(metricId, false, err)
                    throw err
                  })
              }
              
              this.performanceMonitor!.endMetric(metricId, true)
              return result
            } catch (error) {
              this.performanceMonitor!.endMetric(metricId, false, error as Error)
              throw error
            }
          }
        } else {
          (wrappedApi as any)[key] = value
        }
      })
      
      return wrappedApi
    }
    
    return api
  }
  
  // 获取所有插件
  getAllPlugins(): RangePlugin[] {
    return Array.from(this.plugins.values())
  }
  
  // 获取所有插件 API
  getAllPluginAPIs(): Record<string, PluginAPI> {
    const apis: Record<string, PluginAPI> = {}
    this.pluginAPIs.forEach((api, id) => {
      apis[id] = api
    })
    return apis
  }
  
  // 通知所有插件处理选区选择事件
  notifyRangeSelected(rangeData: RangeData): void {
    this.plugins.forEach(plugin => {
      if (plugin.onRangeSelected) {
        const metricId = this.performanceMonitor?.startMetric(
          MetricType.PLUGIN_EVENT_HANDLE,
          `${plugin.id}_onRangeSelected`,
          { pluginId: plugin.id, event: 'onRangeSelected' }
        )
        
        try {
          plugin.onRangeSelected(rangeData)
          
          if (metricId) {
            this.performanceMonitor?.endMetric(metricId, true)
          }
        } catch (error) {
          if (metricId) {
            this.performanceMonitor?.endMetric(metricId, false, error as Error)
          }
          console.error(`Error in plugin ${plugin.id} onRangeSelected:`, error)
        }
      }
    })
  }
  
  // 通知所有插件处理标记点击事件
  notifyMarkClicked(markData: any): void {
    this.plugins.forEach(plugin => {
      if (plugin.onMarkClicked) {
        const metricId = this.performanceMonitor?.startMetric(
          MetricType.PLUGIN_EVENT_HANDLE,
          `${plugin.id}_onMarkClicked`,
          { pluginId: plugin.id, event: 'onMarkClicked' }
        )
        
        try {
          plugin.onMarkClicked(markData)
          
          if (metricId) {
            this.performanceMonitor?.endMetric(metricId, true)
          }
        } catch (error) {
          if (metricId) {
            this.performanceMonitor?.endMetric(metricId, false, error as Error)
          }
          console.error(`Error in plugin ${plugin.id} onMarkClicked:`, error)
        }
      }
    })
  }
  
  // 销毁所有插件
  destroy(): void {
    // 防止重复销毁
    if (this.isDestroyed) {
      return
    }
    this.isDestroyed = true
    
    this.plugins.forEach(plugin => {
      const metricId = this.performanceMonitor?.startMetric(
        MetricType.PLUGIN_DESTROY,
        `destroy_${plugin.id}`,
        { pluginId: plugin.id }
      )
      
      try {
        if (plugin.destroy) {
          plugin.destroy()
        }
        
        if (metricId) {
          this.performanceMonitor?.endMetric(metricId, true)
        }
      } catch (error) {
        if (metricId) {
          this.performanceMonitor?.endMetric(metricId, false, error as Error)
        }
        console.error(`Error destroying plugin ${plugin.id}:`, error)
      }
    })
    this.plugins.clear()
    this.pluginAPIs.clear()
  }
  
  // 设置性能监控器
  setPerformanceMonitor(monitor: IPerformanceMonitor): void {
    this.performanceMonitor = monitor
  }
}