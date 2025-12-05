# 核心 API 参考

本文档提供 Range SDK 核心功能的完整 API 参考。

## RangeSDK 主类

### 构造函数

```typescript
constructor(options?: RangeSDKOptions)
```

创建 Range SDK 实例。

**参数：**
- `options` - 可选的配置对象

**示例：**
```typescript
const rangeSDK = new RangeSDK({
  container: document.querySelector('.content'),
  debug: true,
  performance: {
    warningThreshold: 100,
    memoryWarningThreshold: 50 * 1024 * 1024  // 50MB
  }
})
```

### 配置选项 (RangeSDKOptions)

```typescript
interface RangeSDKOptions {
  container?: Element                    // 容器元素，默认为 document.body
  debug?: boolean                       // 调试模式，默认 false
  performance?: PerformanceMonitorConfig | boolean  // 性能监控配置
  
  // 选区配置
  selection?: {
    autoCapture?: boolean              // 自动捕获选区，默认 true
    minTextLength?: number             // 最小文本长度，默认 1
    excludeSelectors?: string[]        // 排除的选择器
  }
  
  // 高亮配置
  highlight?: {
    defaultStyle?: Partial<HighlightStyle>  // 默认高亮样式
    animationDuration?: number         // 动画持续时间，默认 300ms
  }
}
```

## 插件管理

### registerPlugin()

```typescript
async registerPlugin<T extends PluginAPI>(plugin: RangePlugin<T>): Promise<void>
```

注册插件到 SDK 实例。

**参数：**
- `plugin` - 要注册的插件实例

**返回值：**
- `Promise<void>` - 注册完成的 Promise

**示例：**
```typescript
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'

const dictionaryPlugin = createDictionaryPlugin({
  mockData: { /* 词典数据 */ }
})

await rangeSDK.registerPlugin(dictionaryPlugin)

// 现在可以使用插件 API
await rangeSDK.dictionary.search({ words: ['API'] })
```

### unregisterPlugin()

```typescript
unregisterPlugin(pluginId: string): void
```

注销指定的插件。

**参数：**
- `pluginId` - 插件 ID

**示例：**
```typescript
// 注销词典插件
rangeSDK.unregisterPlugin('dictionary')
```

### getPlugin()

```typescript
getPlugin<T extends RangePlugin>(pluginId: string): T | undefined
```

获取指定插件的实例。

**参数：**
- `pluginId` - 插件 ID

**返回值：**
- 插件实例或 `undefined`

**示例：**
```typescript
const dictionaryPlugin = rangeSDK.getPlugin('dictionary')
if (dictionaryPlugin) {
  console.log('Dictionary plugin found:', dictionaryPlugin.name)
}
```

## 选区管理

### getCurrentSelection()

```typescript
async getCurrentSelection(): Promise<RangeData | null>
```

获取当前用户选择的文本选区。

**返回值：**
- `Promise<RangeData | null>` - 选区数据或 null

**示例：**
```typescript
const selection = await rangeSDK.getCurrentSelection()
if (selection) {
  console.log('选中文本：', selection.selectedText)
  console.log('选区位置：', selection.rect)
}
```

### restoreSelection()

```typescript
async restoreSelection(rangeData: RangeData): Promise<Range | null>
```

恢复指定的文本选区。

**参数：**
- `rangeData` - 要恢复的选区数据

**返回值：**
- `Promise<Range | null>` - 恢复的 Range 对象或 null

**示例：**
```typescript
// 保存选区
const savedSelection = await rangeSDK.getCurrentSelection()
if (savedSelection) {
  localStorage.setItem('selection', JSON.stringify(savedSelection))
}

// 恢复选区
const selectionData = JSON.parse(localStorage.getItem('selection') || 'null')
if (selectionData) {
  const range = await rangeSDK.restoreSelection(selectionData)
  if (range) {
    console.log('选区恢复成功')
  } else {
    console.warn('选区恢复失败')
  }
}
```

### clearSelection()

```typescript
clearSelection(): void
```

清除当前的文本选区。

