# useSearchHighlight Hook 使用指南

`useSearchHighlight` 是 RangeSDK 的搜索高亮 Vue Hook，提供独立的文本搜索和高亮功能，可单独使用或与 `useSelectionRestore` 配合使用。

## 安装

```bash
npm install @ad-audit/range-sdk
# 或
pnpm add @ad-audit/range-sdk
```

## 快速开始

### 基础用法

```vue
<template>
  <div>
    <!-- 搜索输入 -->
    <div class="search-bar">
      <input v-model="keyword" placeholder="输入搜索关键词" @keyup.enter="handleSearch" />
      <button @click="handleSearch">搜索</button>
      <button @click="handleClear">清除</button>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="search-results">
      <div v-for="result in searchResults" :key="result.keyword" class="result-item">
        <span>{{ result.keyword }}</span>
        <span class="match-count">{{ result.matchCount }} 个匹配</span>
        <button @click="removeSearchKeyword(result.keyword)">移除</button>
      </div>
    </div>

    <!-- 文本内容区域 -->
    <div class="text-container">
      <p>这是一段示例文本，用于演示搜索高亮功能。</p>
      <p>RangeSDK 提供了强大的文本搜索和高亮能力，支持多关键词、大小写敏感、全词匹配等选项。</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useSelectionRestore, useSearchHighlight } from '@ad-audit/range-sdk/vue'

const keyword = ref('')

// 先初始化 useSelectionRestore 获取 SDK 实例
const { getSDKInstance } = useSelectionRestore({
  appId: 'my-app',
  containers: ['.text-container']
})

// 使用搜索高亮 Hook
const {
  searchKeywords,
  searchResults,
  addSearchKeyword,
  removeSearchKeyword,
  clearSearchHighlights
} = useSearchHighlight({
  getSDKInstance,
  containers: ['.text-container'],

  // 搜索高亮交互回调
  onSearchHighlightInteraction: (event) => {
    if (event.type === 'click') {
      console.log('点击搜索高亮:', event.text)
      // 可将搜索高亮保存为选区
    }
  }
})

// 搜索
const handleSearch = async () => {
  if (!keyword.value.trim()) return

  const result = await addSearchKeyword(keyword.value, 'search', {
    caseSensitive: false,
    wholeWord: false
  })

  if (result) {
    console.log(`找到 ${result.matchCount} 个匹配`)
  }

  keyword.value = ''
}

// 清除所有搜索高亮
const handleClear = () => {
  clearSearchHighlights()
}
</script>
```

---

## API 参考

### 配置选项 (UseSearchHighlightOptions)

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:----:|--------|------|
| `getSDKInstance` | `() => SelectionRestoreAPI \| null` | ✅ | - | SDK 实例获取函数 |
| `containers` | `string[]` | - | `['body']` | 搜索范围的容器选择器 |
| `selectionStyles` | `SelectionTypeConfig[]` | - | 默认搜索样式 | 自定义搜索高亮样式 |
| `onSearchHighlightInteraction` | `Function` | - | - | 搜索高亮交互回调 |

### 返回值 (UseSearchHighlightReturn)

| 属性/方法 | 类型 | 说明 |
|----------|------|------|
| `searchKeywords` | `Ref<string[]>` | 当前搜索的关键词列表 |
| `searchResults` | `Ref<SearchResultItem[]>` | 搜索结果列表（含匹配数） |
| `availableTypes` | `SelectionTypeConfig[]` | 可用的搜索高亮样式 |
| `getTypeConfig` | `(type: string) => SelectionTypeConfig \| undefined` | 获取指定类型的配置 |
| `searchAndHighlight` | `Function` | 批量搜索并高亮 |
| `addSearchKeyword` | `Function` | 添加单个搜索关键词 |
| `removeSearchKeyword` | `Function` | 移除单个搜索关键词 |
| `clearSearchHighlights` | `Function` | 清除搜索高亮 |

---

## 核心方法

### addSearchKeyword

添加单个搜索关键词并高亮：

```typescript
const addSearchKeyword: (
  keyword: string,
  type?: string,
  options?: SearchHighlightOptions
) => Promise<SearchHighlightResult | null>
```

**参数：**
- `keyword` - 搜索关键词
- `type` - 高亮类型，默认 `'search'`
- `options` - 搜索选项

**返回值：**
```typescript
interface SearchHighlightResult {
  success: boolean
  text: string
  matchCount: number
  instances: Array<{ id: string; text: string }>
}
```

