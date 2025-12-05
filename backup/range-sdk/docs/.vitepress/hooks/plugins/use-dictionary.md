# useDictionary Hook 使用指南

## 概述

用于在 Range SDK 中集成和管理词典功能。它提供了文本高亮、词典卡片显示、搜索等完整的词典功能，支持自定义样式和交互行为。

## 基本用法

### 导入和基础配置

```typescript
import { useDictionary } from '@ad-audit/range-sdk/plugins/dictionary/hooks/use-dictionary'
import { RangeSdkAppId } from '@ad-audit/range-sdk'
import '@ad-audit/range-sdk-plugin-dictionary/dist/style.css';

// 基础用法
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content-area', // 支持CSS选择器
  useMock: ['CORE', '函数', 'API'], // 使用模拟数据的词汇列表
  triggerMode: 'hover', // 悬停显示词典卡片
  caseSensitive: false, // 不区分大小写匹配
  autoInit: false
})
```

### 使用 Vue 模板引用

```vue
<template>
  <div ref="contentRef" class="dictionary-content">
    <!-- 文本内容 -->
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDictionary } from '@ad-audit/range-sdk/plugins/dictionary/hooks/use-dictionary'

const contentRef = ref<HTMLElement>()

const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: contentRef, // 直接传入Vue ref
  useMock: ['词典', '技术', '编程'],
  triggerMode: 'click', // 点击显示词典卡片
  caseSensitive: true, // 区分大小写匹配
  autoInit: true
})
</script>
```

## 配置选项

### UseDictionaryOptions 接口

```typescript
type TriggerMode = 'hover' | 'click'

interface UseDictionaryOptions {
  // 必需参数
  appid: RangeSdkAppId | number        // 应用ID
  container: Element | HTMLElement | string | null | undefined // 容器元素

  // 可选参数
  autoInit?: boolean                   // 是否自动初始化，默认 false
  useMock?: string[]                   // 使用模拟数据的词汇列表
  mockData?: Record<string, any>       // 自定义模拟数据
  highlightStyle?: HighlightStyle      // 自定义高亮样式
  triggerMode?: TriggerMode            // 触发方式：'hover'(悬停) 或 'click'(点击)，默认 'hover'
  caseSensitive?: boolean              // 是否区分大小写，默认 false
  events?: DictionaryEvents            // 事件回调
  debug?: boolean                      // 是否启用调试模式，默认 false

  // 自定义卡片相关
  customCardComponent?: Component      // 自定义卡片组件
  customCardComponentProps?: Record<string, any> // 自定义组件属性
  disableDefaultRequest?: boolean      // 禁用默认网络请求，默认 false
}
```

### 高亮样式配置

```typescript
interface HighlightStyle {
  color?: string                    // 文字颜色
  borderBottom?: string            // 下边框样式
  cursor?: string                  // 鼠标样式
  hoverBackgroundColor?: string    // 悬浮背景色
  hoverBorderBottom?: string       // 悬浮时下边框样式
  transition?: string              // 过渡动画
  padding?: string                 // 内边距
  lineHeight?: string             // 行高
}

// 默认样式示例
const customHighlightStyle = {
  color: '#3370ff',
  borderBottom: '1px dashed #3370ff',
  cursor: 'pointer',
  hoverBackgroundColor: '#e8f0ff',
  hoverBorderBottom: '2px solid #2860e0',
  transition: 'all 0.2s ease',
  padding: '0 2px',
  lineHeight: '1.5'
}
```

### 事件回调配置

```typescript
interface DictionaryEvents {
  onHighlightComplete?: (words: string[]) => void  // 高亮完成回调
  onSearchComplete?: (results: WordData[]) => void // 搜索完成回调
  onError?: (error: Error) => void                 // 错误处理回调
}

// 使用示例
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  events: {
    onHighlightComplete: (words) => {
      console.log('高亮完成的词汇:', words)
    },
    onSearchComplete: (results) => {
      console.log('搜索结果:', results)
    },
    onError: (error) => {
      console.error('词典错误:', error)
    }
  }
})
```

