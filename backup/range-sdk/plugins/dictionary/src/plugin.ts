import type { RangePlugin, PluginContext, PluginAPI, MainRangeData as RangeData } from './range-sdk-types'
import { HighlightManager } from './highlight-manager'
import { MockDataSource } from './mock-data-source'
import { ApiDataSource } from './data-source'
import type { DictionaryConfig, HighlightStyle, TriggerMode } from './types'
import { batchFindWords, searchMatchedWords } from '../api'
import { globalTeaTracker } from '../../../src/tea'
import { CardManager, getCardManager } from './card-manager'
import { RequestManager, BatchRequestManager } from './utils/request-manager'
import { MatchedWords, SimpleWord, WordData } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary'
import { ElMessage } from 'element-plus'
import type { Component } from 'vue'

// 词典插件配置
export interface DictionaryPluginConfig extends DictionaryConfig {
  highlightStyle?: Partial<HighlightStyle>
  autoHighlight?: boolean
  container?: HTMLElement
  caseSensitive?: boolean
  customCardComponent?: Component
  customCardComponentProps?: Record<string, any>
  disableDefaultRequest?: boolean
}

type SearchOption = {
    // 搜索配置
    searchConfig?: {
      appid?: number
      content?: string
      [key: string]: any
    }
    // 直接指定词汇列表
    words?: string[]
    wordsWithAppid?: SimpleWord[]
    // 使用模拟数据
    useMock?: boolean
    // 搜索的容器
    container?: HTMLElement
  }

// 词典插件 API
export interface DictionaryAPI extends PluginAPI {
  // 搜索并高亮词汇
  search(options: SearchOption): Promise<{ words: string[], matchData?: WordData[] }>
  // 高亮词汇（不搜索，直接高亮指定词汇）
  highlightWords(words: string[], container?: HTMLElement): Promise<void>
  // 清除高亮
  clearHighlights(container?: HTMLElement): void
  // 获取词条数据（支持word_id或word）
  getEntry(wordOrId: string | number): Promise<WordData | null>
  // 设置高亮样式
  setHighlightStyle(style: Partial<HighlightStyle>): void
  // 动态设置模拟数据
  setMockData(data: Record<string, WordData>): void
  // 设置触发模式
  setTriggerMode(mode: TriggerMode): void
  // 设置是否区分大小写
  setCaseSensitive(caseSensitive: boolean): void
}

// 词典插件实现 - 符合 Range SDK 插件规范
export class DictionaryPlugin implements RangePlugin<DictionaryAPI> {
  id = 'dictionary'
  name = '词典插件'
  version = '1.0.0'

  private config: DictionaryPluginConfig
  private highlightManager!: HighlightManager
  private dataSource!: ApiDataSource | MockDataSource
  private cardManager!: CardManager
  private requestManager!: RequestManager
  private batchRequestManager!: BatchRequestManager
  private context?: PluginContext
  private activeHighlightCount: number = 0
  private matchedWords: WordData[] = []
  private currentDataAbortController: AbortController | null = null

  constructor(config: DictionaryPluginConfig = {}) {
    this.config = config
  }

  async initialize(context: PluginContext): Promise<void> {
    this.context = context

    // 初始化请求管理器
    this.requestManager = new RequestManager()
    this.batchRequestManager = new BatchRequestManager(2) // 并发限制为2

    // 初始化卡片管理器，每次都更新配置以支持动态切换
    this.cardManager = getCardManager({
      container: this.config.container || document.body,
      zIndex: 1000,
      customCardComponent: this.config.customCardComponent,
      customCardComponentProps: this.config.customCardComponentProps,
      disableDefaultRequest: this.config.disableDefaultRequest
    })

    console.log('词典插件初始化，customCardComponent:', !!this.config.customCardComponent)
    
    // 初始化高亮管理器，使用 context 中的 selectionManager
    this.highlightManager = new HighlightManager(
      this.config.container || document.body,
      context.selectionManager,
      this.config.highlightStyle,
      this.config.triggerMode || 'hover',
      this.config.caseSensitive ?? false
    )

    // 设置高亮样式
    if (this.config.highlightStyle) {
      this.highlightManager.setStyle(this.config.highlightStyle)
    }

    // 设置点击处理器
    this.highlightManager.setClickHandler((target: HTMLElement, selection: {
      text: string;
      overlappedTexts?: string[];
    }) => {
      // 如果有重叠的文本，显示多个词汇；否则只显示当前点击的文本
      const wordsToShow = selection.overlappedTexts || [selection.text]
      this.showDictionaryCard(target, wordsToShow)
    })

    // 根据是否有mockData决定使用哪个数据源
    if (this.config.mockData) {
      this.dataSource = new MockDataSource({})
      this.dataSource.setMockData(this.config.mockData)
    } else {
      this.dataSource = new ApiDataSource(this.config)
    }
  }

