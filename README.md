# Range Kit

[![npm version](https://img.shields.io/npm/v/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![npm downloads](https://img.shields.io/npm/dm/range-kit.svg)](https://www.npmjs.com/package/range-kit) [![License](https://img.shields.io/npm/l/range-kit.svg)](https://www.npmjs.com/package/range-kit)

[中文](./README_zh.md)

A robust, modern library for managing DOM Range selections. Range Kit provides powerful capabilities for serializing, restoring, and highlighting text selections, designed to withstand DOM structure changes.

## Demo

<p align="center">
  <img src="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.gif" alt="Demo GIF" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/acsamson/range-kit/main/assets/demo.mp4">Watch Demo Video</a>
</p>

## Core Capabilities

Range Kit solves the hard problems of text selection in dynamic web applications:

- 🛡️ **Robust Serialization & Restoration**:
  - Converts ephemeral `Range` objects into persistent JSON.
  - Restores selections even after DOM structure changes (e.g., Virtual DOM updates) using a multi-layer strategy (ID, Path, Context, Fingerprint).
  - Perfect for saving comments, annotations, or reading progress to a database.

- 🎨 **High-Performance Highlighting**:
  - Uses the **CSS Custom Highlight API** (CSS `::highlight`) for zero-DOM-impact highlighting.
  - Gracefully falls back to optimized DOM wrapping for older browsers.
  - Supports custom styling without polluting global CSS.

- 🖱️ **Advanced Interaction**:
  - Unified `click`, `hover`, and `contextmenu` events for highlights.
  - Works seamlessly with both CSS Highlights and DOM wrapping.
  - Accurate hit-testing for non-element highlights.

- 🔍 **Search & Navigation**:
  - Built-in search functionality with consistent highlighting.
  - Spatial navigation (Next/Previous) to jump between highlights.

- ⚠️ **Overlap Detection**:
  - Smartly detects and handles overlapping selections.
  - Useful for complex annotation systems.

## Packages

This monorepo contains the following packages:

- **[range-kit](https://github.com/acsamson/range-kit/tree/main/packages/core)**: The core library (framework-agnostic). Handles the complex logic of range serialization, restoration strategies, and DOM manipulation.
- **[range-kit-react](https://github.com/acsamson/range-kit/tree/main/packages/react)**: React bindings including hooks and components.
- **[range-kit-vue](https://github.com/acsamson/range-kit/tree/main/packages/vue)**: Vue bindings including composables and components.

## Getting Started

### Using with React

```bash
npm install range-kit-react range-kit
```

See [range-kit-react documentation](https://github.com/acsamson/range-kit/tree/main/packages/react#readme) for details.

### Using with Vue

```bash
npm install range-kit-vue range-kit
```

See [range-kit-vue documentation](https://github.com/acsamson/range-kit/tree/main/packages/vue#readme) for details.

### Using Vanilla JS / Core

```bash
npm install range-kit
```

See [range-kit documentation](https://github.com/acsamson/range-kit/tree/main/packages/core#readme) for details.

## Development

This project uses [pnpm](https://pnpm.io/) workspaces.

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start development server** (starts all packages in watch mode):
   ```bash
   pnpm dev
   ```

3. **Build all packages**:
   ```bash
   pnpm build
   ```

4. **Run tests**:
   ```bash
   pnpm test
   ```

## License

Apache-2.0
