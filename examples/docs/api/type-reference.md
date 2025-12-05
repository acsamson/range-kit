# TypeScript 类型参考

Range SDK 提供完整的 TypeScript 类型支持。本文档详细介绍所有公共类型定义。

## 导入类型

```typescript
// 核心类型
import type {
  RangeSDK,
  RangeSDKOptions,
  RangeData,
  MarkData,
  RangeSDKEvents
} from '@ad-audit/range-sdk'

// 插件相关类型
import type {
  RangePlugin,
  PluginAPI,
  PluginContext,
  PluginMetadata
} from '@ad-audit/range-sdk'

// 性能监控类型
import type {
  PerformanceReport,
  PerformanceMonitorConfig,
  IPerformanceMonitor
} from '@ad-audit/range-sdk'

// 类型安全相关
import type {
  BaseRangeSDK,
  WithDictionary,
  WithComment,
  CombinePlugins
} from '@ad-audit/range-sdk'
```

## 核心类型

### RangeSDK 主类

```typescript
declare class RangeSDK {
  constructor(options?: RangeSDKOptions)
  
  // 插件管理
  registerPlugin<T extends PluginAPI>(plugin: RangePlugin<T>): Promise<void>
  unregisterPlugin(pluginId: string): void
  getPlugin<T extends RangePlugin>(pluginId: string): T | undefined
  
  // 选区管理
  getCurrentSelection(): Promise<RangeData | null>
  restoreSelection(rangeData: RangeData): Promise<Range | null>
  clearSelection(): void
  
  // 高亮管理
  highlightRange(rangeData: RangeData, duration?: number): Promise<string | null>
  clearAllHighlights(): void
  
  // 事件系统
  on<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]): void
  off<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]): void
  
  // 性能监控
  getPerformanceMonitor(): IPerformanceMonitor | undefined
  getPerformanceReport(startTime?: number, endTime?: number): PerformanceReport | null
  clearPerformanceMetrics(): void
  
  // 工具方法
  destroy(): void
  
  // 静态属性
  static readonly version: string
}
```

### RangeSDKOptions

```typescript
interface RangeSDKOptions {
  // 基础配置
  container?: Element                    // 容器元素，默认 document.body
  debug?: boolean                       // 调试模式，默认 false
  performance?: PerformanceMonitorConfig | boolean  // 性能监控配置
  
  // 选区配置
  selection?: {
    autoCapture?: boolean              // 自动捕获选区，默认 true
    minTextLength?: number             // 最小文本长度，默认 1
    maxTextLength?: number             // 最大文本长度，默认 10000
    excludeSelectors?: string[]        // 排除的选择器
    includeSelectors?: string[]        // 包含的选择器
    debounceTime?: number              // 防抖时间，默认 100ms
  }
  
  // 高亮配置
  highlight?: {
    defaultStyle?: Partial<HighlightStyle>  // 默认高亮样式
    animationDuration?: number         // 动画持续时间，默认 300ms
    maxHighlights?: number             // 最大高亮数量，默认 1000
    autoCleanup?: boolean              // 自动清理，默认 true
  }
  
  // 事件配置
  events?: {
    throttleTime?: number              // 事件节流时间，默认 50ms
    maxListeners?: number              // 最大监听器数量，默认 100
  }
  
  // 存储配置
  storage?: {
    enableCache?: boolean              // 启用缓存，默认 true
    cacheSize?: number                 // 缓存大小，默认 100
    cacheTTL?: number                  // 缓存过期时间，默认 5分钟
  }
}
```

## 数据类型

### RangeData

选区数据的核心类型：

