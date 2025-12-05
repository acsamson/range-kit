# Range SDK Vue Hooks 快速接入指南

> 本文档帮助你快速集成 Range SDK 的 Vue Hooks，实现选区保存、恢复、搜索高亮和导航功能。

## 安装

```bash
npm install @ad-audit/range-sdk
```

## 核心 Hooks 概览

| Hook | 功能 | 依赖 |
|------|------|------|
| `useSelectionRestore` | 选区保存/恢复/高亮/导航 | 独立使用 |
| `useSearchHighlight` | 关键词搜索高亮 | 需要 `getSDKInstance` |

---

## 一、useSelectionRestore 选区恢复

### 基础用法

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useSelectionRestore } from '@ad-audit/range-sdk/vue'

const {
  // 状态
  isInitialized,     // 是否初始化完成
  currentSelections, // 当前所有选区
  isLoading,         // 加载中
  error,             // 错误信息

  // 核心方法
  saveCurrentSelection,    // 保存当前选区
  restoreSelections,       // 恢复选区列表
  deleteSelection,         // 删除单个选区
  clearAllSelections,      // 清除所有高亮
  clearAllSelectionsData,  // 清空所有数据

  // 导航
  navigation,

  // SDK 实例
  getSDKInstance
} = useSelectionRestore({
  appId: 'my-app',
  containers: ['.content-container'], // 选区生效范围

  // 选区动作回调（统一入口）
  onSelectionAction: (event) => {
    switch (event.type) {
      case 'created':
        // 用户划选了文本，显示保存气泡
        console.log('新选区:', event.text, event.position)
        break
      case 'click':
        // 点击已保存选区，显示操作菜单
        console.log('点击选区:', event.savedSelectionId)
        break
      case 'cleared':
        // 用户点击空白处，隐藏气泡
        break
    }
  },

  // 可选回调
  onSelectionSaved: (selection) => console.log('已保存:', selection.id),
  onSelectionDeleted: (id) => console.log('已删除:', id)
})
</script>

<template>
  <div class="content-container">
    <!-- 你的内容 -->
  </div>
</template>
```

### 保存选区

```ts
// 保存当前浏览器选区
const saved = await saveCurrentSelection(
  undefined,  // id（可选，自动生成）
  'highlight', // type（可选，默认 'default'）
  true        // autoHighlight（可选，默认 true）
)

// 从指定 Range 保存
const range = window.getSelection()?.getRangeAt(0)
if (range) {
  await saveCurrentSelection(undefined, 'comment', true, range)
}
```

### 恢复选区

```ts
// 恢复并高亮选区列表
await restoreSelections(savedSelections, true) // 第二个参数：是否自动滚动

// 删除选区
await deleteSelection(selectionId)

// 清除所有高亮（保留数据）
clearAllSelections()

// 清空所有数据
await clearAllSelectionsData()
```

### 导航功能

```ts
const { navigation } = useSelectionRestore({ ... })

// 导航状态
navigation.currentIndex  // 当前索引
navigation.total         // 高亮总数

// 导航方法
navigation.goToNext()    // 下一个
navigation.goToPrev()    // 上一个
navigation.goToIndex(5)  // 跳转指定索引
navigation.goToId(id)    // 跳转指定 ID
navigation.reset()       // 重置导航
```

### 自定义选区样式

```ts
import type { SelectionTypeConfig } from '@ad-audit/range-sdk/vue'

const customStyles: SelectionTypeConfig[] = [
  {
    type: 'highlight',
    label: '高亮',
    style: {
      backgroundColor: '#ffeb3b',
      textDecoration: 'none'
    }
  },
  {
    type: 'comment',
    label: '批注',
    style: {
      backgroundColor: '#e3f2fd',
      textDecoration: 'underline',
      textDecorationColor: '#2196f3'
    }
  }
]

useSelectionRestore({
  appId: 'my-app',
  selectionStyles: customStyles,
  // ...
})
```

---

## 二、useSearchHighlight 搜索高亮

> 需配合 `useSelectionRestore` 使用，通过 `getSDKInstance` 获取 SDK 实例。

### 基础用法

```vue
<script setup lang="ts">
import { useSelectionRestore, useSearchHighlight } from '@ad-audit/range-sdk/vue'

// 先初始化选区恢复
const { getSDKInstance } = useSelectionRestore({
  appId: 'my-app',
  containers: ['.content-container']
})

// 再初始化搜索高亮
const {
  searchKeywords,     // 当前搜索关键词列表
  searchResults,      // 搜索结果（含匹配数）
  addSearchKeyword,   // 添加关键词
  removeSearchKeyword,// 移除关键词
  clearSearchHighlights, // 清除搜索高亮
  searchAndHighlight  // 批量搜索
} = useSearchHighlight({
  getSDKInstance,
  containers: ['.content-container'],

  // 搜索高亮交互回调
  onSearchHighlightInteraction: (event) => {
    console.log('点击搜索结果:', event.text)
  }
})
</script>
```

### 搜索与高亮

```ts
// 添加单个关键词
const result = await addSearchKeyword('关键词', 'search')
console.log('匹配数:', result?.matchCount)

