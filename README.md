# Range Kit

**The type-safe, headless selection engine for the modern web.**

让 DOM 选区变得可持久化、可移植，并未现代前端框架而生。

---

## 🌟 简介 (Introduction)

处理浏览器的 `Range` 和 `Selection` API 从来都不是一件乐事。浏览器兼容性问题、DOM 结构的动态变化、以及选区数据的序列化与反序列化，都是前端开发中的"深坑"。

**Range Kit** 旨在解决这些问题。它不仅仅是一个高亮库，更是一个现代化的选区引擎基础设施。它将复杂的 DOM 操作封装为纯粹的数据结构转换，让你专注于业务逻辑。

## ✨ 核心特性 (Features)

- **🛡️ 类型安全 (Type-Safe)**: 100% TypeScript 编写，提供完整的类型推断。
- **🧠 无状态核心 (Stateless Core)**: 核心库仅负责计算与逻辑，不持有状态，轻松集成 Redux/Pinia/Zustand。
- **⚓️ 坚固的锚点 (Robust Anchoring)**: 强制基于 ID 的相对路径定位，解决 DOM 变更导致的选区失效问题。
- **🧩 框架无关 (Framework Agnostic)**: 核心逻辑解耦，同时提供一流的 React & Vue 适配层。
- **🎨 Headless Design**: 不包含任何 UI 样式，完全由你定义高亮的外观。

## 📦 架构概览

这个项目采用 Monorepo 结构：

- **`@life2code/range-kit-core`**: 核心引擎。负责 Range <-> JSON 的序列化与反序列化，以及底层的 DOM 操作。
- **`@life2code/range-kit-react`**: 为 React 生态打造的 Hooks 封装。
- **`@life2code/range-kit-vue`**: 为 Vue 生态打造的 Composables 封装。

## 🚀 预览 (Preview)

> ⚠️ **注意**: 项目目前正在进行架构重构，以下 API 为设计预览。

### Core 使用

```typescript
import { SelectionManager } from '@life2code/range-kit-core';

// 1. 初始化 (强制 ID 锚点)
const manager = new SelectionManager('editor-root');

// 2. 获取当前选区的序列化数据 (纯 JSON)
const selectionData = manager.serializeCurrentSelection();
// -> { startId: "p-1", startOffset: 12, endId: "p-3", endOffset: 5, ... }

// 3. 恢复选区并高亮
manager.highlight(selectionData, {
  className: 'my-highlight-class'
});
```

### React Hooks

```tsx
import { useTextSelection } from '@life2code/range-kit-react';

function Article() {
  // 极简 API，无需关心底层 Range 对象
  const { selection, clearSelection } = useTextSelection({
    containerId: 'article-content',
    onSelectionEnd: (data) => {
      console.log('用户选中了:', data.text);
      // 保存 data 到数据库...
    }
  });

  return (
    <div id="article-content">
      {/* ... 内容 ... */}
    </div>
  );
}
```

## 🗺️ 未来规划 (Roadmap)

我们的目标是成为 Web 选区处理的事实标准。

### 1. 极致的开发者体验 (DX First)
- **React/Vue Hooks**: 开发者不需要去理解晦涩的 DOM Range API。你只需要 `useSelection()` 或 `useHighlight()`。
- 提供开箱即用的状态管理集成示例。

### 2. AI Native & RAG 场景支持
- **引用溯源 (Citation & Source Tracing)**: 针对当前爆发的 RAG (检索增强生成) 应用，提供最佳实践方案。
- 实现点击 AI 回复中的引用角标，自动滚动并高亮原文中的对应段落，即便原文是在复杂的文档结构中。

### 3. 攻克技术痛点
- **Complex DOM Support**: 完善对 `<iframe>` 跨域选区的支持。
- **Shadow DOM**: 穿透 Shadow DOM 边界的选区恢复与高亮。
- **Virtual List**: 支持虚拟滚动场景下的选区保持。

## 📄 License

MIT