```typescript
interface RangeData {
  // 基本信息
  id: string                    // 唯一标识符
  selectedText: string          // 选中的文本内容
  pageUrl: string               // 页面 URL
  timestamp: number             // 创建时间戳
  
  // DOM 位置信息
  startContainerPath: string    // 开始容器的 DOM 路径
  startOffset: number           // 开始位置偏移
  endContainerPath: string      // 结束容器的 DOM 路径
  endOffset: number             // 结束位置偏移
  
  // 几何信息
  rect: DOMRect                 // 选区的几何信息
  
  // 上下文信息
  contextBefore?: string        // 选区前的上下文
  contextAfter?: string         // 选区后的上下文
  
  // 元数据
  metadata?: {
    // 选区来源
    source?: 'user' | 'api' | 'restore'
    
    // 选区类型
    type?: 'text' | 'element' | 'mixed'
    
    // 容器信息
    containerInfo?: {
      tagName: string
      className: string
      id: string
    }
    
    // 选区统计
    stats?: {
      wordCount: number
      characterCount: number
      lineCount: number
    }
    
    // 自定义数据
    [key: string]: any
  }
  
  // 恢复相关
  restorationHints?: {
    // ID 锚点
    nearbyIds?: string[]
    
    // 文本锚点
    textAnchors?: {
      before: string
      after: string
    }
    
    // 结构指纹
    structuralFingerprint?: string
    
    // 相对位置
    relativePosition?: {
      parentPath: string
      siblingIndex: number
    }
  }
}
```

### MarkData

标记数据类型：

```typescript
interface MarkData {
  // 基本信息
  id: string                    // 标记 ID
  selectedText: string          // 标记的文本
  timestamp: number             // 创建时间
  
  // 位置信息
  rect: DOMRect                 // 标记的几何信息
  
  // 来源信息
  pluginName?: string           // 创建标记的插件名称
  source?: string               // 标记来源
  
  // 元数据
  metadata?: {
    // 标记类型
    type?: 'highlight' | 'annotation' | 'bookmark' | 'error'
    
    // 样式信息
    style?: Partial<HighlightStyle>
    
    // 交互信息
    clickable?: boolean
    editable?: boolean
    
    // 关联信息
    relatedMarkIds?: string[]
    groupId?: string
    
    // 自定义数据
    [key: string]: any
  }
  
  // 生命周期
  expiresAt?: number            // 过期时间
  persistant?: boolean          // 是否持久化
}
```

### HighlightStyle

高亮样式配置：

```typescript
interface HighlightStyle {
  // 背景样式
  backgroundColor?: string      // 背景色
  backgroundImage?: string      // 背景图片
  
  // 边框样式
  border?: string               // 边框
  borderTop?: string            // 上边框
  borderRight?: string          // 右边框
  borderBottom?: string         // 下边框
  borderLeft?: string           // 左边框
  borderRadius?: string         // 圆角
  
  // 文字样式
  color?: string                // 文字颜色
  fontWeight?: string           // 字体粗细
  fontSize?: string             // 字体大小
  fontStyle?: string            // 字体样式
  textDecoration?: string       // 文字装饰
  
  // 间距样式
  padding?: string              // 内边距
  margin?: string               // 外边距
  
  // 交互样式
  cursor?: string               // 鼠标样式
  userSelect?: string           // 用户选择
  
  // 动画样式
  transition?: string           // 过渡效果
  animation?: string            // 动画效果
  
  // 层级样式
  zIndex?: string | number      // 层级
  position?: string             // 定位方式
  
  // 透明度
  opacity?: string | number     // 透明度
  
  // 盒子阴影
  boxShadow?: string            // 盒子阴影
  
  // 自定义CSS属性
  [key: `--${string}`]: string  // CSS 变量
}
```

## 事件类型

### RangeSDKEvents

```typescript
interface RangeSDKEvents {
  // 选区相关事件
  'range-selected': (rangeData: RangeData) => void
  'range-restored': (rangeData: RangeData, success: boolean) => void
  'range-cleared': () => void
  'range-serialized': (rangeData: RangeData) => void
  
  // 标记相关事件
  'mark-created': (markData: MarkData) => void
  'mark-clicked': (markData: MarkData, event: MouseEvent) => void
  'mark-removed': (markId: string) => void
  'mark-updated': (markData: MarkData) => void
  
  // 高亮相关事件
  'highlight-created': (highlightId: string, rangeData: RangeData) => void
  'highlight-removed': (highlightId: string) => void
  'highlights-cleared': () => void
  
  // 插件相关事件
  'plugin-registered': (pluginId: string, plugin: RangePlugin) => void
  'plugin-unregistered': (pluginId: string) => void
  'plugin-initialized': (pluginId: string) => void
  'plugin-error': (pluginId: string, error: Error) => void
  
  // 性能相关事件
  'performance-warning': (warning: PerformanceWarning) => void
  'performance-report': (report: PerformanceReport) => void
  
  // 错误相关事件
  'error': (error: RangeSDKError) => void
  'warning': (warning: RangeSDKWarning) => void
  
  // 生命周期事件
  'initialized': () => void
  'destroyed': () => void
  
  // 自定义事件
  [eventName: string]: (...args: any[]) => void
}
```