**示例：**
```typescript
const result = await addSearchKeyword('关键词', 'search', {
  caseSensitive: false,
  wholeWord: false,
  maxMatches: 100
})

if (result?.success) {
  console.log(`找到 ${result.matchCount} 个匹配`)
}
```

### searchAndHighlight

批量搜索多个关键词：

```typescript
const searchAndHighlight: (
  keywords: string | string[],
  type?: string,
  options?: SearchHighlightOptions
) => Promise<SearchHighlightResult[]>
```

**示例：**
```typescript
const results = await searchAndHighlight(['关键词1', '关键词2', '关键词3'], 'search')

results.forEach(result => {
  console.log(`${result.text}: ${result.matchCount} 个匹配`)
})
```

### removeSearchKeyword

移除指定关键词的高亮：

```typescript
const removeSearchKeyword: (keyword: string) => void
```

**示例：**
```typescript
removeSearchKeyword('关键词')
```

### clearSearchHighlights

清除搜索高亮：

```typescript
const clearSearchHighlights: (keywords?: string | string[]) => void
```

**示例：**
```typescript
// 清除所有搜索高亮
clearSearchHighlights()

// 清除指定关键词
clearSearchHighlights('关键词')

// 清除多个关键词
clearSearchHighlights(['关键词1', '关键词2'])
```

---

## 搜索选项 (SearchHighlightOptions)

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `caseSensitive` | `boolean` | `false` | 是否区分大小写 |
| `wholeWord` | `boolean` | `false` | 是否全词匹配 |
| `maxMatches` | `number` | 无限制 | 最大匹配数量 |
| `filterMatches` | `Function` | - | 自定义过滤函数 |

### filterMatches 过滤函数

可用于过滤掉与已有选区重叠的匹配项：

```typescript
interface SearchMatchItem {
  /** Range 对象 */
  range: Range
  /** 是否与已有选区重叠 */
  hasOverlap: boolean
  /** 重叠的选区列表 */
  overlappedRanges: OverlappedRange[]
}

type SearchMatchFilter = (items: SearchMatchItem[], keyword: string) => SearchMatchItem[]
```

**示例：**
```typescript
// 过滤掉与已有选区重叠的匹配项
const result = await addSearchKeyword('关键词', 'search', {
  filterMatches: (items) => items.filter(item => !item.hasOverlap)
})

// 只展示前 10 个匹配
const result = await addSearchKeyword('关键词', 'search', {
  filterMatches: (items) => items.slice(0, 10)
})

// 只展示不重叠的前 5 个
const result = await addSearchKeyword('关键词', 'search', {
  filterMatches: (items) => items.filter(item => !item.hasOverlap).slice(0, 5)
})
```

---

## 事件处理

### onSearchHighlightInteraction

统一处理搜索高亮的交互事件：

```typescript
interface SearchHighlightInteractionEvent {
  /** 交互类型 */
  type: 'click' | 'hover' | 'dblclick' | 'contextmenu'
  /** 高亮文本 */
  text: string
  /** Range 对象 */
  range: Range | null
  /** 原始 DOM 事件 */
  originalEvent: MouseEvent
}
```

**示例：**
```typescript
const { ... } = useSearchHighlight({
  getSDKInstance,
  containers: ['.text-container'],

  onSearchHighlightInteraction: (event) => {
    switch (event.type) {
      case 'click':
        // 点击搜索高亮
        console.log('点击:', event.text)
        // 可将搜索高亮保存为选区
        if (event.range) {
          saveFromRange(event.range)
        }
        break

      case 'hover':
        // 悬停在搜索高亮上
        showTooltip(event.text, event.originalEvent)
        break

      case 'dblclick':
        // 双击搜索高亮
        selectAndCopy(event.text)
        break

      case 'contextmenu':
        // 右键搜索高亮
        showContextMenu(event)
        break
    }
  }
})
```

---

## 与 useSelectionRestore 配合使用

### 点击搜索高亮保存为选区

```typescript
import { useSelectionRestore, useSearchHighlight } from '@ad-audit/range-sdk/vue'

// 初始化选区管理
const {
  getSDKInstance,
  saveCurrentSelection,
  currentSelections
} = useSelectionRestore({
  appId: 'my-app',
  containers: ['.text-container']
})

// 初始化搜索高亮
const {
  addSearchKeyword,
  clearSearchHighlights
} = useSearchHighlight({
  getSDKInstance,
  containers: ['.text-container'],

  onSearchHighlightInteraction: async (event) => {
    if (event.type === 'click' && event.range) {
      // 将搜索高亮保存为选区
      const result = await saveCurrentSelection(
        undefined,    // id
        'highlight',  // type
        true,         // autoHighlight
        event.range   // fromRange
      )

      if (result) {
        console.log('已保存为选区:', result.id)
      }
    }
  }
})
```

