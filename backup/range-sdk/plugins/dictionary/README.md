# @ad-audit/range-sdk-plugin-dictionary

词典插件，提供企业级词汇管理和展示功能。支持独立使用或集成到 Range SDK 中，提供划词触发、点击触发等多种交互方式，帮助用户快速理解专业术语。

## 功能特性

- 🎯 **多种触发方式**：支持悬浮、点击等交互触发
- 📖 **丰富的内容展示**：支持富文本、图片、链接等多种内容格式
- 🔍 **智能定位**：自动计算最佳展示位置，避免超出视口
- 🎨 **高度可定制**：支持自定义样式、高亮效果等扩展方式
- 🛠️ **自定义组件**：支持完全自定义的卡片UI组件
- ⚡ **性能优化**：内置缓存机制，减少重复请求
- 📱 **响应式设计**：适配各种屏幕尺寸
- 🔌 **双模式支持**：既可独立使用，也可集成到 Range SDK
- 🚀 **现代化Hook**：基于Composition API的useDictionary Hook

## 安装

```bash
npm install @ad-audit/range-sdk-plugin-dictionary
# 或者
yarn add @ad-audit/range-sdk-plugin-dictionary
# 或者
pnpm add @ad-audit/range-sdk-plugin-dictionary
```

## 使用方式

### 方式一：使用现代化Hook（推荐）

```typescript
import { useDictionary, type CustomCardComponentProps } from '@ad-audit/range-sdk-plugin-dictionary'

// 基础用法
const dictionary = useDictionary({
  appid: 1000,
  container: '#content', // 容器选择器或DOM元素
  events: {
    onHighlightComplete: (words) => console.log('高亮词汇:', words),
    onSearchComplete: (results) => console.log('搜索结果:', results)
  }
})

// 初始化并搜索词汇
await dictionary.initDictionary({
  content: '这段文本包含需要高亮的关键词'
})

// 高亮关键词
await dictionary.highlightKeywords()
```

#### 使用自定义卡片组件

```typescript
import { defineComponent } from 'vue'

// 创建自定义卡片组件
const MyCustomCard = defineComponent<CustomCardComponentProps>({
  props: ['keywords', 'dataLoader'],
  emits: ['close', 'clickTag', 'clickLarkDoc', 'clickWebLink', 'tabChange'],
  template: `
    <div class="my-custom-card">
      <h3>自定义词典卡片</h3>
      <div v-for="keyword in keywords" :key="keyword">
        {{ keyword }}
      </div>
      <button @click="$emit('close')">关闭</button>
    </div>
  `
})

// 使用自定义组件
const dictionary = useDictionary({
  appid: 1000,
  container: '#content',
  customCardComponent: MyCustomCard, // 传入自定义组件
  highlightStyle: {
    color: '#007bff',
    backgroundColor: '#e7f3ff'
  }
})
```

### 方式二：类型安全的集成

```typescript
import { createRangeSDK } from '@ad-audit/range-sdk'
import { 
  createDictionaryPlugin,
  type RangeSDKWithDictionary,
  type DictionaryAPI 
} from '@ad-audit/range-sdk-plugin-dictionary'

// 创建 Range SDK 实例
const rangeSDK = createRangeSDK({
  container: document.body,
  debug: true
})

// 创建词典插件
const dictionaryPlugin = createDictionaryPlugin({
  mockData: {
    'API': {
      id: 1,
      word: 'API',
      content: '应用程序编程接口（Application Programming Interface）',
      tags: ['技术', '编程'],
      owners: ['tech@company.com']
    }
  },
  highlightStyle: {
    borderBottom: '2px solid #1890ff',
    cursor: 'pointer'
  },
  autoHighlight: true
})

// 注册插件，返回带类型的 SDK 实例
const sdkWithDictionary: RangeSDKWithDictionary<DictionaryAPI> = await rangeSDK.registerPlugin(dictionaryPlugin)

// ✅ 现在有完整的 TypeScript 类型提示！
await sdkWithDictionary.dictionary.search({
  words: ['API', 'SDK'],
  container: document.body
})

// ✅ 所有方法都有智能提示
sdkWithDictionary.dictionary.clearHighlights()
const entry = await sdkWithDictionary.dictionary.getEntry('API')
```

### 方式二：传统集成方式

```typescript
import { RangeSDK } from '@ad-audit/range-sdk'
import { createDictionaryPlugin, type DictionaryAPI } from '@ad-audit/range-sdk-plugin-dictionary'

const rangeSDK = new RangeSDK()
const dictionaryPlugin = createDictionaryPlugin({ /* config */ })

await rangeSDK.registerPlugin(dictionaryPlugin)

// 需要类型断言来获得类型提示
const typedSDK = rangeSDK as typeof rangeSDK & { dictionary: DictionaryAPI }
await typedSDK.dictionary.search({ words: ['API'] })
```