### 事件数据类型

```typescript
interface PerformanceWarning {
  type: 'MEMORY_HIGH' | 'PROCESSING_SLOW' | 'TOO_MANY_OPERATIONS' | 'CACHE_MISS_HIGH'
  message: string
  threshold: number
  currentValue: number
  timestamp: number
  suggestions?: string[]
}

interface RangeSDKError extends Error {
  code: string
  context?: any
  timestamp: number
  recoverable: boolean
}

interface RangeSDKWarning {
  type: 'deprecation' | 'compatibility' | 'performance' | 'configuration'
  message: string
  timestamp: number
  actionRequired?: boolean
}
```

## 插件类型

### RangePlugin

```typescript
interface RangePlugin<T extends PluginAPI = PluginAPI> {
  // 基本信息
  readonly id: string                   // 插件唯一标识
  readonly name: string                 // 插件显示名称
  readonly version: string              // 插件版本
  
  // 依赖和元数据
  readonly dependencies?: string[]      // 依赖的插件ID列表
  readonly metadata?: PluginMetadata    // 插件元数据
  
  // 生命周期方法
  initialize(context: PluginContext): Promise<void>  // 初始化
  destroy?(): void                      // 销毁
  
  // API 提供
  getAPI(): T                          // 获取插件 API
  
  // 事件处理（可选）
  onRangeSelected?(rangeData: RangeData): void | Promise<void>
  onMarkClicked?(markData: MarkData): void | Promise<void>
  onPluginEvent?(event: string, ...args: any[]): void | Promise<void>
  
  // 配置和验证（可选）
  validateConfig?(config: any): boolean | Promise<boolean>
  migrateConfig?(oldConfig: any, newVersion: string): any | Promise<any>
  
  // 健康检查（可选）
  healthCheck?(): PluginHealthStatus | Promise<PluginHealthStatus>
}
```

### PluginAPI

```typescript
interface PluginAPI {
  // 所有插件API的基础接口
  // 具体插件应该扩展此接口
  
  // 可选的通用方法
  isEnabled?(): boolean
  getConfig?(): any
  updateConfig?(config: any): void
  getStats?(): any
  reset?(): void
}
```

### PluginContext

```typescript
interface PluginContext {
  // 核心服务
  selectionManager: SelectionManager     // 选区管理器
  emit: EventEmitter                     // 事件发射器
  
  // 配置
  globalConfig: any                      // 全局配置
  pluginConfig?: any                     // 插件专用配置
  
  // 可选服务
  performanceMonitor?: IPerformanceMonitor  // 性能监控器
  logger?: ILogger                       // 日志服务
  storage?: IStorage                     // 存储服务
  cache?: ICache                         // 缓存服务
  
  // 工具方法
  getPluginAPI?<T extends PluginAPI>(pluginId: string): T | undefined
  hasPlugin?(pluginId: string): boolean
  
  // DOM 工具
  createElement?<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options?: CreateElementOptions
  ): HTMLElementTagNameMap[K]
  
  querySelector?(selector: string): Element | null
  querySelectorAll?(selector: string): NodeListOf<Element>
}

interface CreateElementOptions {
  className?: string
  id?: string
  attributes?: Record<string, string>
  styles?: Partial<CSSStyleDeclaration>
  events?: Record<string, EventListener>
}
```

### PluginMetadata

