# useSelectionRestore Hook 使用指南

`useSelectionRestore` 是 RangeSDK 的核心 Vue Hook，提供完整的选区管理功能，包括选区的创建、保存、恢复、删除和高亮显示。

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
    <!-- 状态指示器 -->
    <div v-if="!isInitialized">正在初始化...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 控制按钮 -->
    <div class="controls">
      <select v-model="selectedType">
        <option v-for="type in availableTypes" :key="type.type" :value="type.type">
          {{ type.icon }} {{ type.label }}
        </option>
      </select>

      <button @click="handleSave" :disabled="isLoading">
        保存当前选区
      </button>

      <button @click="handleRestoreAll" :disabled="currentSelections.length === 0">
        恢复所有选区 ({{ currentSelections.length }})
      </button>

      <button @click="clearAllSelections">
        清除高亮
      </button>
    </div>

    <!-- 演示文本区域 -->
    <div class="text-container">
      <p>在这里选择文本，然后点击"保存当前选区"按钮。</p>
      <p>RangeSDK 提供了强大的选区管理功能，包括序列化、持久化存储、跨会话恢复等特性。</p>
    </div>

    <!-- 选区列表 -->
    <div v-if="currentSelections.length > 0" class="selections-list">
      <h3>已保存的选区</h3>
      <div v-for="selection in currentSelections" :key="selection.id" class="selection-item">
        <span>"{{ selection.text }}"</span>
        <span class="type-badge">{{ getTypeConfig(selection.type)?.label }}</span>
        <button @click="handleDelete(selection.id)">删除</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useSelectionRestore } from '@ad-audit/range-sdk/vue'

const selectedType = ref('default')

const {
  isInitialized,
  currentSelections,
  isLoading,
  error,
  availableTypes,
  getTypeConfig,
  saveCurrentSelection,
  restoreSelections,
  clearAllSelections,
  deleteSelection
} = useSelectionRestore({
  appId: 'my-app',
  containers: ['.text-container'],

  // 统一选区动作回调
  onSelectionAction: (event) => {
    switch (event.type) {
      case 'created':
        console.log('新建选区:', event.text)
        break
      case 'click':
        console.log('点击选区:', event.savedSelectionId)
        break
      case 'cleared':
        console.log('选区已清除')
        break
    }
  },

  onSelectionSaved: (selection) => {
    console.log('选区已保存:', selection)
  },

  onSelectionDeleted: (selectionId) => {
    console.log('选区已删除:', selectionId)
  }
})

const handleSave = async () => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) {
    alert('请先选择一些文本')
    return
  }

  try {
    const result = await saveCurrentSelection(undefined, selectedType.value)
    if (result) {
      alert(`选区已保存！类型: ${getTypeConfig(selectedType.value)?.label}`)
    }
  } catch (err: any) {
    alert('保存失败: ' + err.message)
  }
}

const handleRestoreAll = async () => {
  try {
    await restoreSelections(currentSelections.value)
    alert(`成功恢复 ${currentSelections.value.length} 个选区`)
  } catch (err: any) {
    alert('恢复失败: ' + err.message)
  }
}

