import { createApp, h, App as VueApp, ref, onMounted, Component, defineAsyncComponent } from 'vue'
import { calculateSmartPosition } from './position-calculator'
import type { WordData } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary'

// 动态引入词典卡片组件
const DictionaryCardLazy = defineAsyncComponent(() => import('./components/dictionary-card-lazy.vue'))

// 卡片状态
export enum CardState {
  IDLE = 'idle',
  LOADING = 'loading',
  SHOWING = 'showing',
  HIDDEN = 'hidden'
}

// 卡片管理器配置
export interface CardManagerConfig {
  container?: HTMLElement
  zIndex?: number
  className?: string
  customCardComponent?: Component
  customCardComponentProps?: Record<string, any>
  disableDefaultRequest?: boolean
}

// 卡片显示选项
export interface ShowCardOptions {
  target: HTMLElement
  entries: Array<{ keyword: string; entry: WordData }>
  onClose?: () => void
  onClickTag?: (tag: string) => void
  onClickLarkDoc?: (link: string) => void
  onClickWebLink?: (link: string) => void
}

// 懒加载卡片显示选项
export interface LazyLoadCardOptions {
  target: HTMLElement
  keywords: string[]
  dataLoader: (keyword: string, signal?: AbortSignal) => Promise<{ keyword: string; entry: WordData } | null>
  onClose?: () => void
  onClickTag?: (tag: string) => void
  onClickLarkDoc?: (link: string) => void
  onClickWebLink?: (link: string) => void
}

/**
 * 词典卡片管理器
 * 使用单例模式确保全局只有一个卡片实例
 * 实现请求取消、防抖、加载状态管理等功能
 */
export class CardManager {
  private static instance: CardManager | null = null
  
  // 当前状态
  private state: CardState = CardState.IDLE
  
  // Vue 应用实例
  private currentApp: VueApp | null = null
  
  // DOM 容器
  private currentContainer: HTMLElement | null = null
  
  // 配置
  private config: CardManagerConfig
  
  // 当前请求的 AbortController
  private currentAbortController: AbortController | null = null
  
  // 防抖定时器
  private debounceTimer: NodeJS.Timeout | null = null
  
  // 点击外部关闭的处理函数
  private handleClickOutside: ((event: MouseEvent) => void) | null = null
  
  // 当前显示的目标元素
  private currentTarget: HTMLElement | null = null
  
  // 加载中的显示队列
  private pendingShow: ShowCardOptions | null = null

  private constructor(config: CardManagerConfig = {}) {
    this.config = {
      container: config.container || document.body,
      zIndex: config.zIndex || 1000,
      className: config.className || 'dictionary-card-container',
      customCardComponent: config.customCardComponent,
      customCardComponentProps: config.customCardComponentProps || {}
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: CardManagerConfig): CardManager {
    if (!CardManager.instance) {
      CardManager.instance = new CardManager(config)
    } else if (config) {
      // 更新现有实例的配置
      CardManager.instance.updateConfig(config)
    }
    return CardManager.instance
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<CardManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config
    }
  }

  /**
   * 显示卡片并懒加载数据
   */
  async showWithLazyLoad(options: LazyLoadCardOptions): Promise<void> {
    // 取消之前的防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    // 取消之前的请求
    this.cancelCurrentRequest()

    // 如果点击的是同一个目标，切换显示/隐藏
    if (this.currentTarget === options.target && this.state === CardState.SHOWING) {
      this.hide()
      return
    }

    // 立即隐藏现有卡片
    this.hide()

    // 更新目标
    this.currentTarget = options.target

    // 立即显示卡片（不等待数据）
    this.doShowLazy(options)
  }

  /**
   * 执行懒加载显示逻辑
   */
  private async doShowLazy(options: LazyLoadCardOptions): Promise<void> {
    // 设置状态为加载中
    this.state = CardState.LOADING

    // 创建新的 AbortController
    this.currentAbortController = new AbortController()

    // 立即创建卡片并显示loading状态
    this.createLazyCard(options)
    
    // 设置状态为显示中
    this.state = CardState.SHOWING

    // 设置点击外部关闭
    this.setupClickOutside(options.onClose)
  }