```typescript
interface PluginMetadata {
  // 基本信息
  description?: string                   // 插件描述
  author?: string | Author               // 作者信息
  license?: string                       // 许可证
  homepage?: string                      // 主页URL
  repository?: string | Repository       // 代码仓库
  keywords?: string[]                    // 关键词
  
  // 版本和兼容性
  rangeSDKVersion?: string               // 支持的SDK版本范围
  nodeVersion?: string                   // Node.js版本要求
  browserSupport?: BrowserSupport[]      // 浏览器支持
  
  // 功能和权限
  features?: string[]                    // 功能列表
  permissions?: Permission[]             // 所需权限
  apis?: string[]                        // 使用的API列表
  
  // 资源和配置
  assets?: string[]                      // 资源文件列表
  configSchema?: ConfigSchema            // 配置模式
  
  // 分类和标签
  category?: PluginCategory              // 插件分类
  tags?: string[]                        // 标签
  
  // 发布信息
  publishedAt?: string                   // 发布时间
  updatedAt?: string                     // 更新时间
  downloadCount?: number                 // 下载次数
  rating?: number                        // 评分
}

interface Author {
  name: string
  email?: string
  url?: string
}

interface Repository {
  type: 'git' | 'svn'
  url: string
  directory?: string
}

interface BrowserSupport {
  name: 'chrome' | 'firefox' | 'safari' | 'edge'
  version: string
}

interface Permission {
  type: 'dom' | 'network' | 'storage' | 'clipboard' | 'notification'
  description: string
  required: boolean
}

interface ConfigSchema {
  type: 'object'
  properties: Record<string, ConfigProperty>
  required?: string[]
}

interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  default?: any
  enum?: any[]
  minimum?: number
  maximum?: number
  pattern?: string
}

type PluginCategory = 
  | 'text-processing'
  | 'annotation'
  | 'collaboration'
  | 'analysis'
  | 'integration'
  | 'ui-enhancement'
  | 'developer-tools'
  | 'accessibility'
```

## 性能监控类型

### PerformanceReport

```typescript
interface PerformanceReport {
  // 基本信息
  startTime: number                      // 报告开始时间
  endTime: number                        // 报告结束时间
  duration: number                       // 报告时间范围
  
  // 操作统计
  operations: {
    selectionCount: number               // 选区操作次数
    restorationCount: number             // 恢复操作次数
    highlightCount: number               // 高亮操作次数
    pluginOperationCount: number         // 插件操作次数
  }
  
  // 时间统计
  timings: {
    averageSelectionTime: number         // 平均选区处理时间
    averageRestorationTime: number       // 平均恢复处理时间
    averageHighlightTime: number         // 平均高亮处理时间
    totalProcessingTime: number          // 总处理时间
    
    // 分位数统计
    percentiles: {
      p50: number                        // 50分位数
      p90: number                        // 90分位数
      p95: number                        // 95分位数
      p99: number                        // 99分位数
    }
  }
  
  // 资源统计
  resources: {
    memoryUsage: MemoryUsage             // 内存使用情况
    domNodeCount: number                 // DOM节点数量
    eventListenerCount: number           // 事件监听器数量
    cacheSize: number                    // 缓存大小
  }
  
  // 成功率统计
  successRates: {
    selectionSuccess: number             // 选区成功率
    restorationSuccess: number           // 恢复成功率
    highlightSuccess: number             // 高亮成功率
    overallSuccess: number               // 整体成功率
  }
  
  // 错误统计
  errors: {
    totalErrors: number                  // 总错误数
    errorsByType: Record<string, number> // 按类型分组的错误
    criticalErrors: number               // 严重错误数
    warningCount: number                 // 警告数量
  }
  
  // 插件统计
  plugins: PluginPerformanceReport[]
  
  // 趋势分析
  trends?: {
    performanceTrend: 'improving' | 'stable' | 'degrading'
    memoryTrend: 'decreasing' | 'stable' | 'increasing'
    errorTrend: 'decreasing' | 'stable' | 'increasing'
  }
}

interface MemoryUsage {
  used: number                          // 已使用内存
  total: number                         // 总内存
  peak: number                          // 峰值内存
  
  // 详细内存信息（如果可用）
  jsHeapSizeLimit?: number
  totalJSHeapSize?: number
  usedJSHeapSize?: number
}

interface PluginPerformanceReport {
  pluginId: string
  pluginName: string
  operationCount: number
  averageOperationTime: number
  errorCount: number
  memoryUsage: number
}
```

### PerformanceMonitorConfig