## 返回值和方法

### UseDictionaryReturn 接口

```typescript
interface UseDictionaryReturn {
  // 响应式状态
  rangeSDK: Ref<RangeSDKWithDictionary<DictionaryAPI> | null>
  isReady: Ref<boolean>              // 词典是否已就绪
  matchedWords: Ref<WordData[]>      // 匹配的词汇数据

  // 方法
  initDictionary: (options: { content?: string; words?: SimpleWord[] }) => Promise<void>
  highlightKeywords: (container?: string) => Promise<void>
  showDictionary: (target: HTMLElement) => void
  hideDictionary: () => void
  clearHighlights: () => void
}
```

### 核心方法详解

#### initDictionary - 初始化词典

```typescript
// 使用内容搜索
await dictionary.initDictionary({
  content: '这是包含CORE方法论和API接口的文本内容'
})

// 使用词汇列表
await dictionary.initDictionary({
  words: [
    { word: 'CORE', appid: RangeSdkAppId.RANGE_SDK },
    { word: '函数', appid: RangeSdkAppId.RANGE_SDK },
    { word: 'API', appid: RangeSdkAppId.RANGE_SDK }
  ]
})

// 只传入字符串（向后兼容）
await dictionary.initDictionary({ content: '要搜索的文本' })
```

#### highlightKeywords - 高亮关键词

```typescript
// 在默认容器中高亮
await dictionary.highlightKeywords()

// 在指定容器中高亮
await dictionary.highlightKeywords('.specific-container')
```

#### clearHighlights - 清除高亮

```typescript
// 清除所有高亮效果
dictionary.clearHighlights()
```

## 使用场景和示例

### 场景1: 基础文档词典

适用于需要为技术文档添加词汇解释功能的场景。

```vue
<template>
  <div class="document-container">
    <div ref="contentArea" class="content">
      <p>Range SDK 提供了强大的<strong>API</strong>接口，支持<strong>函数</strong>调用。</p>
    </div>

    <div class="controls">
      <button @click="initWithContent" :disabled="!isReady">初始化词典</button>
      <button @click="clearAll">清除高亮</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDictionary } from '@ad-audit/range-sdk/plugins/dictionary/hooks/use-dictionary'

const contentArea = ref()

const { isReady, initDictionary, clearHighlights } = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: contentArea,
  useMock: ['API', '函数', 'SDK'],
  debug: true,
  events: {
    onHighlightComplete: (words) => console.log('已高亮:', words)
  }
})

const initWithContent = async () => {
  await initDictionary({
    content: contentArea.value?.textContent || ''
  })
}

const clearAll = () => {
  clearHighlights()
}
</script>
```

### 场景2: 动态搜索功能

适用于需要用户输入搜索词汇的交互场景。

```vue
<template>
  <div class="search-demo">
    <div class="search-bar">
      <input
        v-model="searchText"
        placeholder="输入要搜索的词汇"
        @keyup.enter="handleSearch"
      >
      <button @click="handleSearch" :disabled="!searchText.trim()">搜索</button>
    </div>

    <div ref="contentRef" class="search-content">
      <p>在这里搜索词汇：CORE方法论、API接口、函数编程等专业术语。</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDictionary } from '@ad-audit/range-sdk/plugins/dictionary/hooks/use-dictionary'

const searchText = ref('')
const contentRef = ref()

const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: contentRef,
  disableDefaultRequest: true, // 禁用默认请求，使用自定义搜索
  events: {
    onSearchComplete: (results) => {
      console.log(`找到 ${results.length} 个匹配结果`)
    }
  }
})

const handleSearch = async () => {
  const text = searchText.value.trim()
  if (!text) return

  await dictionary.initDictionary({
    words: [{ word: text, appid: RangeSdkAppId.RANGE_SDK }]
  })
}
</script>
```