  // 搜索并高亮词汇
  async search(options: SearchOption): Promise<{ words: string[], matchData?: WordData[] }> {
    const { searchConfig, words, wordsWithAppid, useMock, container } = options

    let wordsToHighlight: string[] = []
    let matchData: WordData[] = []

    const searchByWords = async (words: SimpleWord[]) => {
      const res = await batchFindWords({
        words
      });
      if (res?.word_list && res.word_list.length > 0) {
        matchData = res.word_list;
      }
    }

    // 决定搜索方式
    if (words && words.length > 0) {
      wordsToHighlight = words;
    } else if (wordsWithAppid && wordsWithAppid.length > 0) {
      wordsToHighlight = wordsWithAppid?.filter(item => item.word)?.map(item => item.word || '')
      await searchByWords(wordsWithAppid)
    } else if (searchConfig && searchConfig.appid && searchConfig.content) {
      try {
        const response = await searchMatchedWords({
          appid: searchConfig.appid,
          content: searchConfig.content || '',
          ...searchConfig,
        })
        
        // 从响应中提取匹配的词汇
        if (response && response.match_words && response.match_words.length > 0) {
          wordsToHighlight = response.match_words
            .filter(item => item.word)
            .map(item => item.word as string)
          
          // 保存匹配数据
          matchData = response.match_words?.reduce((prev, cur) => {
            if (cur.word) {
              const list = cur.matches?.map(item => ({
                word: cur.word,
                ...item,
              })) as WordData[];
              prev.push(...list)
            }
            return prev
          }, [] as WordData[]) as WordData[];
        }
      } catch (error) {
        ElMessage.error('词典搜索失败')
      }
    } else if (useMock && this.config.mockData) {
      // 方式 3: 使用模拟数据
      wordsToHighlight = Object.keys(this.config.mockData)
    }

    // 执行高亮
    if (wordsToHighlight.length > 0) {
      await this.highlightManager.highlightWords(wordsToHighlight, container)
      
      // 更新高亮计数器为实际高亮的选区数量
      this.activeHighlightCount = this.highlightManager.getHighlightCount()
      
      // 上报搜索埋点
      await this.trackDictionarySearch(wordsToHighlight, container)
    }

    this.matchedWords = matchData

    return { words: wordsToHighlight, matchData }
  }

  // 高亮词汇（不搜索，直接高亮）
  async highlightWords(words: string[], container?: HTMLElement): Promise<void> {
    await this.highlightManager.highlightWords(words, container)
    // 更新高亮计数器为实际高亮的选区数量
    this.activeHighlightCount = this.highlightManager.getHighlightCount()
  }

  // 清除高亮
  clearHighlights(container?: HTMLElement): void {
    this.highlightManager.clearHighlights(container)
    // 重置高亮计数器
    this.activeHighlightCount = 0
  }

  // 获取词条数据（优先使用word_id）
  async getEntry(wordOrId: string | number): Promise<WordData | null> {
    if (typeof wordOrId === 'number') {
      // 如果是数字，先尝试通过ID获取
      return await this.dataSource.getEntryById?.(wordOrId) || null
    } else {
      // 如果是字符串，使用word获取
      const wordData = this.matchedWords.find(item => item.word === wordOrId)
      return await this.dataSource.getEntryByWord(wordOrId, wordData)
    }
  }

  // 动态设置模拟数据
  setMockData(data: Record<string, WordData>): void {
    // 更新配置中的模拟数据
    this.config.mockData = { ...this.config.mockData, ...data }

    // 如果当前数据源是模拟数据源，直接更新
    if (this.dataSource && 'setMockData' in this.dataSource) {
      (this.dataSource as any).setMockData(this.config.mockData)
    }
  }

