# Vue Composables

该包提供了一组 Vue Composition API Hooks 来管理选区、高亮和用户交互。

## useSelectionRestore

用于管理持久化选区的核心 Composable。

```typescript
import { useSelectionRestore } from '@range-kit/vue';

const {
  currentSelections,
  saveCurrentSelection,
  restoreSelections
} = useSelectionRestore(options);
```

### 选项 (`UseSelectionRestoreOptions`)

| 选项 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `rootNodeId` | `string` | **必填** | 管理选区的根元素 ID。 |
| `initialSelections` | `SerializedSelection[]` | `[]` | 挂载时恢复的选区。 |
| `selectionStyles` | `SelectionTypeConfig[]` | `[]` | 不同选区类型的自定义样式。 |
| `onSelectionAction` | `(event) => void` | - | 用户交互（点击、悬停、选择）的回调。 |
| `onSelectionSaved` | `(selection) => void` | - | 选区成功序列化时的回调。 |
| `onSelectionDeleted` | `(id) => void` | - | 选区被移除时的回调。 |

### 返回值

| 值 | 类型 | 描述 |
| :--- | :--- | :--- |
| `currentSelections` | `Ref<SerializedSelection[]>` | 当前活动的持久化选区响应式数组。 |
| `saveCurrentSelection` | `(id?, type?, autoHighlight?) => Promise` | 序列化当前 DOM 选区并添加到状态中。 |
| `restoreSelections` | `(selections) => Promise` | 将选区列表恢复到 DOM。 |
| `deleteSelection` | `(id) => Promise` | 通过 ID 移除选区。 |
| `clearAllSelections` | `() => void` | 移除所有选区。 |
| `navigation` | `object` | 在高亮之间导航的帮助对象（见下文）。 |
| `getInstance` | `() => SelectionRestore` | 访问底层 Core 实例。 |

---

## useSearchHighlight

管理带高亮支持的搜索功能。

```typescript
import { useSearchHighlight } from '@range-kit/vue';

const { searchAndHighlight } = useSearchHighlight({
  getInstance: () => instance // 来自 useSelectionRestore
});
```

### 选项

| 选项 | 类型 | 描述 |
| :--- | :--- | :--- |
| `getInstance` | `() => SelectionRestore` | 获取核心实例的函数。 |
| `containers` | `string[]` | 搜索范围的 CSS 选择器（默认：`['body']`）。 |
| `selectionStyles` | `SelectionTypeConfig[]` | 搜索匹配项的自定义样式。 |

### 返回值

| 值 | 类型 | 描述 |
| :--- | :--- | :--- |
| `searchAndHighlight` | `(keyword, type?, options?) => Promise` | 搜索文本并高亮匹配项。 |
| `clearSearchHighlights` | `(keyword?) => void` | 清除特定或所有关键词的高亮。 |
| `searchResults` | `Ref<SearchResultItem[]>` | 当前搜索结果及匹配计数的响应式数组。 |

---

## usePopover

用于相对于选区定位浮动 UI 元素的辅助 Composable。由 `floating-ui/vue` 驱动。

```typescript
import { usePopover } from '@range-kit/vue';

const { show, hide, floatingStyles, refs } = usePopover();
```

### 选项

| 选项 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `placement` | `Placement` | `'top'` | 首选位置（top, bottom 等）。 |
| `offset` | `number` | `8` | 距离选区的距离。 |
| `closeOnClickOutside` | `boolean` | `true` | 点击外部时自动关闭。 |

### 返回值

| 值 | 类型 | 描述 |
| :--- | :--- | :--- |
| `show` | `(data) => void` | 在特定位置显示 Popover。 |
| `hide` | `() => void` | 隐藏 Popover。 |
| `visible` | `Ref<boolean>` | 当前可见性状态。 |
| `floatingStyles` | `Ref<CSSProperties>` | 应用于 Popover 元素的响应式样式。 |
| `refs` | `object` | 附加到 Popover 元素的引用。 |