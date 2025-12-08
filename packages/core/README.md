# Range Kit (Core)

[![npm version](https://img.shields.io/npm/v/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![npm downloads](https://img.shields.io/npm/dm/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![License](https://img.shields.io/npm/l/range-kit.svg)](https://www.npmjs.com/package/range-kit)

[GitHub](https://github.com/acsamson/range-kit) | [中文](./README_zh.md)

`range-kit` is a powerful, framework-agnostic library for managing DOM Range selections. It provides robust capabilities for serializing, restoring, and highlighting text selections, designed to withstand DOM structure changes.

## Demo

<p align="center">
  <img src="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.gif" alt="Demo GIF" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.mp4">Watch Demo Video</a>
</p>

## Core Capabilities

`range-kit` solves complex problems related to text selection in dynamic web applications:

### 1. Robust Range Serialization & Restoration
Native `Range` objects are ephemeral and break when the DOM changes. `range-kit` converts them into a persistent JSON format.

- **Multi-Layer Strategy**: Uses 4 strategies to ensure restoration success:
  1. **ID Anchors**: Fast lookup using element IDs.
  2. **DOM Path**: XPath-like structure for precise location.
  3. **Text Context**: Uses surrounding text to recover position even if the DOM structure changes.
  4. **Structural Fingerprint**: Fuzzy matching for highly dynamic content.
- **Cross-Session Persistence**: Serialized ranges can be stored in a database and restored in future sessions.

### 2. High-Performance Highlighting
Painting highlights on the web is traditionally done by wrapping text in `<span>` tags, which can break the DOM structure and conflict with frameworks like React/Vue.

- **CSS Custom Highlight API**: Uses the modern browser API (CSS `::highlight`) where supported for zero-DOM-impact highlighting.
- **Hybrid Fallback**: Gracefully falls back to optimized DOM wrapping for older browsers.
- **Style Isolation**: Custom styles without polluting global CSS.

### 3. Advanced Interaction Management
Handling events on highlighted text (especially with the CSS Highlight API) is difficult.

- **Unified Events**: Provides a consistent API for `click`, `hover`, and `contextmenu` events on highlights, regardless of the rendering technique.
- **Hit Testing**: Accurately detects which highlight is under the cursor.
- **Debounced Selection**: Optimized `selectionchange` handling to prevent performance bottlenecks.

### 4. Overlap Detection
Detects when a new selection overlaps with existing highlights.

- **Conflict Resolution**: Identifies full containment, partial overlap, or exact matches.
- **Smart Merging**: (Optional) APIs to help merge overlapping selections.

### 5. Search & Navigation
Built-in capabilities for finding and navigating text.

- **Search Highlighting**: Search text and highlight all occurrences using the same robust engine.
- **Spatial Navigation**: Navigate between highlights (Next/Previous) based on their visual position in the document.

## Installation

```bash
npm install range-kit
# or
pnpm add range-kit
# or
yarn add range-kit
```

## Usage

### High-Level API (Recommended)

`SelectionManager` is the easiest way to get started. It orchestrates the locator, highlighter, and interaction modules.

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

### Modular Usage

You can also use individual modules for specific needs.

#### RangeLocator
Handles converting between DOM Range and JSON.

```typescript
import { createLocator } from 'range-kit';

const locator = createLocator();
const serialized = locator.serializeRange(range, container);
const restoredRange = locator.restoreRange(serialized, container);
```

#### Highlighter
Handles painting highlights on the DOM.

```typescript
import { createNewHighlighter } from 'range-kit';

const highlighter = createNewHighlighter();
highlighter.highlightRange(range, {
  className: 'my-highlight',
  styles: { backgroundColor: 'yellow' }
});
```

#### InteractionManager
Handles user interactions.

```typescript
import { InteractionManager } from 'range-kit';

const interaction = new InteractionManager(container);
interaction.on('click', (event) => {
  if (event.selectionId) {
    console.log('Clicked selection:', event.selectionId);
  }
});
```

## Architecture

- **Locator**: Core algorithm layer. Pure calculation, no side effects.
- **Highlighter**: Rendering layer. Handles DOM painting.
- **InteractionManager**: Event handling layer. Manages user interactions.

## License

Apache-2.0