**示例：**
```typescript
// 清除用户选区
rangeSDK.clearSelection()
```

## 高亮管理

### highlightRange()

```typescript
async highlightRange(rangeData: RangeData, duration?: number): Promise<string | null>
```

高亮指定的文本选区。

**参数：**
- `rangeData` - 要高亮的选区数据
- `duration` - 可选的高亮持续时间（毫秒），0 表示永久高亮

**返回值：**
- `Promise<string | null>` - 高亮标记的 ID 或 null

**示例：**
```typescript
const selection = await rangeSDK.getCurrentSelection()
if (selection) {
  // 高亮选区 5 秒
  const highlightId = await rangeSDK.highlightRange(selection, 5000)
  console.log('高亮 ID：', highlightId)
}
```

### clearAllHighlights()

```typescript
clearAllHighlights(): void
```

清除所有高亮标记。

**示例：**
```typescript
// 清除页面上所有高亮
rangeSDK.clearAllHighlights()
```

## 事件系统

### on()

```typescript
on<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]): void
```

监听 SDK 事件。

**参数：**
- `event` - 事件名称
- `listener` - 事件处理函数

**示例：**
```typescript
// 监听选区选择事件
rangeSDK.on('range-selected', (rangeData) => {
  console.log('用户选择了文本：', rangeData.selectedText)
  console.log('选区位置：', rangeData.rect)
})

// 监听标记点击事件
rangeSDK.on('mark-clicked', (markData) => {
  console.log('用户点击了标记：', markData.selectedText)
})

// 监听插件注册事件
rangeSDK.on('plugin-registered', (pluginId) => {
  console.log('插件已注册：', pluginId)
})
```

### off()

```typescript
off<K extends keyof RangeSDKEvents>(event: K, listener: RangeSDKEvents[K]): void
```

移除事件监听器。

**参数：**
- `event` - 事件名称
- `listener` - 要移除的事件处理函数

**示例：**
```typescript
const handler = (rangeData) => {
  console.log('Selection changed:', rangeData.selectedText)
}

// 添加监听器
rangeSDK.on('range-selected', handler)

// 移除监听器
rangeSDK.off('range-selected', handler)
```

## 事件类型 (RangeSDKEvents)

```typescript
interface RangeSDKEvents {
  // 选区相关事件
  'range-selected': (rangeData: RangeData) => void
  'range-restored': (rangeData: RangeData) => void
  'range-cleared': () => void
  
  // 标记相关事件
  'mark-clicked': (markData: MarkData) => void
  'mark-created': (markData: MarkData) => void
  'mark-removed': (markId: string) => void
  
  // 插件相关事件
  'plugin-registered': (pluginId: string) => void
  'plugin-unregistered': (pluginId: string) => void
  
  // 性能相关事件
  'performance-warning': (warning: PerformanceWarning) => void
}
```

### 事件数据类型

#### RangeData

```typescript
interface RangeData {
  id: string                    // 唯一标识符
  startContainerPath: string    // 开始容器的 DOM 路径
  startOffset: number           // 开始位置偏移
  endContainerPath: string      // 结束容器的 DOM 路径
  endOffset: number             // 结束位置偏移
  selectedText: string          // 选中的文本内容
  pageUrl: string               // 页面 URL
  timestamp: number             // 创建时间戳
  rect: DOMRect                 // 选区的几何信息
  contextBefore?: string        // 选区前的上下文
  contextAfter?: string         // 选区后的上下文
}
```

#### MarkData

```typescript
interface MarkData {
  id: string                    // 标记 ID
  selectedText: string          // 标记的文本
  rect: DOMRect                 // 标记的几何信息
  pluginName?: string           // 创建标记的插件名称
  timestamp: number             // 创建时间
  metadata?: any                // 额外的元数据
}
```

## 性能监控

### getPerformanceMonitor()

```typescript
getPerformanceMonitor(): IPerformanceMonitor | undefined
```

获取性能监控器实例。

**返回值：**
- 性能监控器实例或 `undefined`

### getPerformanceReport()

