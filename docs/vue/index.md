# Range Kit Vue

Official Vue bindings for `range-kit`.

## Installation

```bash
npm install range-kit-vue range-kit
```

## Documentation

- **[Composables](./composables.md)**: `useSelectionRestore`, `useSearchHighlight`, `usePopover`.
- **[Components](./components.md)**: `SelectionPopover`.

## Introduction

This package provides a seamless integration of `range-kit` into Vue applications. It uses the Composition API to provide flexible and reusable logic.

### Features
- **Lifecycle Management**: Automatically initializes and disposes of `SelectionManager` instances on mount/unmount.
- **Reactive State**: Returns Vue `Ref` objects for selections, loading states, and visibility.
- **Event Integration**: Bind Vue event handlers to selection actions.
- **Teleport Support**: Built-in `SelectionPopover` component that uses Vue's `Teleport` and `floating-ui` for positioning.

### Quick Example

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
    <p>Select some text here...</p>
    <button @click="saveCurrentSelection()">Highlight Selection</button>
    
    <div>Active Highlights: {{ currentSelections.length }}</div>
  </div>
</template>
```