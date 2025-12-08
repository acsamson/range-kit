# Range Kit React

[![npm version](https://img.shields.io/npm/v/range-kit-react.svg)](https://www.npmjs.com/package/range-kit-react) [![npm downloads](https://img.shields.io/npm/dm/range-kit-react.svg)](https://www.npmjs.com/package/range-kit-react) [![License](https://img.shields.io/npm/l/range-kit-react.svg)](https://www.npmjs.com/package/range-kit-react)

[GitHub](https://github.com/acsamson/range-kit/tree/main/packages/react) | [中文](./README_zh.md)

React bindings for [`range-kit`](https://github.com/acsamson/range-kit/tree/main/packages/core), providing hooks and components to easily integrate robust range selection and highlighting into React applications.

## Demo

<p align="center">
  <img src="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.gif" alt="Demo GIF" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.mp4">Watch Demo Video</a>
</p>

## Features

- **React Hooks**:
  - `useSelectionRestore`: Manage selection persistence and restoration.
  - `useSearchHighlight`: Implement search functionality with highlighting.
  - `useSelectionCallbacks`: Handle selection events.
- **Components**:
  - `SelectionPopover`: Ready-to-use popover component for selection actions.

## Installation

```bash
npm install range-kit-react range-kit
# or
pnpm add range-kit-react range-kit
# or
yarn add range-kit-react range-kit
```

## Usage

### Basic Example

```tsx
import { useRef } from 'react';
import { useSearchHighlight, SelectionPopover } from 'range-kit-react';
import 'range-kit-react/styles';

function App() {
  const containerRef = useRef(null);
  
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

  return (
    <div>
      <div id="content-area">
        <p>Select some text here to see range-kit in action.</p>
      </div>
      
      {/* Popover component integration */}
      <SelectionPopover 
        // ... props configuration
      />
    </div>
  );
}
```

## License

Apache-2.0