### 场景3: 触发方式配置

适用于需要不同交互方式的场景。

```vue
<template>
  <div class="trigger-demo">
    <div class="mode-selector">
      <label>
        <input type="radio" v-model="triggerMode" value="hover">
        悬停触发
      </label>
      <label>
        <input type="radio" v-model="triggerMode" value="click">
        点击触发
      </label>
    </div>

    <div ref="contentRef" class="trigger-content">
      <h3>触发方式演示</h3>
      <p>
        当前模式：{{ triggerMode === 'hover' ? '悬停显示' : '点击显示' }}
      </p>
      <p>
        试试与这些词汇交互：<strong>CORE</strong>、<strong>API</strong>、<strong>函数</strong>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDictionary } from '@ad-audit/range-sdk/plugins/dictionary/hooks/use-dictionary'

const triggerMode = ref('hover')
const contentRef = ref()

// 创建词典实例
let dictionary = null

// 监听触发方式变化，重新初始化
watch(triggerMode, async (newMode) => {
  // 清理旧实例
  if (dictionary) {
    dictionary.clearHighlights()
  }

  // 创建新实例
  dictionary = useDictionary({
    appid: RangeSdkAppId.RANGE_SDK,
    container: contentRef,
    useMock: ['CORE', 'API', '函数'],
    triggerMode: newMode,
    events: {
      onHighlightComplete: (words) => {
        console.log(`${newMode} 模式高亮完成:`, words)
      }
    }
  })

  // 重新初始化
  await dictionary.initDictionary({
    words: [
      { word: 'CORE', appid: RangeSdkAppId.RANGE_SDK },
      { word: 'API', appid: RangeSdkAppId.RANGE_SDK },
      { word: '函数', appid: RangeSdkAppId.RANGE_SDK }
    ]
  })
}, { immediate: true })
</script>

<style scoped>
.mode-selector {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.mode-selector label {
  margin-right: 16px;
  cursor: pointer;
}

.trigger-content {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}
</style>
```

### 场景4: 自定义卡片组件

适用于需要自定义词典卡片UI的场景。

```vue
<template>
  <div ref="containerRef" class="custom-dictionary">
    <p>点击高亮词汇查看自定义卡片效果。</p>
  </div>
</template>

<script setup>
import { defineComponent, ref } from 'vue'

// 自定义卡片组件
const CustomDictionaryCard = defineComponent({
  props: {
    keywords: Array,
    dataLoader: Function
  },
  setup(props) {
    return () => (
      <div class="custom-card">
        <h3>自定义词典卡片</h3>
        <p>关键词: {props.keywords?.join(', ')}</p>
        <div class="card-actions">
          <button>查看详情</button>
          <button>添加收藏</button>
        </div>
      </div>
    )
  }
})

const containerRef = ref()

const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: containerRef,
  useMock: ['自定义', '卡片', '组件'],
  customCardComponent: CustomDictionaryCard,
  customCardComponentProps: {
    theme: 'dark',
    showActions: true
  },
  autoInit: true
})
</script>
```

## 高级特性

### 大小写敏感配置

词典插件支持配置是否区分大小写进行文本匹配。

#### 不区分大小写 (caseSensitive: false)

```typescript
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  caseSensitive: false, // 默认值
  useMock: ['API', 'QA', 'JavaScript']
})
```

**特点：**
- 搜索 "API" 会同时匹配 "API"、"api"、"Api"
- 适合需要覆盖各种大小写变体的场景
- 提供更宽松的匹配策略，减少遗漏

#### 区分大小写 (caseSensitive: true)

```typescript
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  caseSensitive: true,
  useMock: ['API', 'api', 'QA', 'qa']
})
```

**特点：**
- 搜索 "API" 只会匹配完全相同的 "API"
- 不同大小写的词汇被视为不同的词条
- 适合对大小写有严格要求的技术文档

#### 动态切换大小写敏感