  /**
   * 创建懒加载卡片
   */
  private createLazyCard(options: LazyLoadCardOptions): void {
    // 创建容器
    this.currentContainer = document.createElement('div')
    this.currentContainer.style.position = 'fixed'
    this.currentContainer.style.zIndex = String(this.config.zIndex)
    
    // 计算位置
    const cardWidth = 400
    const cardHeight = 300 // 预估高度
    const position = calculateSmartPosition(options.target, cardWidth, cardHeight)
    
    this.currentContainer.style.left = `${position.x}px`
    this.currentContainer.style.top = `${position.y}px`
    
    // 添加类名
    this.currentContainer.className = `${this.config.className} position-${position.position}`
    
    // 添加到 DOM
    this.config.container?.appendChild(this.currentContainer)

    // 决定使用的组件：优先使用自定义组件，否则使用默认的懒加载卡片组件
    const CardComponent = this.config.customCardComponent || DictionaryCardLazy;

    // 创建 Vue 应用
    this.currentApp = createApp({
      setup: () => {
        // 包装数据加载器，添加信号支持
        const wrappedDataLoader = async (keyword: string) => {
          const result = await options.dataLoader(keyword, this.currentAbortController?.signal)
          return result?.entry || null
        }

        // 为自定义组件和默认组件提供统一的props接口
        const componentProps = this.config.customCardComponent ? {
          // 自定义组件使用简化的props
          keywords: options.keywords,
          // 如果禁用默认请求，不传递 dataLoader
          ...(this.config.disableDefaultRequest ? {} : { dataLoader: wrappedDataLoader }),
          // ✅ 合并自定义组件属性
          ...this.config.customCardComponentProps,
          onClose: () => {
            options.onClose?.()
            this.hide()
          }
        } : {
          // 默认组件使用完整的props
          keywords: options.keywords,
          dataLoader: wrappedDataLoader,
          onClose: () => {
            options.onClose?.()
            this.hide()
          },
          onClickTag: (tag: string) => {
            options.onClickTag?.(tag)
            this.hide()
          },
          onClickLarkDoc: options.onClickLarkDoc,
          onClickWebLink: options.onClickWebLink,
          onTabChange: (index: number) => {
            console.log('Tab changed to:', index)
          }
        }

        return () => h(CardComponent, componentProps)
      }
    })

    // 挂载应用
    this.currentApp.mount(this.currentContainer)
  }

  /**
   * 显示卡片（带防抖和请求取消）
   */
  async show(options: ShowCardOptions): Promise<void> {
    // 取消之前的防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    // 取消之前的请求
    this.cancelCurrentRequest()

    // 如果点击的是同一个目标，切换显示/隐藏
    if (this.currentTarget === options.target && this.state === CardState.SHOWING) {
      this.hide()
      return
    }

    // 立即隐藏现有卡片
    this.hide()

    // 更新目标
    this.currentTarget = options.target

    // 设置防抖，避免快速点击
    this.debounceTimer = setTimeout(() => {
      this.doShow(options)
    }, 50) // 50ms 防抖延迟，更快响应
  }

