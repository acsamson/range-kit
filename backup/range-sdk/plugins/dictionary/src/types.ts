import { RangeSdkAppId } from "../../../src/types"
import type { WordData } from "../hooks"
import type { SimpleWord } from "../bam-auto-generate/bes.fe.web_core/namespaces/dictionary"

// 重新导出需要的类型
export type { WordData, SimpleWord }

// 词状态枚举
export enum WordStatus {
  DELETED = 0,
  NORMAL = 1
}

// 触发方式类型
export type TriggerMode = 'hover' | 'click'

// 词典配置选项
export interface DictionaryConfig {
  // 方式1: 使用 search_matched_words 接口
  searchRequest?: {
    appid: RangeSdkAppId | number
    content?: string
    [key: string]: any
  }
  // 方式2: 直接传入词条字符串列表
  words?: string[]
  // 方式3: 传入模拟数据（用于demo）
  mockData?: Record<string, WordData>
  // 触发方式 - 控制卡片显示方式：hover(悬停) 或 click(点击)
  triggerMode?: TriggerMode
}

// 数据源接口
export interface DictionaryDataSource {
  // 根据关键词搜索词条
  search(keyword: string): Promise<WordData[]>
  // 根据ID获取词条详情
  getEntry(id: number): Promise<WordData | null>
  // 批量获取词条
  getEntries(ids: number[]): Promise<WordData[]>
}

// 性能指标接口
export interface PerformanceMetrics {
  // 搜索耗时（毫秒）
  searchTime?: number
  // 渲染耗时（毫秒）
  renderTime?: number
  // 总耗时（毫秒）
  totalTime?: number
  // 缓存命中
  cacheHit?: boolean
  // 搜索关键词
  keyword?: string
  // 时间戳
  timestamp?: number
}

// 性能回调函数类型
export interface PerformanceCallback {
  (metrics: PerformanceMetrics): void
}

// 词典插件选项
export interface DictionaryPluginOptions {
  // 词典配置
  config: DictionaryConfig
  // 触发方式：hover-悬浮触发，click-点击触发，both-两者都触发
  trigger?: 'hover' | 'click' | 'both'
  // 悬浮延迟时间（毫秒）
  hoverDelay?: number
  // 是否显示搜索框
  showSearch?: boolean
  // 自定义样式类名
  customClass?: string
  // 卡片最大宽度
  maxWidth?: number
  // 卡片位置偏移
  offset?: number
  // 是否启用缓存
  enableCache?: boolean
  // 缓存过期时间（毫秒）
  cacheExpiry?: number
  // 是否启用性能监控
  enablePerformance?: boolean
  // 性能指标回调
  onPerformance?: PerformanceCallback
}

// 高亮样式配置
export interface HighlightStyle {
  // CSS Highlights API 支持的属性
  color?: string
  backgroundColor?: string
  textDecoration?: string
  textDecorationStyle?: string
  textDecorationColor?: string
  textDecorationThickness?: string
  textUnderlineOffset?: string
  textShadow?: string
  opacity?: number
  
  // CSS Highlights API 不支持的属性（仅用于降级方案）
  borderBottom?: string
  hoverBackgroundColor?: string
  hoverBorderBottom?: string
  hoverColor?: string
  cursor?: string
  transition?: string
  padding?: string
  lineHeight?: string
  border?: string
  borderRadius?: string
  boxShadow?: string
}

// 高亮结果
export interface HighlightResult {
  success: number
  total: number
  errors: string[]
}

// 词典插件实例接口
export interface DictionaryPlugin {
  // 初始化插件，获取匹配的词条
  initialize(content?: string): Promise<WordData[]>
  // 获取匹配的词条列表
  getMatchedWords(): WordData[]
  // 检查某个位置是否在词条范围内
  checkWordAtPosition(offset: number): WordData | null
  // 显示词典卡片
  show(target: HTMLElement, keyword: string): Promise<void>
  // 隐藏词典卡片
  hide(): void
  // 高亮指定的词汇列表
  highlightWords(words: string[], container?: HTMLElement): Promise<HighlightResult>
  // 高亮所有已匹配的词汇
  highlightMatchedWords(container?: HTMLElement): Promise<HighlightResult>
  // 清除所有高亮
  clearHighlights(container?: HTMLElement): void
  // 设置高亮样式
  setHighlightStyle(style: Partial<HighlightStyle>): void
  // 启用自动高亮（监听DOM变化）
  enableAutoHighlight(container?: HTMLElement): void
  // 禁用自动高亮
  disableAutoHighlight(): void
  // 更新选项
  updateOptions(options: Partial<DictionaryPluginOptions>): void
  // 清除缓存
  clearCache(): void
  // 销毁插件
  destroy(): void
  // 获取最新的性能指标
  getLatestMetrics(): PerformanceMetrics | null
  // 获取所有性能指标历史
  getAllMetrics(): PerformanceMetrics[]
  // 注册性能监听回调
  onPerformance(callback: PerformanceCallback): void
  // 移除性能监听回调
  offPerformance(callback: PerformanceCallback): void
}

// 词典卡片组件的属性
export interface DictionaryCardProps {
  // 要显示的词条
  entry: WordData | null
  // 是否显示加载状态
  loading?: boolean
  // 是否显示错误状态
  error?: string | null
  // 搜索关键词（用于高亮）
  keyword?: string
  // 是否显示搜索框
  showSearch?: boolean
  // 自定义样式类名
  customClass?: string
}

// 词典卡片事件
export interface DictionaryCardEvents {
  // 关闭事件
  close: void
  // 点击负责人
  clickOwner: (email: string) => void
  // 点击飞书文档
  clickLarkDoc: (link: string) => void
  // 点击外部链接
  clickWebLink: (link: string) => void
  // 点击标签
  clickTag: (tag: string) => void
  // 点击飞书群
  clickLarkChat: (chatId: string) => void
  // 搜索事件
  search: (keyword: string) => void
}

export const LocalStorageReqParamsKey = 'dictionaryExtraParams'
