# Vue Composables

This package provides a set of Vue Composition API hooks to manage selections, highlights, and user interactions.

## useSelectionRestore

The core composable for managing persistent selections.

```typescript
import { useSelectionRestore } from '@range-kit/vue';

const {
  currentSelections,
  saveCurrentSelection,
  restoreSelections
} = useSelectionRestore(options);
```

### Options (`UseSelectionRestoreOptions`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `rootNodeId` | `string` | **Required** | ID of the root element where selections are managed. |
| `initialSelections` | `SerializedSelection[]` | `[]` | Selections to restore on mount. |
| `selectionStyles` | `SelectionTypeConfig[]` | `[]` | Custom styles for different selection types. |
| `onSelectionAction` | `(event) => void` | - | Callback for user interactions (click, hover, select). |
| `onSelectionSaved` | `(selection) => void` | - | Callback when a selection is successfully serialized. |
| `onSelectionDeleted` | `(id) => void` | - | Callback when a selection is removed. |

### Return Values

| Value | Type | Description |
| :--- | :--- | :--- |
| `currentSelections` | `Ref<SerializedSelection[]>` | Reactive array of active persistent selections. |
| `saveCurrentSelection` | `(id?, type?, autoHighlight?) => Promise` | Serializes the current DOM selection and adds it to the state. |
| `restoreSelections` | `(selections) => Promise` | Restores a list of selections to the DOM. |
| `deleteSelection` | `(id) => Promise` | Removes a selection by ID. |
| `clearAllSelections` | `() => void` | Removes all selections. |
| `navigation` | `object` | Helpers for navigating between highlights (see below). |
| `getInstance` | `() => SelectionRestore` | Access the underlying Core instance. |

---

## useSearchHighlight

Manage search functionality with highlighting support.

```typescript
import { useSearchHighlight } from '@range-kit/vue';

const { searchAndHighlight } = useSearchHighlight({
  getInstance: () => instance // from useSelectionRestore
});
```

### Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `getInstance` | `() => SelectionRestore` | Function to get the core instance. |
| `containers` | `string[]` | CSS selectors for search scope (default: `['body']`). |
| `selectionStyles` | `SelectionTypeConfig[]` | Custom styles for search matches. |

### Return Values

| Value | Type | Description |
| :--- | :--- | :--- |
| `searchAndHighlight` | `(keyword, type?, options?) => Promise` | Searches for text and highlights matches. |
| `clearSearchHighlights` | `(keyword?) => void` | Clears highlights for specific or all keywords. |
| `searchResults` | `Ref<SearchResultItem[]>` | Reactive array of current search results and match counts. |

---

## usePopover

Helper for positioning floating UI elements relative to selections. Powered by `floating-ui/vue`.

```typescript
import { usePopover } from '@range-kit/vue';

const { show, hide, floatingStyles, refs } = usePopover();
```

### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `placement` | `Placement` | `'top'` | Preferred position (top, bottom, etc.). |
| `offset` | `number` | `8` | Distance from the selection. |
| `closeOnClickOutside` | `boolean` | `true` | Auto-close when clicking elsewhere. |

### Return Values

| Value | Type | Description |
| :--- | :--- | :--- |
| `show` | `(data) => void` | Shows the popover at a specific position. |
| `hide` | `() => void` | Hides the popover. |
| `visible` | `Ref<boolean>` | Current visibility state. |
| `floatingStyles` | `Ref<CSSProperties>` | Reactive styles to apply to the popover element. |
| `refs` | `object` | Refs to attach to the popover element. |