  /**
   * 实际执行显示逻辑
   */
  private async doShow(options: ShowCardOptions): Promise<void> {
    // 设置状态为加载中
    this.state = CardState.LOADING

    // 创建新的 AbortController
    this.currentAbortController = new AbortController()

    try {
      // 如果没有词条数据，直接返回
      if (!options.entries || options.entries.length === 0) {
        console.warn('没有词条数据可显示')
        this.state = CardState.IDLE
        return
      }

      // 检查是否被取消
      if (this.currentAbortController.signal.aborted) {
        return
      }

      // 创建并显示卡片
      this.createCard(options)
      
      // 设置状态为显示中
      this.state = CardState.SHOWING

      // 设置点击外部关闭
      this.setupClickOutside(options.onClose)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('卡片显示被取消')
      } else {
        console.error('显示卡片失败:', error)
      }
      this.state = CardState.IDLE
    }
  }

  /**
   * 创建卡片 DOM 和 Vue 应用
   */
  private createCard(options: ShowCardOptions): void {
    // 创建容器
    this.currentContainer = document.createElement('div')
    this.currentContainer.style.position = 'fixed'
    this.currentContainer.style.zIndex = String(this.config.zIndex)
    
    // 计算位置
    const cardWidth = 400
    const cardHeight = 300 // 预估高度
    const position = calculateSmartPosition(options.target, cardWidth, cardHeight)
    
    this.currentContainer.style.left = `${position.x}px`
    this.currentContainer.style.top = `${position.y}px`
    
    // 添加类名
    this.currentContainer.className = `${this.config.className} position-${position.position}`
    
    // 添加到 DOM
    this.config.container?.appendChild(this.currentContainer)

    // 决定使用的组件：优先使用自定义组件，否则使用默认的懒加载卡片组件
    const CardComponent = this.config.customCardComponent || DictionaryCardLazy;

    // 创建 Vue 应用
    this.currentApp = createApp({
      setup: () => {
        // 使用懒加载组件，但使用预先加载好的数据
        const keywords = options.entries.map(e => e.keyword)
        const preloadedData = new Map(options.entries.map(e => [e.keyword, e.entry]))

        const preloadedDataLoader = async (keyword: string) => {
          return preloadedData.get(keyword) || null
        }

        // 为自定义组件和默认组件提供统一的props接口
        const componentProps = this.config.customCardComponent ? {
          // 自定义组件使用简化的props
          keywords,
          // 如果禁用默认请求，不传递 dataLoader
          ...(this.config.disableDefaultRequest ? {} : { dataLoader: preloadedDataLoader }),
          // ✅ 合并自定义组件属性
          ...this.config.customCardComponentProps,
          onClose: () => {
            options.onClose?.()
            this.hide()
          }
        } : {
          // 默认组件使用完整的props
          keywords,
          dataLoader: preloadedDataLoader,
          onClose: () => {
            options.onClose?.()
            this.hide()
          },
          onClickTag: (tag: string) => {
            options.onClickTag?.(tag)
            this.hide()
          },
          onClickLarkDoc: options.onClickLarkDoc,
          onClickWebLink: options.onClickWebLink,
          onTabChange: (index: number) => {
            console.log('Tab changed to:', index)
          }
        }

        return () => h(CardComponent, componentProps)
      }
    })

    // 挂载应用
    this.currentApp.mount(this.currentContainer)
  }

  /**
   * 隐藏卡片
   */
  hide(): void {
    // 取消防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    // 取消当前请求
    this.cancelCurrentRequest()

    // 卸载 Vue 应用
    if (this.currentApp) {
      this.currentApp.unmount()
      this.currentApp = null
    }

    // 移除 DOM 容器
    if (this.currentContainer) {
      this.currentContainer.remove()
      this.currentContainer = null
    }

    // 移除点击外部处理
    this.removeClickOutside()

    // 重置状态
    this.state = CardState.HIDDEN
    this.currentTarget = null
    this.pendingShow = null
  }

  /**
   * 取消当前请求
   */
  private cancelCurrentRequest(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
      this.currentAbortController = null
    }
  }

  /**
   * 设置点击外部关闭
   */
  private setupClickOutside(onClose?: () => void): void {
    // 移除旧的监听器
    this.removeClickOutside()

    // 创建新的处理函数
    this.handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // 如果点击了拖拽手柄，不关闭卡片
      if (target.closest('.dictionary-drag-handle')) {
        return
      }

      if (this.currentContainer && !this.currentContainer.contains(target as Node)) {
        // 检查是否点击了高亮元素
        if (!target.closest('.dictionary-highlight')) {
          onClose?.()
          this.hide()
        }
      }
    }

    // 延迟添加，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside!)
    }, 0)
  }

  /**
   * 移除点击外部处理
   */
  private removeClickOutside(): void {
    if (this.handleClickOutside) {
      document.removeEventListener('click', this.handleClickOutside)
      this.handleClickOutside = null
    }
  }

  /**
   * 获取当前状态
   */
  getState(): CardState {
    return this.state
  }

  /**
   * 是否正在显示
   */
  isShowing(): boolean {
    return this.state === CardState.SHOWING
  }

  /**
   * 是否正在加载
   */
  isLoading(): boolean {
    return this.state === CardState.LOADING
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.hide()
    CardManager.instance = null
  }

  /**
   * 重置单例（用于测试）
   */
  static reset(): void {
    if (CardManager.instance) {
      CardManager.instance.destroy()
      CardManager.instance = null
    }
  }
}

// 导出便捷函数
export function getCardManager(config?: CardManagerConfig): CardManager {
  return CardManager.getInstance(config)
}