const handleDelete = async (selectionId: string) => {
  if (confirm('确定要删除这个选区吗？')) {
    await deleteSelection(selectionId)
  }
}
</script>
```

---

## API 参考

### 配置选项 (UseSelectionRestoreOptions)

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:----:|--------|------|
| `appId` | `string` | ✅ | - | 应用唯一标识，用于数据隔离 |
| `containers` | `string[]` | - | `[]` | 选区生效的容器选择器数组 |
| `initialSelections` | `SerializedSelection[]` | - | `[]` | 初始化时恢复的选区数据 |
| `selectionStyles` | `SelectionTypeConfig[]` | - | 内置类型 | 自定义选区类型和样式 |
| `onSelectionAction` | `Function` | - | - | 统一选区动作回调 |
| `onSelectionSaved` | `Function` | - | - | 选区保存完成回调 |
| `onSelectionDeleted` | `Function` | - | - | 选区删除完成回调 |

### 返回值 (UseSelectionRestoreReturn)

#### 响应式状态

| 属性 | 类型 | 说明 |
|------|------|------|
| `isInitialized` | `Ref<boolean>` | SDK 是否已初始化 |
| `currentSelections` | `Ref<SerializedSelection[]>` | 当前所有选区数据 |
| `isLoading` | `Ref<boolean>` | 是否正在加载 |
| `error` | `Ref<string \| null>` | 错误信息 |

#### 配置信息

| 属性 | 类型 | 说明 |
|------|------|------|
| `config` | `ReactiveConfig` | 响应式配置对象 |
| `availableTypes` | `SelectionTypeConfig[]` | 可用的选区类型列表 |
| `getTypeConfig` | `(type: string) => SelectionTypeConfig \| undefined` | 获取指定类型的配置 |

#### 核心方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `saveCurrentSelection` | `(id?: string, type?: string, autoHighlight?: boolean, fromRange?: Range) => Promise<SerializedSelection \| null>` | 保存当前选区 |
| `restoreSelections` | `(selections: SerializedSelection[], enableAutoScroll?: boolean) => Promise<void>` | 恢复选区并高亮 |
| `clearAllSelections` | `() => void` | 清除所有高亮 |
| `deleteSelection` | `(selectionId: string) => Promise<void>` | 删除指定选区 |
| `clearAllSelectionsData` | `() => Promise<void>` | 清空所有选区数据 |
| `highlightCurrentSelection` | `(duration?: number) => void` | 高亮当前选中文本 |
| `getCurrentSelectionsForSubmit` | `() => SerializedSelection[]` | 获取所有选区数据用于提交 |
| `getCurrentSelectionsSimple` | `(selections?: SerializedSelection[]) => SerializedSelectionSimple[]` | 获取精简选区数据 |
| `updateContainers` | `(newContainers: string[]) => void` | 动态更新容器配置 |
| `loadCurrentSelections` | `() => Promise<void>` | 重新加载选区数据 |

#### 导航功能

| 属性/方法 | 类型 | 说明 |
|----------|------|------|
| `navigation.currentIndex` | `Ref<number>` | 当前导航索引 |
| `navigation.total` | `ComputedRef<number>` | 高亮总数 |
| `navigation.currentHighlight` | `ComputedRef<NavigationHighlight \| null>` | 当前高亮项 |
| `navigation.goToNext` | `() => void` | 导航到下一个 |
| `navigation.goToPrev` | `() => void` | 导航到上一个 |
| `navigation.goToIndex` | `(index: number) => void` | 导航到指定索引 |
| `navigation.goToId` | `(id: string) => void` | 导航到指定 ID |
| `navigation.reset` | `() => void` | 重置导航状态 |

#### 高级接口

| 方法 | 签名 | 说明 |
|------|------|------|
| `getSDKInstance` | `() => SelectionRestoreAPI \| null` | 获取底层 SDK 实例 |

---

## 事件处理

### onSelectionAction 统一回调

`onSelectionAction` 是统一的选区动作回调，通过 `event.type` 区分不同的动作类型：

```typescript
interface SelectionActionEvent {
  /** 动作类型 */
  type: SelectionActionType
  /** 选中的文本内容 */
  text: string
  /** 位置信息（用于显示气泡等 UI） */
  position?: { x: number; y: number; width: number; height: number }
  /** 原始 DOM 事件 */
  originalEvent?: Event
  /** Range 对象（仅 created 时有效） */
  range?: Range | null
  /** 已保存的选区数据（仅交互已保存选区时有效） */
  savedSelection?: SerializedSelection
  /** 已保存选区的实例 ID（仅交互已保存选区时有效） */
  savedSelectionId?: string
  /** 重叠的已保存选区列表 */
  overlappedSelections?: OverlappedRange[]
  /** 事件时间戳 */
  timestamp: number
}

type SelectionActionType =
  | 'created'      // 用户划选了新文本
  | 'cleared'      // 用户清除了选区（点击空白处）
  | 'click'        // 点击已保存选区
  | 'hover'        // 悬停在已保存选区
  | 'dblclick'     // 双击已保存选区
  | 'contextmenu'  // 右键已保存选区