```typescript
getPerformanceReport(startTime?: number, endTime?: number): PerformanceReport | null
```

获取性能报告。

**参数：**
- `startTime` - 可选的开始时间戳
- `endTime` - 可选的结束时间戳

**返回值：**
- 性能报告对象或 `null`

**示例：**
```typescript
// 获取完整的性能报告
const report = rangeSDK.getPerformanceReport()
if (report) {
  console.log('选区操作次数：', report.selectionCount)
  console.log('平均处理时间：', report.averageSelectionTime)
  console.log('内存使用：', report.memoryUsage)
}

// 获取指定时间范围的报告
const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
const todayReport = rangeSDK.getPerformanceReport(oneDayAgo)
```

### clearPerformanceMetrics()

```typescript
clearPerformanceMetrics(): void
```

清除性能指标数据。

**示例：**
```typescript
// 清除性能指标
rangeSDK.clearPerformanceMetrics()
```

### 性能报告类型

```typescript
interface PerformanceReport {
  // 操作统计
  selectionCount: number           // 选区操作次数
  restorationCount: number         // 恢复操作次数
  highlightCount: number           // 高亮操作次数
  
  // 时间统计
  averageSelectionTime: number     // 平均选区处理时间
  averageRestorationTime: number   // 平均恢复处理时间
  averageHighlightTime: number     // 平均高亮处理时间
  
  // 资源统计
  memoryUsage: number             // 内存使用量 (bytes)
  domNodeCount: number            // DOM 节点数量
  
  // 错误统计
  errorCount: number              // 错误次数
  warningCount: number            // 警告次数
  
  // 成功率
  restorationSuccessRate: number  // 恢复成功率 (0-1)
  
  // 时间范围
  reportStartTime: number         // 报告开始时间
  reportEndTime: number           // 报告结束时间
}
```

## 工具方法

### destroy()

```typescript
destroy(): void
```

销毁 SDK 实例，清理所有资源。

**示例：**
```typescript
// 组件销毁时清理资源
onUnmounted(() => {
  rangeSDK.destroy()
})
```

### 静态属性和方法

#### version

```typescript
static get version(): string
```

获取 SDK 版本号。

**示例：**
```typescript
console.log('Range SDK 版本：', RangeSDK.version)
```

#### create() [已废弃]

```typescript
static create(options?: RangeSDKOptions): RangeSDK
```

创建 SDK 实例的静态方法（已废弃，建议使用构造函数）。

## 错误处理

Range SDK 定义了几种常见的错误类型：

### SelectionRestorationError

```typescript
class SelectionRestorationError extends Error {
  constructor(
    public rangeData: RangeData,
    public reason: 'DOM_CHANGED' | 'ELEMENT_NOT_FOUND' | 'INVALID_RANGE'
  )
}
```

选区恢复失败时抛出的错误。

**示例：**
```typescript
try {
  await rangeSDK.restoreSelection(rangeData)
} catch (error) {
  if (error instanceof SelectionRestorationError) {
    console.warn('选区恢复失败：', error.reason)
    
    switch (error.reason) {
      case 'DOM_CHANGED':
        console.log('页面结构已发生变化')
        break
      case 'ELEMENT_NOT_FOUND':
        console.log('目标元素未找到')
        break
      case 'INVALID_RANGE':
        console.log('选区数据无效')
        break
    }
  }
}
```

### PluginLoadError

```typescript
class PluginLoadError extends Error {
  constructor(
    public pluginId: string,
    public originalError: Error
  )
}
```

插件加载失败时抛出的错误。

**示例：**
```typescript
try {
  await rangeSDK.registerPlugin(plugin)
} catch (error) {
  if (error instanceof PluginLoadError) {
    console.error('插件加载失败：', error.pluginId)
    console.error('原因：', error.originalError.message)
  }
}
```

## 类型安全支持

Range SDK 提供完整的 TypeScript 支持：

### 基础类型导入