```typescript
interface PerformanceMonitorConfig {
  // 启用选项
  enabled?: boolean                      // 是否启用性能监控
  
  // 采样配置
  sampleRate?: number                    // 采样率 (0-1)
  maxSamples?: number                    // 最大采样数量
  
  // 阈值配置
  thresholds?: {
    selectionTime?: number               // 选区处理时间阈值
    restorationTime?: number             // 恢复处理时间阈值
    memoryUsage?: number                 // 内存使用阈值
    errorRate?: number                   // 错误率阈值
  }
  
  // 报告配置
  reportInterval?: number                // 报告间隔
  autoReport?: boolean                   // 自动生成报告
  
  // 回调函数
  onWarning?: (warning: PerformanceWarning) => void
  onReport?: (report: PerformanceReport) => void
  onError?: (error: Error) => void
  
  // 存储配置
  persistData?: boolean                  // 是否持久化数据
  maxHistorySize?: number                // 最大历史记录数量
}
```

## 类型安全相关

### 插件类型组合

```typescript
// 基础SDK类型
interface BaseRangeSDK extends RangeSDK {
  // 基础SDK功能，不包含任何插件
}

// 插件类型包装器
type WithDictionary<T extends DictionaryAPI> = {
  dictionary: T
}

type WithComment<T extends CommentAPI> = {
  comment: T
}

type WithHighlight<T extends HighlightAPI> = {
  highlight: T
}

// 组合多个插件类型
type CombinePlugins<Base, Plugins extends readonly any[]> = 
  Base & UnionToIntersection<Plugins[number]>

// 工具类型
type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

// 插件注册表
interface PluginRegistry {
  // 动态添加的插件API会出现在这里
  // 例如：dictionary: DictionaryAPI
}

// 类型安全的SDK类型
type TypeSafeRangeSDK = BaseRangeSDK & PluginRegistry
```

### 创建类型安全的SDK

```typescript
// 工具函数用于创建类型安全的SDK
function createTypedRangeSDK<T = {}>(): BaseRangeSDK & T {
  return new RangeSDK() as BaseRangeSDK & T
}

// 插件链式注册
interface PluginChain<Current = {}> {
  withPlugin<P extends PluginAPI>(
    plugin: RangePlugin<P>
  ): PluginChain<Current & { [K in typeof plugin.id]: P }>
  
  build(): Promise<RangeSDK & Current>
}

function createPluginChain(): PluginChain<{}> {
  // 实现插件链式注册
  return {} as any
}

// 使用示例类型
type MySDK = BaseRangeSDK & 
  WithDictionary<DictionaryAPI> & 
  WithComment<CommentAPI>

// 创建类型安全的SDK实例
const sdk: MySDK = await createPluginChain()
  .withPlugin(dictionaryPlugin)
  .withPlugin(commentPlugin)
  .build()

// 现在有完整的类型检查
sdk.dictionary.search({ words: ['test'] })  // ✅ 类型安全
sdk.comment.addComment(rangeData, 'comment') // ✅ 类型安全
sdk.invalidMethod()                          // ❌ TypeScript 错误
```

## 工具类型

### 条件类型

```typescript
// 检查是否为插件API
type IsPluginAPI<T> = T extends PluginAPI ? true : false

// 提取插件ID类型
type ExtractPluginId<T> = T extends RangePlugin<any> ? T['id'] : never

// 提取插件API类型
type ExtractPluginAPI<T> = T extends RangePlugin<infer API> ? API : never

// 过滤插件类型
type FilterPlugins<T, U> = T extends RangePlugin<any> 
  ? ExtractPluginAPI<T> extends U 
    ? T 
    : never 
  : never
```

### 映射类型

```typescript
// 将插件数组转换为API映射
type PluginsToAPIs<T extends readonly RangePlugin<any>[]> = {
  [K in keyof T]: T[K] extends RangePlugin<infer API> 
    ? API 
    : never
}

// 将插件数组转换为ID映射
type PluginsToIds<T extends readonly RangePlugin<any>[]> = {
  [K in keyof T]: T[K] extends RangePlugin<any> 
    ? T[K]['id'] 
    : never
}

// 创建插件注册表类型
type CreatePluginRegistry<T extends Record<string, PluginAPI>> = {
  [K in keyof T]: T[K]
}
```

