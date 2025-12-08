# 核心 API 参考

`@range-kit/core` 包提供了选区管理的基础逻辑。它包含一个高级的 `SelectionManager` 和几个底层模块。

## SelectionManager

`SelectionManager` 是大多数应用的主要入口点。它协调序列化、高亮和交互处理。

### 构造函数

```typescript
new SelectionManager(options: SelectionManagerOptions)
```

**选项 (`SelectionManagerOptions`):**

| 选项 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `container` | `HTMLElement \| string` | **必填** | 管理选区的 DOM 元素（或其 ID）。 |
| `hooks` | `SelectionHooks` | `{}` | 可选的选区事件生命周期钩子。 |
| `config` | `SelectionConfig` | `{}` | 高亮和序列化行为的配置。 |

### 方法

#### `setSelectionById(id: string, range: Range)`
手动注册一个具有特定 ID 的选区。
- **id**: 选区的唯一标识符。
- **range**: 要选择的 DOM Range 对象。

#### `removeSelection(id: string)`
通过 ID 移除特定选区并清除其高亮。

#### `removeAllSelections()`
清除此实例管理的所有活动选区和高亮。

#### `getSelections(): Map<string, SerializedSelection>`
返回所有当前持久化选区的 Map。

#### `dispose()`
销毁管理器实例，移除所有事件监听器并清除高亮。

### 事件

管理器继承自 `EventEmitter`，支持以下事件：

```typescript
manager.on(eventType, handler);
```

| 事件类型 | 参数 | 描述 |
| :--- | :--- | :--- |
| `range-selected` | `SelectionInteractionEvent` | 当用户完成文本选择（mouseup）时触发。 |
| `range-clicked` | `SelectionInteractionEvent` | 当点击已高亮的选区时触发。 |
| `range-hover` | `SelectionInteractionEvent` | 当鼠标悬停在高亮上时触发。 |
| `range-contextmenu` | `SelectionInteractionEvent` | 当右键点击高亮时触发。 |

---

## 底层模块

如果您需要更细粒度的控制，可以直接使用底层模块。

### RangeLocator

负责 DOM Range 和可序列化 JSON 之间的转换。

```typescript
import { createLocator } from '@range-kit/core';
const locator = createLocator();
```

#### `serializeRange(range: Range, container: HTMLElement): SerializedSelection`
使用多种策略（ID、路径、上下文、指纹）将实时 DOM Range 转换为持久化 JSON 对象。

#### `restoreRange(serialized: SerializedSelection, container: HTMLElement): Promise<RestoreResult>`
尝试从序列化数据重建 DOM Range。返回一个指示成功或失败以及匹配质量的结果。

### Highlighter

负责在屏幕上绘制高亮。它会自动在 CSS Highlight API 和 DOM 包裹之间选择。

```typescript
import { createNewHighlighter } from '@range-kit/core';
const highlighter = createNewHighlighter();
```

#### `highlightRange(range: Range, style?: HighlightStyle)`
可视地高亮给定的 range。

- **style**:
  - `id`: 高亮的唯一 ID。
  - `className`: 要应用的 CSS 类名。
  - `priority`: 堆叠优先级（用于 CSS Highlight API）。

#### `removeHighlight(id: string)`
移除具有指定 ID 的高亮。

### InteractionManager

处理高亮文本上的鼠标事件。

```typescript
import { createInteractionManager } from '@range-kit/core';
const interaction = createInteractionManager({ highlighter, container });
```

#### `start()` / `stop()`
开始或停止监听 DOM 事件。

---

## 类型

### `SerializedSelection`
选区的持久化 JSON 格式。

```typescript
interface SerializedSelection {
  id: string; // 唯一标识符
  text: string; // 选中的文本内容
  start: AnchorInfo; // 起始位置详情
  end: AnchorInfo; // 结束位置详情
  ... // 其他内部元数据
}
```

### `SelectionInteractionEvent`
交互事件的载荷。

```typescript
interface SelectionInteractionEvent {
  event: MouseEvent; // 原始 DOM 事件
  selectionId: string; // 交互的选区 ID
  range: Range; // 涉及的 DOM Range
  nativeRange?: Range; // 原生浏览器选区（如果适用）
}
```