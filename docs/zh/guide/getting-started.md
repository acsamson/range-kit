# 快速开始

`range-kit` 是一个强大的、与框架无关的库，用于管理 DOM Range 选区。它提供了强大的能力来序列化、恢复和高亮文本选区，旨在抵御 DOM 结构的变化。

## 安装

```bash
npm install range-kit
# 或
pnpm add range-kit
# 或
yarn add range-kit
```

## 软件包

- **[@range-kit/core](../core/index.md)**: 核心逻辑。不依赖框架。
- **[@range-kit/react](../react/index.md)**: React Hooks 和组件。
- **[@range-kit/vue](../vue/index.md)**: Vue Composables 和组件。

## 基础用法 (Core)

开始使用核心库最简单的方法是使用 `SelectionManager`。

```typescript
import { SelectionManager } from 'range-kit';

// 初始化
const manager = new SelectionManager({
  container: document.getElementById('content'),
  hooks: {
    onSelectionChange: (selection) => {
      console.log('新选区:', selection);
    },
    onHighlightClick: (id, event) => {
      console.log('点击高亮:', id);
    }
  }
});

// 序列化一个 range
const range = document.getSelection().getRangeAt(0);
const serialized = manager.serializeRange(range);

// 稍后恢复选区
manager.restoreSelection(serialized);
```