## 单个词条触发

### 1. 编程式触发

```typescript
// 直接显示词典卡片
const targetElement = document.querySelector('.dictionary-term')
await dictionaryPlugin.show(targetElement, 'CORE')

// 隐藏词典卡片
dictionaryPlugin.hide()
```

### 2. 标记式触发

```html
<!-- 在 HTML 中标记词典词条 -->
<span class="dictionary-term" data-dictionary="CORE">CORE方法论</span>
```

```typescript
// 自动绑定所有标记的词条
document.querySelectorAll('.dictionary-term').forEach(element => {
  const keyword = element.dataset.dictionary
  
  element.addEventListener('click', () => {
    dictionaryPlugin.show(element, keyword)
  })
})
```

## 批量词条触发

### 1. 使用 Range SDK 高亮功能

```typescript
// 批量高亮并绑定词典功能
const keywords = ['CORE', 'API', '函数', '词典']

// 高亮所有匹配的关键词
for (const keyword of keywords) {
  await sdk.highlightTextInContainers(
    keyword,
    'dictionary', // 高亮类型
    ['.content-area'], // 搜索容器
    {
      caseSensitive: false,
      wholeWord: false,
      maxMatches: 100,
      onInteraction: (event) => {
        if (event.type === 'click') {
          // 点击时显示词典
          dictionaryPlugin.show(event.target, event.selection.text)
        }
      }
    }
  )
}
```

### 2. 自动扫描和绑定

```typescript
// 创建自动扫描器
class DictionaryScanner {
  constructor(private plugin: DictionaryPlugin, private keywords: string[]) {}
  
  // 扫描并绑定容器内的所有关键词
  scan(container: HTMLElement) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )
    
    let node
    while (node = walker.nextNode()) {
      const text = node.textContent || ''
      
      for (const keyword of this.keywords) {
        if (text.includes(keyword)) {
          // 包装关键词
          const span = document.createElement('span')
          span.className = 'dictionary-highlight'
          span.textContent = keyword
          span.style.cssText = 'color: #3370ff; cursor: pointer; border-bottom: 1px dashed #3370ff;'
          
          // 绑定点击事件
          span.addEventListener('click', () => {
            this.plugin.show(span, keyword)
          })
          
          // 替换文本节点
          const range = document.createRange()
          const index = text.indexOf(keyword)
          range.setStart(node, index)
          range.setEnd(node, index + keyword.length)
          range.surroundContents(span)
        }
      }
    }
  }
}

// 使用扫描器
const scanner = new DictionaryScanner(dictionaryPlugin, ['CORE', 'API', '函数'])
scanner.scan(document.querySelector('.article-content'))
```

## 高级配置

### 自定义数据源

```typescript
const dictionaryPlugin = createDictionaryPlugin({
  dataSource: {
    async search(keyword: string) {
      // 支持多数据源聚合
      const [localData, remoteData] = await Promise.all([
        searchLocalDictionary(keyword),
        searchRemoteDictionary(keyword)
      ])
      
      return [...localData, ...remoteData]
    },
    
    async getEntry(id: number) {
      // 支持详情扩展
      const entry = await fetchEntry(id)
      
      // 增强数据
      if (entry.owners) {
        entry.ownerDetails = await fetchUserDetails(entry.owners)
      }
      
      return entry
    }
  }
})
```

### 自定义触发逻辑

```typescript
// 创建高级触发管理器
class DictionaryTriggerManager {
  private currentTarget: HTMLElement | null = null
  
  constructor(private plugin: DictionaryPlugin) {}
  
  // 智能触发（根据用户行为决定）
  bindSmartTrigger(element: HTMLElement, keyword: string) {
    let clickCount = 0
    let hoverTimer: number | null = null
    
    // 悬浮预览
    element.addEventListener('mouseenter', () => {
      hoverTimer = window.setTimeout(() => {
        if (clickCount === 0) {
          this.plugin.show(element, keyword)
        }
      }, 1000)
    })
    
    element.addEventListener('mouseleave', () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer)
      }
    })
    
    // 点击确认
    element.addEventListener('click', () => {
      clickCount++
      if (hoverTimer) {
        clearTimeout(hoverTimer)
      }
      this.plugin.show(element, keyword)
    })
  }
}
```

### 自定义卡片内容