  // 设置触发模式
  setTriggerMode(mode: TriggerMode): void {
    // 更新配置
    this.config.triggerMode = mode

    // 更新高亮管理器的触发模式
    if (this.highlightManager) {
      this.highlightManager.setTriggerMode(mode)
    }
  }

  // 设置是否区分大小写
  setCaseSensitive(caseSensitive: boolean): void {
    // 更新配置
    this.config.caseSensitive = caseSensitive

    // 更新高亮管理器的大小写敏感设置
    if (this.highlightManager) {
      this.highlightManager.setCaseSensitive(caseSensitive)
    }
  }

  // 显示词典卡片
  private async showDictionaryCard(target: HTMLElement, keywords: string[]): Promise<void> {
    // 立即显示卡片，传入关键词列表但不传入数据
    // 卡片会先显示loading状态，然后按需加载数据
    await this.cardManager.showWithLazyLoad({
      target,
      keywords,
      dataLoader: async (keyword: string, signal?: AbortSignal) => {
        // 尝试从匹配的词条中找到对应的word_id
        let wordIdOrKeyword: string | number = keyword
        if ('getMatchedWords' in this.dataSource) {
          const matchedWord = this.dataSource.getMatchedWords().find(w => w.word === keyword)
          if (matchedWord?.id) {
            wordIdOrKeyword = matchedWord.id
          }
        }

        // 获取词条数据
        try {
          // 使用请求管理器来管理单个请求
          const entry = await this.requestManager.execute(
            `entry-${keyword}`,
            async () => await this.getEntry(wordIdOrKeyword),
            {
              timeout: 3000,
              retries: 1,
              retryDelay: 500,
              signal
            }
          )
          
          if (entry) {
            return { keyword, entry }
          } else {
            console.warn(`未找到词条: ${keyword}`)
            return null
          }
        } catch (error) {
          console.error(`获取词条失败: ${keyword}`, error)
          // 返回错误信息，让卡片显示错误状态
          throw error
        }
      },
      onClose: () => {
        // 取消所有请求
        this.requestManager.cancelAll()
      },
      onClickTag: (tag: string) => {
        // 搜索标签
        this.highlightWords([tag])
      },
      onClickLarkDoc: (link: string) => window.open(link, '_blank'),
      onClickWebLink: (link: string) => window.open(link, '_blank')
    })

    // 上报词典点击埋点（传递所有词汇）
    await this.trackDictionaryClick(keywords, target)
  }

