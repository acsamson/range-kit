# Core API Reference

The `@range-kit/core` package provides the foundational logic for range management. It consists of a high-level `SelectionManager` and several lower-level modules.

## SelectionManager

The `SelectionManager` is the primary entry point for most applications. It orchestrates serialization, highlighting, and interaction handling.

### Constructor

```typescript
new SelectionManager(options: SelectionManagerOptions)
```

**Options (`SelectionManagerOptions`):**

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `container` | `HTMLElement \| string` | **Required** | The DOM element (or its ID) where selections will be managed. |
| `hooks` | `SelectionHooks` | `{}` | Optional lifecycle hooks for selection events. |
| `config` | `SelectionConfig` | `{}` | Configuration for highlighting and serialization behavior. |

### Methods

#### `setSelectionById(id: string, range: Range)`
Manually registers a selection with a specific ID.
- **id**: Unique identifier for the selection.
- **range**: The DOM Range object to select.

#### `removeSelection(id: string)`
Removes a specific selection by its ID and clears its highlight.

#### `removeAllSelections()`
Clears all active selections and highlights managed by this instance.

#### `getSelections(): Map<string, SerializedSelection>`
Returns a map of all current persistent selections.

#### `dispose()`
Destroys the manager instance, removes all event listeners, and clears highlights.

### Events

The manager extends `EventEmitter` and supports the following events:

```typescript
manager.on(eventType, handler);
```

| Event Type | Argument | Description |
| :--- | :--- | :--- |
| `range-selected` | `SelectionInteractionEvent` | Fired when the user finishes selecting text (mouseup). |
| `range-clicked` | `SelectionInteractionEvent` | Fired when a highlighted selection is clicked. |
| `range-hover` | `SelectionInteractionEvent` | Fired when the mouse hovers over a highlight. |
| `range-contextmenu` | `SelectionInteractionEvent` | Fired on right-click. |

---

## Low-Level Modules

If you need granular control, you can use the underlying modules directly.

### RangeLocator

Responsible for converting between DOM Ranges and serializable JSON.

```typescript
import { createLocator } from '@range-kit/core';
const locator = createLocator();
```

#### `serializeRange(range: Range, container: HTMLElement): SerializedSelection`
Converts a live DOM Range into a persistent JSON object using multiple strategies (ID, Path, Context, Fingerprint).

#### `restoreRange(serialized: SerializedSelection, container: HTMLElement): Promise<RestoreResult>`
Attempts to reconstruct a DOM Range from the serialized data. Returns a result indicating success or failure and the quality of the match.

### Highlighter

Responsible for painting highlights on the screen. It automatically chooses between CSS Highlight API and DOM wrapping.

```typescript
import { createNewHighlighter } from '@range-kit/core';
const highlighter = createNewHighlighter();
```

#### `highlightRange(range: Range, style?: HighlightStyle)`
Visually highlights the given range.

- **style**:
  - `id`: Unique ID for the highlight.
  - `className`: CSS class name to apply.
  - `priority`: Stacking priority (for CSS Highlight API).

#### `removeHighlight(id: string)`
Removes the highlight with the specified ID.

### InteractionManager

Handles mouse events on highlighted text.

```typescript
import { createInteractionManager } from '@range-kit/core';
const interaction = createInteractionManager({ highlighter, container });
```

#### `start()` / `stop()`
Starts or stops listening for DOM events.

---

## Types

### `SerializedSelection`
The persistent JSON format for a selection.

```typescript
interface SerializedSelection {
  id: string; // Unique identifier
  text: string; // The selected text content
  start: AnchorInfo; // Start position details
  end: AnchorInfo; // End position details
  ... // Other internal metadata
}
```

### `SelectionInteractionEvent`
Payload for interaction events.

```typescript
interface SelectionInteractionEvent {
  event: MouseEvent; // Original DOM event
  selectionId: string; // ID of the interacted selection
  range: Range; // The DOM Range involved
  nativeRange?: Range; // The native browser selection (if applicable)
}
```