```

### 使用示例

```typescript
const { ... } = useSelectionRestore({
  appId: 'my-app',

  onSelectionAction: (event) => {
    switch (event.type) {
      case 'created':
        // 用户划选了新文本
        console.log('新建选区:', {
          text: event.text,
          position: event.position,
          overlappedSelections: event.overlappedSelections
        })
        // 检查是否与已有选区重叠
        if (event.overlappedSelections?.length) {
          showOverlapWarning(event)
        } else {
          showSavePopover(event)
        }
        break

      case 'cleared':
        // 用户清除了选区
        hidePopover()
        break

      case 'click':
        // 点击已保存选区
        console.log('点击选区:', event.savedSelectionId)
        showSelectionDetails(event.savedSelection)
        break

      case 'hover':
        // 悬停在已保存选区
        showPreviewTooltip(event)
        break

      case 'dblclick':
        // 双击选区，进入编辑模式
        enterEditMode(event.savedSelection)
        break

      case 'contextmenu':
        // 右键菜单
        showContextMenu(event)
        break
    }
  },

  onSelectionSaved: (selection) => {
    // 同步到服务器
    api.saveSelection(selection)
  },

  onSelectionDeleted: (selectionId) => {
    // 从服务器删除
    api.deleteSelection(selectionId)
  }
})
```

---

## 内置选区类型

Hook 提供了 6 种预设的选区类型：

| 类型 | 图标 | 标签 | 样式 | 用途 |
|------|:----:|------|------|------|
| `default` | ✨ | 默认高亮 | 浅黄色背景 + 深黄色下划线 | 一般性文本标记 |
| `important` | ⭐ | 重要内容 | 淡黄色背景 + 橙色粗下划线 + 加粗 | 标记重要信息 |
| `question` | ❓ | 疑问标记 | 淡蓝色背景 + 蓝色波浪下划线 | 标记有疑问的内容 |
| `bookmark` | 🔖 | 书签收藏 | 淡紫色背景 + 紫色下划线 + 左边框 | 收藏重要段落 |
| `note` | 📝 | 笔记标注 | 淡绿色背景 + 绿色虚线下划线 | 添加个人笔记 |
| `warning` | ⚠️ | 警告提醒 | 淡橙色背景 + 红橙色双下划线 | 标记需要注意的内容 |

---

## 自定义选区类型

通过 `selectionStyles` 参数自定义选区类型：

```typescript
const customTypes: SelectionTypeConfig[] = [
  {
    type: 'highlight',
    label: '高亮标记',
    icon: '🌟',
    description: '突出显示重点内容',
    style: {
      backgroundColor: '#ffeb3b',
      textDecorationColor: '#f57f17',
      textDecorationThickness: '3px',
      fontWeight: 'bold'
    }
  },
  {
    type: 'comment',
    label: '评论标注',
    icon: '💬',
    description: '添加评论和讨论',
    style: {
      backgroundColor: '#e1f5fe',
      textDecorationColor: '#0277bd',
      textDecorationStyle: 'dashed'
    }
  }
]

const { ... } = useSelectionRestore({
  appId: 'my-app',
  selectionStyles: customTypes
})
```

### SelectionTypeConfig 接口

```typescript
interface SelectionTypeConfig {
  /** 类型标识（唯一） */
  type: string
  /** 显示标签 */
  label: string
  /** 图标（可选，支持 emoji 或图标类名） */
  icon?: string
  /** 描述（可选） */
  description?: string
  /** 高亮样式 */
  style: HighlightStyle
}

interface HighlightStyle {
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  color?: string
  /** 下划线颜色 */
  textDecorationColor?: string
  /** 下划线样式：solid | dashed | dotted | wavy | double */
  textDecorationStyle?: string
  /** 下划线粗细 */
  textDecorationThickness?: string
  /** 字体粗细 */
  fontWeight?: string
  /** 其他 CSS 属性 */
  [key: string]: string | undefined
}
```

---

## 容器范围控制

通过 `containers` 参数限定选区的生效范围：

```typescript
const { ... } = useSelectionRestore({
  appId: 'my-app',
  containers: [
    '.article-content',    // 文章内容区域
    '.comment-section',    // 评论区域
    '#main-text'           // 主要文本区域
  ]
})

// 动态更新容器
const { updateContainers } = useSelectionRestore({ ... })

// 添加新容器
updateContainers([...config.containers, '.new-container'])

// 切换到不同区域
updateContainers(['.tab-content-2'])
```

---

## 导航功能

支持在多个高亮选区之间导航：

```vue
<template>
  <div class="navigation-controls">
    <span>{{ navigation.currentIndex + 1 }} / {{ navigation.total }}</span>
    <button @click="navigation.goToPrev" :disabled="navigation.total === 0">上一个</button>
    <button @click="navigation.goToNext" :disabled="navigation.total === 0">下一个</button>
    <button @click="navigation.reset">重置</button>
  </div>
</template>

<script setup>
const { navigation } = useSelectionRestore({ appId: 'my-app' })

// 导航到指定选区
const goToSelection = (selectionId: string) => {
  navigation.goToId(selectionId)
}

