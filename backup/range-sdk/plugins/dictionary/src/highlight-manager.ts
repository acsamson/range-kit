import { HighlightStyle, HighlightResult, TriggerMode } from './types'
import { SelectionManager } from '@ad-audit/range-sdk'
import type { SelectionInteractionEvent, SelectionInstance, SerializedSelection } from '@ad-audit/range-sdk'

// 扩展 SerializedSelection 以包含 overlappedTexts
interface ExtendedSerializedSelection extends SerializedSelection {
  overlappedTexts?: string[];
}

/**
 * 高亮管理器 - 使用 Range SDK 的 highlightTextInContainers 功能
 */
export class HighlightManager {
  private container: HTMLElement
  private clickHandler: ((target: HTMLElement, selection: {
    text: string;
    overlappedTexts?: string[];
  }) => void) | null = null
  private selectionManager: SelectionManager | null = null
  private highlightedWords: Set<string> = new Set()
  private containerSelector: string
  private globalInteractionHandler: ((event: SelectionInteractionEvent, instance: SelectionInstance) => void) | null = null
  private triggerMode: TriggerMode = 'hover' // 默认触发方式
  private caseSensitive: boolean = false // 是否区分大小写

  constructor(container: HTMLElement = document.body, selectionManager?: SelectionManager, initialStyle?: Partial<HighlightStyle>, triggerMode: TriggerMode = 'hover', caseSensitive: boolean = false) {
    this.container = container
    this.containerSelector = this.getContainerSelector()
    this.triggerMode = triggerMode
    this.caseSensitive = caseSensitive
    // 使用传入的 SelectionManager 或创建新的（向后兼容）
    this.selectionManager = selectionManager || new SelectionManager(container)
    
    // 如果传入了外部的 SelectionManager，保存其全局处理器的引用
    if (selectionManager) {
      // 保存对全局处理器的引用（如果需要的话）
      this.globalInteractionHandler = null; // 暂时设为 null，因为我们无法直接访问它
    }
    
    // 如果提供了初始样式，注册到 SDK
    if (initialStyle && Object.keys(initialStyle).length > 0) {
      this.setStyle(initialStyle)
    }
  }
  
  /**
   * 根据选区信息创建定位元素
   */
  private createPositionElementFromSelection(selection: ExtendedSerializedSelection, mouseEvent: MouseEvent): HTMLElement {
    const tempElement = document.createElement('div')
    tempElement.style.position = 'fixed'
    
    // 优先使用选区的边界信息
    if (selection.metadata?.selectionBounds) {
      const bounds = selection.metadata.selectionBounds
      tempElement.style.left = `${bounds.left}px`
      tempElement.style.top = `${bounds.top}px`
      tempElement.style.width = `${bounds.width}px`
      tempElement.style.height = `${bounds.height}px`
    } else {
      // 降级到鼠标位置
      tempElement.style.left = `${mouseEvent.clientX}px`
      tempElement.style.top = `${mouseEvent.clientY}px`
      tempElement.style.width = '20px'
      tempElement.style.height = '20px'
    }
    
    tempElement.style.pointerEvents = 'none'
    tempElement.style.zIndex = '-1'
    tempElement.className = 'dictionary-temp-position'
    
    // 添加到 body
    document.body.appendChild(tempElement)
    
    // 设置自动清理
    setTimeout(() => {
      if (document.body.contains(tempElement)) {
        document.body.removeChild(tempElement)
      }
    }, 5000) // 5秒后自动清理
    
    return tempElement
  }
  
  
  /**
   * 获取容器选择器
   */
  private getContainerSelector(): string {
    // 优先使用 ID
    if (this.container.id) {
      return `#${this.container.id}`
    }
    
    // 使用 class
    if (this.container.className) {
      const classes = this.container.className.split(' ').filter(Boolean)
      if (classes.length > 0) {
        return `.${classes.join('.')}`
      }
    }
    
    // 使用标签名
    return this.container.tagName.toLowerCase()
  }
  
  /**
   * 设置高亮样式
   */
  setStyle(style: Partial<HighlightStyle>): void {
    // 直接通过 SDK 的 registerSelectionType 更新样式
    if (!this.selectionManager) return;
    const sdk = this.selectionManager.getSelectionRestoreInstance()
    sdk.registerSelectionType({
      type: 'dictionary',
      label: '词典',
      style: style,
      icon: '📖'
    })
  }
  
  /**
   * 设置点击处理器
   */
  setClickHandler(handler: (target: HTMLElement, selection: {
    text: string;
    overlappedTexts?: string[];
  }) => void): void {
    this.clickHandler = handler
  }

  /**
   * 设置触发模式
   */
  setTriggerMode(mode: TriggerMode): void {
    this.triggerMode = mode
  }