### 模板字面量类型

```typescript
// 事件名称类型
type EventName<T extends string> = `${T}-event`

// 插件API方法名称类型
type PluginMethod<T extends string> = `${T}Method`

// CSS类名类型
type CSSClassName<T extends string> = `range-sdk-${T}`

// 配置键类型
type ConfigKey<T extends string> = `${T}Config`
```

## 使用示例

### 完整的类型安全示例

```typescript
// 导入所有需要的类型
import type {
  RangeSDK,
  RangeSDKOptions,
  RangeData,
  MarkData,
  BaseRangeSDK,
  WithDictionary,
  WithComment,
  CombinePlugins
} from '@ad-audit/range-sdk'

import type {
  DictionaryAPI,
  DictionaryConfig
} from '@ad-audit/range-sdk-plugin-dictionary'

import type {
  CommentAPI,
  CommentConfig
} from '@ad-audit/range-sdk-plugin-comment'

// 定义应用特定的SDK类型
type MyAppSDK = CombinePlugins<BaseRangeSDK, [
  WithDictionary<DictionaryAPI>,
  WithComment<CommentAPI>
]>

// 创建应用类
class DocumentApp {
  private sdk!: MyAppSDK
  
  async initialize(container: HTMLElement) {
    // 创建SDK实例
    const rangeSDK = new RangeSDK({
      container,
      debug: process.env.NODE_ENV === 'development',
      performance: true
    })
    
    // 创建插件
    const dictionaryPlugin = createDictionaryPlugin({
      apiEndpoint: '/api/dictionary',
      theme: 'light'
    })
    
    const commentPlugin = createCommentPlugin({
      apiEndpoint: '/api/comments',
      allowAnonymous: false
    })
    
    // 注册插件
    await rangeSDK.registerPlugin(dictionaryPlugin)
    await rangeSDK.registerPlugin(commentPlugin)
    
    // 类型断言为应用SDK类型
    this.sdk = rangeSDK as MyAppSDK
    
    // 设置事件监听
    this.setupEventListeners()
  }
  
  private setupEventListeners() {
    // 类型安全的事件监听
    this.sdk.on('range-selected', (rangeData: RangeData) => {
      console.log('Selected:', rangeData.selectedText)
    })
    
    this.sdk.on('mark-clicked', (markData: MarkData) => {
      console.log('Clicked:', markData.selectedText)
    })
    
    // 插件特定事件
    this.sdk.on('plugin-error', (pluginId: string, error: Error) => {
      console.error(`Plugin ${pluginId} error:`, error)
    })
  }
  
  // 类型安全的方法
  async searchTerms(terms: string[]) {
    // ✅ TypeScript 知道 dictionary 存在并且类型正确
    const result = await this.sdk.dictionary.search({
      words: terms,
      container: this.sdk.options?.container
    })
    
    return result
  }
  
  async addComment(rangeData: RangeData, content: string) {
    // ✅ TypeScript 知道 comment 存在并且类型正确
    const comment = await this.sdk.comment.addComment(rangeData, {
      content,
      author: 'current-user'
    })
    
    return comment
  }
  
  getPerformanceStats() {
    const report = this.sdk.getPerformanceReport()
    
    // 类型安全的数据访问
    if (report) {
      return {
        operationCount: report.operations.selectionCount,
        averageTime: report.timings.averageSelectionTime,
        memoryUsage: report.resources.memoryUsage.used,
        successRate: report.successRates.overallSuccess
      }
    }
    
    return null
  }
  
  destroy() {
    this.sdk.destroy()
  }
}

// 使用应用
const app = new DocumentApp()
await app.initialize(document.querySelector('.document-container'))

// 类型安全的调用
const searchResult = await app.searchTerms(['API', 'SDK'])
const comment = await app.addComment(rangeData, 'This is important')
const stats = app.getPerformanceStats()
```

这个完整的 TypeScript 类型参考提供了 Range SDK 中所有重要类型的详细定义和使用示例。通过这些类型定义，开发者可以享受到完整的类型安全和智能提示功能。