```vue
<template>
  <DictionaryCard
    :entry="entry"
    :loading="loading"
    :error="error"
    @close="onClose"
  >
    <!-- 自定义头部 -->
    <template #header="{ entry }">
      <div class="custom-header">
        <img :src="entry.icon" class="entry-icon" />
        <h3>{{ entry.word }}</h3>
        <span class="entry-type">{{ entry.type }}</span>
      </div>
    </template>
    
    <!-- 自定义内容 -->
    <template #content="{ entry }">
      <div class="custom-content">
        <video v-if="entry.videoUrl" :src="entry.videoUrl" controls />
        <div v-html="entry.content"></div>
      </div>
    </template>
    
    <!-- 自定义底部 -->
    <template #footer="{ entry }">
      <div class="custom-footer">
        <button @click="share(entry)">分享</button>
        <button @click="collect(entry)">收藏</button>
      </div>
    </template>
  </DictionaryCard>
</template>
```

## API 参考

### DictionaryPlugin

```typescript
interface DictionaryPlugin {
  // 显示词典卡片
  show(target: HTMLElement, keyword: string): Promise<void>
  
  // 隐藏词典卡片
  hide(): void
  
  // 更新配置
  updateOptions(options: Partial<DictionaryPluginOptions>): void
  
  // 清除缓存
  clearCache(): void
  
  // 销毁插件
  destroy(): void
}
```

### DictionaryPluginOptions

```typescript
interface DictionaryPluginOptions {
  // 数据源
  dataSource?: DictionaryDataSource
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
}
```

### DictionaryEntry

```typescript
interface DictionaryEntry {
  id: number
  word: string                    // 词条名称
  en_word?: string               // 英文名称
  content: string                // 富文本内容
  alias_words?: string[]         // 别名
  tags?: string[]                // 标签
  owners?: string[]              // 负责人邮箱
  lark_doc_links?: Array<{       // 飞书文档
    id: string
    title: string
    url: string
  }>
  web_links?: Array<{            // 外部链接
    id: string
    title: string
    url: string
  }>
  image_links?: string[]         // 图片链接
  created_at?: string
  updated_at?: string
}
```

### 事件回调

```typescript
// 词典卡片事件
interface DictionaryCardEvents {
  close: () => void                          // 关闭卡片
  clickOwner: (email: string) => void        // 点击负责人
  clickLarkDoc: (doc: any) => void          // 点击飞书文档
  clickWebLink: (link: any) => void         // 点击外部链接
  clickTag: (tag: string) => void           // 点击标签
  editEntry: (keyword: string) => void      // 编辑词条
  gotoDictionary: () => void                // 跳转词典首页
  like: (id: number) => void                // 点赞（仅首次触发）
}
```

## 最佳实践

### 1. 性能优化

```typescript
// 批量处理，避免频繁 DOM 操作
const keywords = ['CORE', 'API', '函数']
const fragment = document.createDocumentFragment()

// 使用防抖优化频繁触发
const debouncedShow = debounce((target, keyword) => {
  dictionaryPlugin.show(target, keyword)
}, 300)
```

### 2. 错误处理

```typescript
const dictionaryPlugin = createDictionaryPlugin({
  dataSource: {
    async search(keyword: string) {
      try {
        return await fetchDictionary(keyword)
      } catch (error) {
        console.error('词典搜索失败:', error)
        // 返回空数组或错误提示
        return []
      }
    }
  }
})
```

### 3. 国际化支持

```typescript
const dictionaryPlugin = createDictionaryPlugin({
  dataSource: {
    async search(keyword: string) {
      const locale = getCurrentLocale()
      return await fetchDictionary(keyword, { locale })
    }
  }
})
```

## 常见问题

### Q: 如何处理大量词条的性能问题？

A: 建议使用以下策略：
1. 启用缓存机制
2. 使用虚拟滚动展示长列表
3. 懒加载词条内容
4. 限制同时高亮的词条数量

### Q: 如何自定义词典卡片样式？

A: 可以通过 `customClass` 选项或使用深度选择器覆盖默认样式：

```css
.my-dictionary-card :deep(.dictionary-header) {
  background: #f0f0f0;
}
```

### Q: 如何实现词条权限控制？

A: 在数据源中实现权限检查：

```typescript
async search(keyword: string) {
  const user = getCurrentUser()
  const entries = await fetchDictionary(keyword)
  
  // 过滤用户有权限查看的词条
  return entries.filter(entry => 
    hasPermission(user, entry)
  )
}
```

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础词典功能
- 支持多种触发方式
- 支持自定义数据源
