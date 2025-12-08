# Core Library

`range-kit` solves complex problems related to text selection in dynamic web applications.

## Documentation
- **[API Reference](./api.md)**: Detailed class and method documentation.
- **[Architecture](./architecture.md)**: Deep dive into the Locator, Highlighter, and Interaction modules.

## Key Features

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