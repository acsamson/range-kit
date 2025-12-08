# Range Kit (Core)

[![npm version](https://img.shields.io/npm/v/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![npm downloads](https://img.shields.io/npm/dm/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![License](https://img.shields.io/npm/l/range-kit.svg)](https://www.npmjs.com/package/range-kit)

[GitHub](https://github.com/acsamson/range-kit) | [English](./README.md)

`range-kit` 是一个功能强大的、与框架无关的 DOM Range 选择管理库。它提供了强大的文本选择序列化、恢复和高亮功能，专为应对 DOM 结构变化而设计。

## 演示

<p align="center">
  <img src="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.gif" alt="Demo GIF" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.mp4">观看演示视频</a>
</p>

## 核心能力

`range-kit` 解决了动态 Web 应用中与文本选择相关的复杂问题：

### 1. 健壮的选区序列化与恢复
原生的 `Range` 对象是临时的，一旦 DOM 发生变化就会失效。`range-kit` 将其转换为持久化的 JSON 格式。

- **多层恢复策略**：使用 4 种策略确保恢复成功：
  1. **ID 锚点**：使用元素 ID 进行快速查找。
  2. **DOM 路径**：使用类似 XPath 的结构进行精确定位。
  3. **文本上下文**：利用周围文本在 DOM 结构变化后恢复位置。
  4. **结构指纹**：针对高度动态内容的模糊匹配。
- **跨会话持久化**：序列化的选区可以存储在数据库中，并在未来的会话中恢复。

### 2. 高性能高亮
传统的 Web 文本高亮通常通过包裹 `<span>` 标签实现，这会破坏 DOM 结构并与 React/Vue 等框架冲突。

- **CSS Custom Highlight API**：在支持的浏览器中使用现代 API (CSS `::highlight`) 实现零 DOM 影响的高亮。
- **混合降级方案**：在旧版浏览器中优雅降级为优化的 DOM 包裹方案。
- **样式隔离**：自定义样式，不污染全局 CSS。

### 3. 高级交互管理
处理高亮文本上的事件（特别是使用 CSS Highlight API 时）非常困难。

- **统一事件系统**：无论底层使用何种渲染技术，都提供统一的 `click`、`hover` 和 `contextmenu` 事件 API。
- **命中检测**：精确检测光标下的高亮区域。
- **防抖选区处理**：优化的 `selectionchange` 处理，防止性能瓶颈。

### 4. 重叠检测
检测新选区是否与现有高亮重叠。

- **冲突解决**：识别完全包含、部分重叠或精确匹配。
- **智能合并**：（可选）提供 API 帮助合并重叠的选区。

### 5. 搜索与导航
内置的文本查找和导航能力。

- **搜索高亮**：使用相同的高亮引擎搜索并高亮所有匹配文本。
- **空间导航**：根据文档中的视觉位置在高亮之间导航（上一个/下一个）。

## 安装

```bash
npm install range-kit
# 或
pnpm add range-kit
# 或
yarn add range-kit
```

## 使用方法

### 高级 API（推荐）

`SelectionManager` 是最简单的入门方式。它协调了定位器、高亮器和交互模块。

```typescript
import { SelectionManager } from 'range-kit';

// 初始化
const manager = new SelectionManager({
  container: document.getElementById('content'),
  hooks: {
    onSelectionChange: (selection) => {
      console.log('新的选区:', selection);
    },
    onHighlightClick: (id, event) => {
      console.log('点击了高亮:', id);
    }
  }
});

// 序列化选区
const range = document.getSelection().getRangeAt(0);
const serialized = manager.serializeRange(range);

// 稍后恢复选区
manager.restoreSelection(serialized);
```

### 模块化使用

您也可以根据特定需求使用独立模块。

#### RangeLocator (定位器)
处理 DOM Range 和 JSON 之间的转换。

```typescript
import { createLocator } from 'range-kit';

const locator = createLocator();
const serialized = locator.serializeRange(range, container);
const restoredRange = locator.restoreRange(serialized, container);
```

#### Highlighter (高亮器)
处理 DOM 上的高亮绘制。

```typescript
import { createNewHighlighter } from 'range-kit';

const highlighter = createNewHighlighter();
highlighter.highlightRange(range, {
  className: 'my-highlight',
  styles: { backgroundColor: 'yellow' }
});
```

#### InteractionManager (交互管理器)
处理用户交互。

```typescript
import { InteractionManager } from 'range-kit';

const interaction = new InteractionManager(container);
interaction.on('click', (event) => {
  if (event.selectionId) {
    console.log('点击了选区:', event.selectionId);
  }
});
```

## 架构

- **Locator**：核心算法层。纯计算，无副作用。
- **Highlighter**：渲染层。处理 DOM 绘制。
- **InteractionManager**：事件处理层。管理用户交互。

## 许可证

Apache-2.0