```typescript
const { rangeSDK } = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  caseSensitive: false
})

// 运行时切换大小写敏感
const switchToCaseSensitive = () => {
  rangeSDK.value?.dictionary.setCaseSensitive(true)
}

const switchToCaseInsensitive = () => {
  rangeSDK.value?.dictionary.setCaseSensitive(false)
}
```

#### 使用示例：大小写敏感测试

```vue
<template>
  <div class="case-sensitivity-demo">
    <div class="controls">
      <label>
        <input type="checkbox" v-model="caseSensitive" @change="updateCaseSensitive">
        区分大小写
      </label>
      <input
        v-model="searchText"
        placeholder="输入词汇 (如: API, api, Api)"
        @keyup.enter="handleSearch"
      >
      <button @click="handleSearch">搜索</button>
      <button @click="clearHighlights">清除高亮</button>
    </div>

    <div ref="contentRef" class="test-content">
      <p>
        测试文本包含不同大小写的词汇：
        <strong>API</strong>、<strong>api</strong>、<strong>Api</strong>、
        <strong>QA</strong>、<strong>qa</strong>、<strong>Qa</strong>
      </p>
      <p>
        当前模式：{{ caseSensitive ? '区分大小写' : '不区分大小写' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDictionary } from '@ad-audit/range-sdk/plugins/dictionary/hooks/use-dictionary'
import { RangeSdkAppId } from '@ad-audit/range-sdk'

const caseSensitive = ref(false)
const searchText = ref('')
const contentRef = ref()

const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: contentRef,
  caseSensitive: caseSensitive.value,
  useMock: ['API', 'api', 'Api', 'QA', 'qa', 'Qa'],
  debug: true
})

const updateCaseSensitive = () => {
  dictionary.rangeSDK.value?.dictionary.setCaseSensitive(caseSensitive.value)
  console.log(`切换到${caseSensitive.value ? '区分' : '不区分'}大小写模式`)
}

const handleSearch = async () => {
  const text = searchText.value.trim()
  if (!text) return

  await dictionary.initDictionary({
    words: [{ word: text, appid: RangeSdkAppId.RANGE_SDK }]
  })
}

const clearHighlights = () => {
  dictionary.clearHighlights()
}
</script>
```

### 触发方式配置

词典插件支持两种触发方式来显示词典卡片：

#### 悬停触发 (hover)

```typescript
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  triggerMode: 'hover', // 默认值
  useMock: ['词汇1', '词汇2']
})
```

**特点：**
- 鼠标悬停在高亮词汇上时立即显示卡片
- 适合快速查看词汇信息的场景
- 用户体验更流畅，无需点击操作

#### 点击触发 (click)

```typescript
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  triggerMode: 'click',
  useMock: ['词汇1', '词汇2']
})
```

**特点：**
- 需要点击高亮词汇才显示卡片
- 避免误触发，更精确的交互控制
- 适合移动端或需要明确用户意图的场景

#### 动态切换触发方式

```typescript
const { rangeSDK } = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  triggerMode: 'hover'
})

// 运行时切换触发方式
const switchToClick = () => {
  rangeSDK.value?.dictionary.setTriggerMode('click')
}

const switchToHover = () => {
  rangeSDK.value?.dictionary.setTriggerMode('hover')
}
```

### Mock 数据模式

使用 `useMock` 参数可以快速创建演示环境，无需真实的后端服务。

```typescript
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  useMock: ['CORE', '函数', 'API', '词典'],
  // 系统会自动为这些词汇生成模拟数据
  debug: true
})
```

### 禁用默认请求

当需要完全自定义数据获取逻辑时，可以使用 `disableDefaultRequest`。

```typescript
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  disableDefaultRequest: true,
  customCardComponent: MyCustomCard,
  events: {
    onSearchComplete: async (results) => {
      // 在这里实现自定义的数据获取逻辑
      console.log('词汇匹配完成，开始自定义数据处理')
    }
  }
})
```

### 生命周期管理

