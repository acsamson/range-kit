# Range Kit React

Official React bindings for `range-kit`.

## Installation

```bash
npm install range-kit-react range-kit
```

## Documentation

- **[Hooks](./hooks.md)**: `useSelectionRestore`, `useSearchHighlight`, `usePopover`, etc.
- **[Components](./components.md)**: `SelectionPopover`.

## Introduction

This package provides a seamless integration of `range-kit` into React applications. It abstracts away the imperative nature of the core library, exposing reactive hooks and declarative components.

### Features
- **Lifecycle Management**: Automatically initializes and disposes of `SelectionManager` instances.
- **Reactive State**: Selections are exposed as state variables that trigger re-renders when changed.
- **Event Integration**: Easily bind React callbacks to selection events.
- **Portal Support**: Built-in support for rendering popovers/tooltips into React Portals using `floating-ui`.

### Quick Example

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
      <p>Select some text here...</p>
      <button onClick={() => saveCurrentSelection()}>Highlight Selection</button>
      
      <div>Active Highlights: {currentSelections.length}</div>
    </div>
  );
}
```