### 加载预设数据并搜索

```typescript
const loadPresetAndSearch = async () => {
  // 1. 清除现有高亮
  clearAllSelections()
  clearSearchHighlights()

  // 2. 加载预设选区
  await restoreSelections(presetSelections)

  // 3. 搜索关键词（过滤掉与选区重叠的）
  const result = await addSearchKeyword('关键词', 'search', {
    filterMatches: (items) => items.filter(item => !item.hasOverlap)
  })

  console.log(`加载了 ${presetSelections.length} 个选区，搜索到 ${result?.matchCount || 0} 个匹配`)
}
```

---

## 自定义搜索高亮样式

通过 `selectionStyles` 参数自定义样式：

```typescript
const customSearchStyles: SelectionTypeConfig[] = [
  {
    type: 'search',
    label: '搜索高亮',
    style: {
      backgroundColor: '#ffeb3b',
      textDecorationColor: '#f57f17',
      textDecorationThickness: '2px'
    }
  },
  {
    type: 'search-important',
    label: '重要搜索',
    style: {
      backgroundColor: '#ff9800',
      color: '#ffffff',
      fontWeight: 'bold'
    }
  }
]

const { ... } = useSearchHighlight({
  getSDKInstance,
  selectionStyles: customSearchStyles
})

// 使用不同类型
await addSearchKeyword('普通关键词', 'search')
await addSearchKeyword('重要关键词', 'search-important')
```

---

## 搜索结果状态

### SearchResultItem

```typescript
interface SearchResultItem {
  /** 搜索关键词 */
  keyword: string
  /** 匹配数量 */
  matchCount: number
  /** 高亮类型 */
  type: string
  /** 高亮实例 ID 列表 */
  highlightIds: string[]
}
```

### 使用示例

```vue
<template>
  <div class="search-results-panel">
    <div class="summary">
      共搜索 {{ searchKeywords.length }} 个关键词，
      匹配 {{ totalMatches }} 处
    </div>

    <div v-for="result in searchResults" :key="result.keyword" class="result-item">
      <div class="keyword">
        <span class="type-badge" :class="result.type">
          {{ getTypeConfig(result.type)?.label }}
        </span>
        <span class="text">{{ result.keyword }}</span>
      </div>
      <div class="meta">
        <span class="count">{{ result.matchCount }} 处</span>
        <button @click="removeSearchKeyword(result.keyword)">移除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const totalMatches = computed(() => {
  return searchResults.value.reduce((sum, r) => sum + r.matchCount, 0)
})
</script>
```

---

## 最佳实践

### 1. 合理设置搜索范围

```typescript
// ✅ 好的做法：精确指定容器
containers: ['.article-content']

// ❌ 避免：在整个页面搜索
containers: ['body']
```

### 2. 使用 filterMatches 避免重叠

```typescript
// 过滤掉与已保存选区重叠的搜索结果
const result = await addSearchKeyword(keyword, 'search', {
  filterMatches: (items) => items.filter(item => !item.hasOverlap)
})
```

### 3. 限制搜索结果数量

```typescript
// 限制最大匹配数，避免性能问题
const result = await addSearchKeyword(keyword, 'search', {
  maxMatches: 100
})
```

### 4. 防抖搜索

```typescript
import { debounce } from 'lodash-es'

const debouncedSearch = debounce(async (keyword: string) => {
  if (!keyword.trim()) return
  await addSearchKeyword(keyword)
}, 300)

// 在输入时调用
watch(keyword, (value) => {
  debouncedSearch(value)
})
```

### 5. 清理旧搜索再搜索新词

```typescript
const searchNew = async (keyword: string) => {
  // 先清除之前的搜索高亮
  clearSearchHighlights()

  // 再搜索新关键词
  const result = await addSearchKeyword(keyword)
  return result
}
```

---

## 类型导出

```typescript
import type {
  UseSearchHighlightOptions,
  UseSearchHighlightReturn,
  SearchHighlightInteractionEvent,
  SearchHighlightInteractionType,
  SearchHighlightOptions,
  SearchHighlightResult,
  SearchResultItem,
  SearchMatchItem,
  SearchMatchFilter
} from '@ad-audit/range-sdk/vue'
```

---

## 相关链接

- [useSelectionRestore Hook](./use-selection-restore.md) - 选区管理功能
- [RangeSDK 核心 API](../api/core-api.md)
- [在线演示](../playground/search-highlight.md)