Hook 自动管理 Range SDK 的生命周期，包括初始化和销毁。

```typescript
import { onMounted, onUnmounted } from 'vue'

const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  autoInit: false
})

onMounted(async () => {
  // 组件挂载后手动初始化
  await dictionary.initDictionary({
    words: [{ word: '初始化', appid: RangeSdkAppId.RANGE_SDK }]
  })
})

// Hook 会在 onUnmounted 时自动销毁 SDK 实例
```

## 最佳实践

### 1. 容器元素处理

```typescript
// ✅ 推荐：使用 CSS 选择器
const dictionary = useDictionary({
  container: '.dictionary-content',
  // ...其他配置
})

// ✅ 推荐：使用 Vue ref
const contentRef = ref<HTMLElement>()
const dictionary = useDictionary({
  container: contentRef,
  // ...其他配置
})

// ❌ 避免：传入 null 或 undefined 会导致错误
```

### 2. 错误处理

```typescript
const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  events: {
    onError: (error) => {
      console.error('词典功能出错:', error)
      // 显示用户友好的错误提示
      showErrorMessage('词典功能暂时不可用，请稍后重试')
    }
  }
})
```

### 3. 性能优化

```typescript
// 使用 computed 和 watch 优化响应式更新
import { computed, watch } from 'vue'

const dictionary = useDictionary({
  appid: RangeSdkAppId.RANGE_SDK,
  container: '.content',
  debug: process.env.NODE_ENV === 'development'
})

// 监听就绪状态
watch(dictionary.isReady, (ready) => {
  if (ready) {
    console.log('词典已就绪，可以开始使用')
  }
})

// 计算匹配词汇数量
const matchedCount = computed(() => dictionary.matchedWords.value.length)
```

### 4. 触发方式选择

```typescript
// ✅ 推荐：桌面端使用悬停触发，体验更流畅
const desktopDictionary = useDictionary({
  triggerMode: 'hover',
  // ...其他配置
})

// ✅ 推荐：移动端使用点击触发，避免误触
const mobileDictionary = useDictionary({
  triggerMode: 'click',
  // ...其他配置
})

// ✅ 响应式触发方式选择
const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent)
const dictionary = useDictionary({
  triggerMode: isMobile ? 'click' : 'hover',
  // ...其他配置
})
```

### 5. 批量操作

```typescript
// 批量高亮多个词汇
const batchHighlight = async (words: string[]) => {
  await dictionary.initDictionary({
    words: words.map(word => ({
      word,
      appid: RangeSdkAppId.RANGE_SDK
    }))
  })
}

// 使用示例
await batchHighlight(['CORE', '函数', 'API', '词典'])
```

## 注意事项

1. **容器元素**: 确保容器元素在 Hook 初始化前已存在于 DOM 中
2. **应用ID**: 不同应用使用不同的 `appid` 以避免数据冲突
3. **内存管理**: Hook 会自动处理 SDK 实例的销毁，无需手动清理
4. **异步操作**: 所有初始化和搜索操作都是异步的，需要使用 `await` 等待完成
5. **调试模式**: 生产环境建议关闭 `debug` 以提高性能
6. **触发方式**:
   - `hover` 模式在移动端可能不适用，建议移动端使用 `click` 模式
   - 切换触发方式后需要重新初始化词典以使配置生效
   - 可以通过 `setTriggerMode()` 方法动态切换触发方式
7. **大小写敏感**:
   - 默认为 `false`（不区分大小写），适合大多数业务场景
   - 设置为 `true` 时，"API" 和 "api" 会被视为不同的词汇
   - 可以通过 `setCaseSensitive()` 方法动态切换大小写敏感模式
   - 建议根据文档类型选择：技术文档可能需要区分大小写，而普通文档可以不区分

## 相关文档

- [Range SDK 核心文档](../core/range-sdk.md)
- [插件系统架构](../architecture/plugin-system.md)
- [词典插件 API 参考](../api/dictionary-plugin.md)