  // 上报词典搜索埋点
  private async trackDictionarySearch(words: string[], container?: HTMLElement): Promise<void> {
    try {
      // 创建一个汇总的搜索埋点事件
      const rangeData: RangeData = {
        id: `dictionary-search-batch-${Date.now()}`,
        startContainerPath: container ? this.getElementPath(container as HTMLElement) : 'body',
        startOffset: 0,
        endContainerPath: container ? this.getElementPath(container as HTMLElement) : 'body',
        endOffset: 0,
        selectedText: words.join('、'), // 用中文顿号连接所有词汇
        pageUrl: window.location.href,
        timestamp: Date.now(),
        rect: container ? (container as HTMLElement).getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 },
        contextBefore: '',
        contextAfter: `搜索${words.length}个词汇，实际高亮${this.activeHighlightCount}个选区`
      }

      const appid = (this.config as any).appid || 1000

      // 尝试获取性能监控器
      const performanceMonitor = (window as any).__rangesdk__?.performance || undefined

      await globalTeaTracker.trackRangeShow({
        appid,
        rangeData,
        pluginName: this.name,
        selectionCount: this.activeHighlightCount,
        performanceMonitor,
        additionalData: {
          matched_word_types: words.length, // 命中的词汇类型数量
          matched_word_list: words, // 命中的词汇列表
          actual_highlight_count: this.activeHighlightCount // 实际高亮选区数量
        }
      })

      console.log('[Dictionary] 词典搜索埋点已上报, 词汇类型数量:', words.length, '实际高亮选区数量:', this.activeHighlightCount, '词汇:', words)
    } catch (error) {
      console.error('[Dictionary] 词典搜索埋点上报失败:', error)
    }
  }

  // 上报词典点击埋点
  private async trackDictionaryClick(keywords: string[], target: HTMLElement): Promise<void> {
    try {
      // 主要词汇（第一个）
      const primaryKeyword = keywords[0]
      
      // 创建模拟的 rangeData 用于埋点
      const rangeData: RangeData = {
        id: `dictionary-${Date.now()}`,
        startContainerPath: this.getElementPath(target),
        startOffset: 0,
        endContainerPath: this.getElementPath(target),
        endOffset: primaryKeyword.length,
        selectedText: primaryKeyword,
        pageUrl: window.location.href,
        timestamp: Date.now(),
        rect: target.getBoundingClientRect(),
        contextBefore: this.getContextText(target, true),
        contextAfter: this.getContextText(target, false)
      }

      // 获取 appid（使用默认值或从配置中获取）
      const appid = (this.config as any).appid || 1000

      await globalTeaTracker.trackRangeClick({
        appid,
        rangeData,
        clickedSelectionId: rangeData.id,
        pluginName: this.name,
        selectionCount: this.activeHighlightCount,
        // performanceMonitor 暂不传递，tea tracker 内部会处理
        additionalData: {
          clicked_word: primaryKeyword, // 主要点击的词汇
          overlappedTexts: keywords, // 所有重叠的词汇
          hasOverlap: keywords.length > 1, // 是否有重叠
          overlapCount: keywords.length, // 重叠数量
          total_highlight_count: this.activeHighlightCount // 页面总高亮选区数量
        }
      })

      console.log('[Dictionary] 词典点击埋点已上报:', {
        primary: primaryKeyword,
        overlapped: keywords,
        count: keywords.length
      })
    } catch (error) {
      console.error('[Dictionary] 词典点击埋点上报失败:', error)
    }
  }

  // 获取元素路径（简化版本）
  private getElementPath(element: HTMLElement): string {
    const path = []
    let current = element
    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase()
      const className = current.className ? `.${current.className.replace(/\s+/g, '.')}` : ''
      const id = current.id ? `#${current.id}` : ''
      path.unshift(`${tagName}${id}${className}`)
      current = current.parentElement as HTMLElement
    }
    return path.join(' > ')
  }

  // 获取上下文文本
  private getContextText(element: HTMLElement, before: boolean): string {
    const text = element.textContent || ''
    const maxLength = 50
    if (before) {
      return text.substring(Math.max(0, text.length - maxLength))
    } else {
      return text.substring(0, maxLength)
    }
  }

  // 隐藏词典卡片
  private hideDictionaryCard(): void {
    this.cardManager.hide()
    // 取消所有请求
    this.requestManager.cancelAll()
  }

  // 处理选区选择
  onRangeSelected(rangeData: RangeData): void {
    const selectedText = rangeData.selectedText.trim()
    if (selectedText && this.config.words?.includes(selectedText)) {
      // 可以显示提示或自动高亮
      console.log('选中了词典词汇:', selectedText)
    }
  }

  // 获取插件 API
  getAPI(): DictionaryAPI {
    return {
      search: (options) => this.search(options),
      highlightWords: (words: string[], container?: HTMLElement) =>
        this.highlightWords(words, container),
      clearHighlights: (container?: HTMLElement) =>
        this.clearHighlights(container),
      getEntry: (wordOrId: string | number) =>
        this.getEntry(wordOrId),
      setHighlightStyle: (style: Partial<HighlightStyle>) =>
        this.highlightManager.setStyle(style),
      setMockData: (data: Record<string, WordData>) =>
        this.setMockData(data),
      setTriggerMode: (mode: TriggerMode) =>
        this.setTriggerMode(mode),
      setCaseSensitive: (caseSensitive: boolean) =>
        this.setCaseSensitive(caseSensitive)
    }
  }

  // 销毁插件
  destroy(): void {
    // 隐藏卡片
    this.hideDictionaryCard()
    
    // 取消所有请求
    this.requestManager.cancelAll()
    
    // 销毁管理器
    this.cardManager.destroy()
    this.highlightManager.destroy()
  }
}

// 创建插件实例的工厂函数
export function createDictionaryPlugin(config: DictionaryPluginConfig = {}): DictionaryPlugin {
  return new DictionaryPlugin(config)
}

// 导出 Range SDK 集成类型
export type {
  RangeSDKWithDictionary,
  RangeSDKEvents,
  RangeSDKEventName,
  RangeData,
  MarkData,
  CommentData,
  HighlightInstance
} from './range-sdk-types'
export { asRangeSDKWithDictionary, RangeSDKEventType } from './range-sdk-types'
