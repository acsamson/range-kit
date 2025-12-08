# Range Kit Vue

`range-kit` 的官方 Vue 绑定。

## 安装

```bash
npm install range-kit-vue range-kit
```

## 文档

- **[Composables](./composables.md)**: `useSelectionRestore`, `useSearchHighlight`, `usePopover`.
- **[组件](./components.md)**: `SelectionPopover`.

## 简介

该包提供了 `range-kit` 到 Vue 应用的无缝集成。它使用 Composition API 提供灵活且可重用的逻辑。

### 功能特性
- **生命周期管理**：在挂载/卸载时自动初始化和销毁 `SelectionManager` 实例。
- **响应式状态**：为选区、加载状态和可见性返回 Vue `Ref` 对象。
- **事件集成**：将 Vue 事件处理程序绑定到选区操作。
- **Teleport 支持**：内置 `SelectionPopover` 组件，使用 Vue 的 `Teleport` 和 `floating-ui` 进行定位。

### 快速示例

```vue
<script setup>
import { useSelectionRestore } from '@range-kit/vue';

const { 
  currentSelections, 
  saveCurrentSelection 
} = useSelectionRestore({
  rootNodeId: 'content'
});
</script>

<template>
  <div id="content">
    <p>在这里选择一些文本...</p>
    <button @click="saveCurrentSelection()">高亮选区</button>
    
    <div>当前高亮数: {{ currentSelections.length }}</div>
  </div>
</template>
```