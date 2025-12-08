# Range Kit React

`range-kit` 的官方 React 绑定。

## 安装

```bash
npm install range-kit-react range-kit
```

## 文档

- **[Hooks](./hooks.md)**: `useSelectionRestore`, `useSearchHighlight`, `usePopover` 等。
- **[组件](./components.md)**: `SelectionPopover`.

## 简介

该包提供了 `range-kit` 到 React 应用的无缝集成。它抽象了核心库的命令式操作，暴露了响应式的 Hooks 和声明式组件。

### 功能特性
- **生命周期管理**：自动初始化和销毁 `SelectionManager` 实例。
- **响应式状态**：选区作为状态变量暴露，更改时触发重新渲染。
- **事件集成**：轻松将 React 回调绑定到选区事件。
- **Portal 支持**：内置支持使用 `floating-ui` 将弹出框/工具提示渲染到 React Portals 中。

### 快速示例

```tsx
import { useSelectionRestore, SelectionPopover } from '@range-kit/react';

function App() {
  const { 
    currentSelections, 
    saveCurrentSelection 
  } = useSelectionRestore({
    rootNodeId: 'content'
  });

  return (
    <div id="content">
      <p>在这里选择一些文本...</p>
      <button onClick={() => saveCurrentSelection()}>高亮选区</button>
      
      <div>当前高亮数: {currentSelections.length}</div>
    </div>
  );
}
```