// 批量搜索
const results = await searchAndHighlight(
  ['词语A', '词语B'],
  'search', // 高亮类型
  {
    caseSensitive: false, // 区分大小写
    wholeWord: false,     // 全词匹配
    maxMatches: 100       // 最大匹配数
  }
)

// 自定义过滤（如过滤掉与已有选区重叠的）
await searchAndHighlight(['关键词'], 'search', {
  filterMatches: (items) => items.filter(item => !item.hasOverlap)
})
```

### 清除搜索

```ts
// 清除指定关键词
removeSearchKeyword('关键词')

// 清除全部
clearSearchHighlights()
```

---

## 三、完整示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useSelectionRestore, useSearchHighlight } from '@ad-audit/range-sdk/vue'

// 气泡状态
const showPopover = ref(false)
const popoverData = ref<{ text: string; position: any } | null>(null)

// 选区恢复
const {
  isInitialized,
  currentSelections,
  saveCurrentSelection,
  deleteSelection,
  navigation,
  getSDKInstance
} = useSelectionRestore({
  appId: 'demo',
  containers: ['.editor'],
  onSelectionAction: (event) => {
    if (event.type === 'created' && event.position) {
      popoverData.value = { text: event.text, position: event.position }
      showPopover.value = true
    } else if (event.type === 'cleared') {
      showPopover.value = false
    }
  }
})

// 搜索高亮
const { searchResults, addSearchKeyword, clearSearchHighlights } = useSearchHighlight({
  getSDKInstance,
  containers: ['.editor']
})

// 保存选区
const handleSave = async (type: string) => {
  await saveCurrentSelection(undefined, type)
  showPopover.value = false
}

// 搜索
const handleSearch = async (keyword: string) => {
  await addSearchKeyword(keyword, 'search')
}
</script>

<template>
  <div class="app">
    <!-- 工具栏 -->
    <div class="toolbar">
      <input @keyup.enter="handleSearch($event.target.value)" placeholder="搜索..." />
      <span>{{ navigation.currentIndex + 1 }} / {{ navigation.total }}</span>
      <button @click="navigation.goToPrev">上一个</button>
      <button @click="navigation.goToNext">下一个</button>
    </div>

    <!-- 内容区 -->
    <div class="editor">
      <p>这是可以被选中和搜索高亮的文本内容...</p>
    </div>

    <!-- 选区列表 -->
    <ul>
      <li v-for="sel in currentSelections" :key="sel.id">
        {{ sel.text }}
        <button @click="deleteSelection(sel.id)">删除</button>
      </li>
    </ul>

    <!-- 气泡 -->
    <div v-if="showPopover" class="popover" :style="popoverData?.position">
      <button @click="handleSave('highlight')">高亮</button>
      <button @click="handleSave('comment')">批注</button>
    </div>
  </div>
</template>
```

---

## 四、类型参考

### SelectionActionEvent

```ts
interface SelectionActionEvent {
  type: 'created' | 'cleared' | 'click' | 'hover' | 'dblclick' | 'contextmenu'
  text: string
  position?: { x: number; y: number; width: number; height: number }
  range?: Range | null
  savedSelection?: SerializedSelection
  savedSelectionId?: string
  overlappedSelections?: OverlappedRange[]
  timestamp: number
}
```

### SerializedSelection

```ts
interface SerializedSelection {
  id: string
  text: string
  type: string
  appName?: string
  // ... 序列化的位置信息
}
```

### HighlightNavigationState

```ts
interface HighlightNavigationState {
  currentIndex: Ref<number>
  total: ComputedRef<number>
  goToNext: () => void
  goToPrev: () => void
  goToIndex: (index: number) => void
  goToId: (id: string) => void
  reset: () => void
}
```

---

## 五、常见问题

### Q: 选区保存后页面刷新丢失？
A: 默认使用内存存储。如需持久化，需自行在 `onSelectionSaved` 回调中保存到后端，并在初始化时通过 `initialSelections` 传入。

### Q: 如何限制选区范围？
A: 通过 `containers` 参数指定 CSS 选择器数组，只有在这些容器内的选区才会被处理。

### Q: 搜索高亮如何过滤掉已有批注？
A: 使用 `filterMatches` 选项：
```ts
await addSearchKeyword('关键词', 'search', {
  filterMatches: (items) => items.filter(item => !item.hasOverlap)
})
```

---

## 六、更多资源

- [API 完整文档](../../api/core-api.md)
- [在线 Playground](../../playground/selection.md)
- [插件开发指南](../../plugins/development-guide.md)
