# Getting Started

`range-kit` is a powerful, framework-agnostic library for managing DOM Range selections. It provides robust capabilities for serializing, restoring, and highlighting text selections, designed to withstand DOM structure changes.

## Installation

```bash
npm install range-kit
# or
pnpm add range-kit
# or
yarn add range-kit
```

## Packages

- **[@range-kit/core](../core/index.md)**: The core logic. Framework-independent.
- **[@range-kit/react](../react/index.md)**: React hooks and components.
- **[@range-kit/vue](../vue/index.md)**: Vue composables and components.

## Basic Usage (Core)

The easiest way to get started with the core library is using the `SelectionManager`.

```typescript
import { SelectionManager } from 'range-kit';

// Initialize
const manager = new SelectionManager({
  container: document.getElementById('content'),
  hooks: {
    onSelectionChange: (selection) => {
      console.log('New selection:', selection);
    },
    onHighlightClick: (id, event) => {
      console.log('Clicked highlight:', id);
    }
  }
});

// Serialize a range
const range = document.getSelection().getRangeAt(0);
const serialized = manager.serializeRange(range);

// Restore a selection later
manager.restoreSelection(serialized);
```