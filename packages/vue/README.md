# Range Kit Vue

[![npm version](https://img.shields.io/npm/v/range-kit-vue.svg)](https://www.npmjs.com/package/range-kit-vue) [![npm downloads](https://img.shields.io/npm/dm/range-kit-vue.svg)](https://www.npmjs.com/package/range-kit-vue) [![License](https://img.shields.io/npm/l/range-kit-vue.svg)](https://www.npmjs.com/package/range-kit-vue)

[GitHub](https://github.com/acsamson/range-kit/tree/main/packages/vue) | [中文](./README_zh.md)

Vue bindings for [`range-kit`](https://github.com/acsamson/range-kit/tree/main/packages/core), providing composables and components to easily integrate robust range selection and highlighting into Vue applications.

## Demo

<p align="center">
  <img src="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.gif" alt="Demo GIF" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.mp4">Watch Demo Video</a>
</p>

## Features

- **Vue Composables**:
  - `useSelectionRestore`: Manage selection persistence and restoration.
  - `useSearchHighlight`: Implement search functionality with highlighting.
  - `useSelectionCallbacks`: Handle selection events.
- **Components**:
  - `SelectionPopover`: Ready-to-use popover component for selection actions.

## Installation

```bash
npm install range-kit-vue range-kit
# or
pnpm add range-kit-vue range-kit
# or
yarn add range-kit-vue range-kit
```

## Usage

### Basic Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useSearchHighlight, SelectionPopover } from 'range-kit-vue';
import 'range-kit-vue/styles';

const containerRef = ref(null);

// Initialize Search Highlight
const {
  searchKeywords,
  searchResults,
  addSearchKeyword,
  clearSearchHighlights
} = useSearchHighlight({
  getInstance: () => null, // Provide your SelectionManager instance if needed
  containers: ['#content-area'],
  selectionStyles: {
    default: { backgroundColor: 'yellow' }
  }
});
</script>

<template>
  <div>
    <div id="content-area">
      <p>Select some text here to see range-kit in action.</p>
    </div>
    
    <!-- Popover component integration -->
    <SelectionPopover 
      <!-- props configuration -->
    />
  </div>
</template>
```

## License

Apache-2.0