```typescript
import type { 
  RangeSDK,
  RangeData,
  MarkData,
  RangeSDKOptions,
  RangeSDKEvents,
  PerformanceReport
} from '@ad-audit/range-sdk'
```

### 插件类型安全

```typescript
import type { 
  WithDictionary, 
  DictionaryAPI 
} from '@ad-audit/range-sdk-plugin-dictionary'

// 类型安全的插件使用
const typedSDK = rangeSDK as WithDictionary<DictionaryAPI>
await typedSDK.dictionary.search({ words: ['API'] })  // ✅ 类型检查
```

## 使用示例

### 完整的初始化示例

```typescript
import { RangeSDK } from '@ad-audit/range-sdk'
import { createDictionaryPlugin } from '@ad-audit/range-sdk-plugin-dictionary'

class MyDocumentViewer {
  private rangeSDK: RangeSDK
  
  async initialize() {
    // 1. 创建 SDK 实例
    this.rangeSDK = new RangeSDK({
      container: document.querySelector('.document-content'),
      debug: process.env.NODE_ENV === 'development',
      performance: {
        warningThreshold: 100,
        memoryWarningThreshold: 50 * 1024 * 1024
      }
    })
    
    // 2. 注册插件
    const dictionaryPlugin = createDictionaryPlugin({
      apiEndpoint: '/api/dictionary',
      highlightStyle: {
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        borderBottom: '2px solid #1890ff',
        cursor: 'pointer'
      }
    })
    
    await this.rangeSDK.registerPlugin(dictionaryPlugin)
    
    // 3. 设置事件监听
    this.setupEventListeners()
    
    // 4. 恢复之前的选区（如果有）
    await this.restorePreviousSelection()
  }
  
  private setupEventListeners() {
    // 选区变化
    this.rangeSDK.on('range-selected', (rangeData) => {
      this.handleSelectionChange(rangeData)
    })
    
    // 标记点击
    this.rangeSDK.on('mark-clicked', (markData) => {
      this.handleMarkClick(markData)
    })
    
    // 性能警告
    this.rangeSDK.on('performance-warning', (warning) => {
      console.warn('性能警告：', warning)
    })
  }
  
  private handleSelectionChange(rangeData: RangeData) {
    // 保存选区到本地存储
    localStorage.setItem('lastSelection', JSON.stringify(rangeData))
    
    // 更新 UI
    this.updateSelectionInfo(rangeData)
  }
  
  private handleMarkClick(markData: MarkData) {
    console.log('点击了标记：', markData.selectedText)
    
    // 可以在这里添加自定义逻辑
    this.showContextMenu(markData)
  }
  
  private async restorePreviousSelection() {
    const savedSelection = localStorage.getItem('lastSelection')
    if (savedSelection) {
      try {
        const rangeData = JSON.parse(savedSelection)
        await this.rangeSDK.restoreSelection(rangeData)
      } catch (error) {
        console.warn('恢复选区失败：', error)
      }
    }
  }
  
  private updateSelectionInfo(rangeData: RangeData) {
    const infoPanel = document.querySelector('.selection-info')
    if (infoPanel) {
      infoPanel.innerHTML = `
        <h4>当前选区</h4>
        <p>文本：${rangeData.selectedText}</p>
        <p>长度：${rangeData.selectedText.length} 字符</p>
        <p>位置：(${rangeData.rect.x}, ${rangeData.rect.y})</p>
      `
    }
  }
  
  private showContextMenu(markData: MarkData) {
    // 显示上下文菜单的逻辑
  }
  
  public async destroy() {
    // 获取最终性能报告
    const report = this.rangeSDK.getPerformanceReport()
    if (report) {
      console.log('最终性能报告：', report)
    }
    
    // 销毁 SDK
    this.rangeSDK.destroy()
  }
}

// 使用示例
const documentViewer = new MyDocumentViewer()
await documentViewer.initialize()
```

---

这些 API 构成了 Range SDK 的核心功能。更多高级用法请参考：
- [插件系统 API](./plugin-system.md)
- [类型参考](./type-reference.md)
- [最佳实践](../best-practices/dictionary-plugin.md)