  /**
   * 设置是否区分大小写
   */
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive
  }

  /**
   * 获取当前触发模式
   */
  getTriggerMode(): TriggerMode {
    return this.triggerMode
  }
  
  /**
   * 创建交互事件处理器
   */
  private createInteractionHandler() {
    return (event: SelectionInteractionEvent, _instance: SelectionInstance) => {
      const { type, originalEvent } = event
      // 将 selection 类型转换为扩展类型
      const selection = event.selection as ExtendedSerializedSelection

      // 根据配置的触发模式决定是否处理事件
      const shouldHandle = (this.triggerMode === 'hover' && type === 'hover') ||
                          (this.triggerMode === 'click' && type === 'click')

      if (!shouldHandle) {
        return
      }

      switch (type) {
        case 'hover':
          // 处理悬停事件 - 当 triggerMode 为 'hover' 时
          if (this.clickHandler) {
            const tempElement = this.createPositionElementFromSelection(selection, originalEvent as MouseEvent)
            console.log('🚀 词典悬停事件 - 完整 selection 信息:', {
              text: selection.text,
              overlappedTexts: selection.overlappedTexts
            })

            this.clickHandler(tempElement, {
              text: selection.text,
              overlappedTexts: selection.overlappedTexts
            })
          }
          break;

        case 'click':
          // 处理点击事件 - 当 triggerMode 为 'click' 时
          if (this.clickHandler) {
            // 使用选区的位置信息创建定位元素
            const tempElement = this.createPositionElementFromSelection(selection, originalEvent as MouseEvent)
            console.log('🚀 词典点击事件 - 完整 selection 信息:', {
              text: selection.text,
              overlappedTexts: selection.overlappedTexts,
              hasOverlap: !!selection.overlappedTexts && selection.overlappedTexts.length > 1,
              overlapCount: selection.overlappedTexts?.length || 1
            });
            this.clickHandler(tempElement, {
              text: selection.text,
              overlappedTexts: selection.overlappedTexts
            })
          }
          break;
          
        case 'contextmenu':
          // 可以添加右键菜单功能
          originalEvent.preventDefault()
          console.log('右键点击词典词条:', selection.text)
          break;
      }
    }
  }
  
  
  /**
   * 高亮单个文本
   */
  async highlightText(text: string, container?: HTMLElement): Promise<HighlightResult> {
    const targetContainers = container ? [this.getContainerSelector()] : [this.containerSelector]
    
    try {
      if (!this.selectionManager) {
        return {
          success: 0,
          total: 0,
          errors: ['SelectionManager not initialized']
        }
      }
      const result = await this.selectionManager.highlightTextInContainers(
        text,
        'dictionary',
        targetContainers,
        {
          caseSensitive: this.caseSensitive,
          wholeWord: false,  // 改为 false，允许匹配子串
          maxMatches: 10000,  // 增加到 10000，确保所有词都能被高亮
          onInteraction: this.createInteractionHandler()
        }
      )
      
      // 记录已高亮的词汇
      if (result.success > 0) {
        this.highlightedWords.add(text)
      }
      
      return {
        success: result.success,
        total: result.total,
        errors: result.errors
      }
    } catch (error) {
      return {
        success: 0,
        total: 0,
        errors: [String(error)]
      }
    }
  }
  
  /**
   * 高亮多个词汇
   */
  async highlightWords(words: string[], container?: HTMLElement): Promise<HighlightResult> {
    const targetContainers = container ? [this.getContainerSelector()] : [this.containerSelector]
    
    try {
      if (!this.selectionManager) {
        return {
          success: 0,
          total: 0,
          errors: ['SelectionManager not initialized']
        }
      }
      const result = await this.selectionManager.highlightTextInContainers(
        words,
        'dictionary',
        targetContainers,
        {
          caseSensitive: this.caseSensitive,
          wholeWord: false,  // 改为 false，允许匹配子串
          maxMatches: 10000,  // 增加到 10000，确保所有词都能被高亮
          onInteraction: this.createInteractionHandler()
        }
      )
      
      // 记录已高亮的词汇
      if (result.success > 0) {
        words.forEach(word => this.highlightedWords.add(word))
      }
      
      return {
        success: result.success,
        total: result.total,
        errors: result.errors
      }
    } catch (error) {
      return {
        success: 0,
        total: 0,
        errors: [String(error)]
      }
    }
  }
  
  /**
   * 清除所有高亮
   */
  clearHighlights(container?: HTMLElement): void {
    try {
      if (container) {
        // 清除特定容器的高亮
        const containerSelector = this.getContainerSelector()
        this.selectionManager?.clearTextHighlights(undefined, [containerSelector])
      } else {
        // 清除所有词典高亮
        this.selectionManager?.clearAllHighlights()
      }
      
      // 清空记录
      this.highlightedWords.clear()
    } catch (error) {
      console.error('清除高亮失败:', error)
    }
  }
  
  /**
   * 获取当前高亮元素数量
   * 注意：由于使用了 CSS Highlights API，无法直接获取高亮元素数量
   * 返回已高亮的词汇数量作为近似值
   */
  getHighlightCount(): number {
    return this.highlightedWords.size
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    this.clearHighlights()
    this.clickHandler = null
    
    
    // 销毁 SelectionManager
    this.selectionManager?.destroy()
  }
}