// 监听当前高亮变化
watch(() => navigation.currentHighlight.value, (highlight) => {
  if (highlight) {
    console.log('当前高亮:', highlight.text)
  }
})
</script>
```

---

## 数据持久化

Hook 默认使用内存存储。如需持久化，可以导出/导入数据：

```typescript
const {
  getCurrentSelectionsForSubmit,
  getCurrentSelectionsSimple,
  restoreSelections
} = useSelectionRestore({ appId: 'my-app' })

// 导出完整数据
const exportFullData = () => {
  const data = getCurrentSelectionsForSubmit()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadFile(blob, 'selections.json')
}

// 导出精简数据（适合传输）
const exportSimpleData = () => {
  const data = getCurrentSelectionsSimple()
  return data // { id, text, type, timestamp }[]
}

// 从文件导入
const importFromFile = async (file: File) => {
  const text = await file.text()
  const selections = JSON.parse(text)
  await restoreSelections(selections)
}

// 同步到服务器
const syncToServer = async () => {
  const selections = getCurrentSelectionsForSubmit()
  await api.saveSelections(selections)
}
```

---

## 高级用法

### 获取 SDK 实例

```typescript
const { getSDKInstance } = useSelectionRestore({ appId: 'my-app' })

// 访问底层 SDK 的高级功能
const sdk = getSDKInstance()
if (sdk) {
  // 检测点击位置的所有重叠选区
  const overlaps = sdk.detectAllSelectionsAtPoint(x, y)

  // 获取所有活跃的选区 ID
  const activeIds = sdk.getAllActiveSelectionIds()

  // 获取指定选区的 Range
  const range = sdk.getActiveRange(selectionId)
}
```

### 从指定 Range 保存选区

```typescript
const { saveCurrentSelection } = useSelectionRestore({ appId: 'my-app' })

// 从搜索高亮的 Range 保存选区
const saveFromSearchHighlight = async (range: Range) => {
  const result = await saveCurrentSelection(
    undefined,        // id（自动生成）
    'highlight',      // type
    true,             // autoHighlight
    range             // fromRange
  )
  return result
}
```

### 批量操作

```typescript
const {
  deleteSelection,
  getSDKInstance,
  loadCurrentSelections
} = useSelectionRestore({ appId: 'my-app' })

// 批量删除
const deleteMultiple = async (ids: string[]) => {
  for (const id of ids) {
    await deleteSelection(id)
  }
}

// 批量更新类型
const updateType = async (ids: string[], newType: string) => {
  const sdk = getSDKInstance()
  if (sdk) {
    for (const id of ids) {
      await sdk.updateSelection(id, { type: newType })
    }
    await loadCurrentSelections()
  }
}
```

---

## 最佳实践

### 1. 合理设置容器范围

```typescript
// ✅ 好的做法：精确指定容器
containers: ['.article-content', '.sidebar-text']

// ❌ 避免：范围过大影响性能
containers: ['body']
```

### 2. 错误处理

```typescript
const handleSave = async () => {
  try {
    const result = await saveCurrentSelection(undefined, selectedType.value)
    if (result) {
      showSuccess('保存成功')
    } else {
      showWarning('没有检测到有效选区')
    }
  } catch (error) {
    showError('保存失败: ' + error.message)
  }
}
```

### 3. 性能优化

```typescript
import { debounce } from 'lodash-es'

// 防抖保存
const debouncedSave = debounce(async () => {
  await saveCurrentSelection()
}, 500)

// 分页显示大量选区
const paginatedSelections = computed(() => {
  const start = (page.value - 1) * pageSize
  return currentSelections.value.slice(start, start + pageSize)
})
```

### 4. 快捷键支持

```typescript
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'z') {
        e.preventDefault()
        // 撤销操作
      }
    }
  }

  document.addEventListener('keydown', handleKeydown)
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
})
```

---

## 类型导出

```typescript
import type {
  UseSelectionRestoreOptions,
  UseSelectionRestoreReturn,
  SelectionActionEvent,
  SelectionActionType,
  HighlightNavigationState,
  NavigationHighlight
} from '@ad-audit/range-sdk/vue'

import type {
  SerializedSelection,
  SerializedSelectionSimple,
  SelectionTypeConfig,
  HighlightStyle,
  OverlappedRange
} from '@ad-audit/range-sdk'
```

---

## 相关链接

- [useSearchHighlight Hook](./use-search-highlight.md) - 搜索高亮功能
- [RangeSDK 核心 API](../api/core-api.md)
- [在线演示](../playground/selection-restore.md)
