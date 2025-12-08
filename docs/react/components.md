# React Components

## SelectionPopover

A flexible, portal-based component for displaying floating UI elements (like toolbars or menus) anchored to a text selection. It uses `floating-ui` for precise positioning.

```typescript
import { SelectionPopover } from '@range-kit/react';

<SelectionPopover
  visible={isVisible}
  data={popoverData}
  onClose={handleClose}
>
  <MyToolbar />
</SelectionPopover>
```

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `visible` | `boolean` | **Required** | Controls the visibility of the popover. |
| `data` | `PopoverData` | - | Positioning data, usually coming from `usePopover` or `onSelectionAction`. |
| `onClose` | `() => void` | - | Callback fired when the popover should close (e.g., click outside). |
| `placement` | `Placement` | `'top'` | Preferred side (`top`, `bottom`, `left`, `right`). |
| `offsetDistance` | `number` | `8` | Distance in pixels from the selection. |
| `closeOnClickOutside` | `boolean` | `true` | Whether to close when clicking outside the popover. |
| `closeOnScroll` | `boolean` | `true` | Whether to close when the page is scrolled. |
| `autoHideDelay` | `number` | `0` | If > 0, automatically closes after N ms. |
| `className` | `string` | - | Custom CSS class. |
| `style` | `CSSProperties` | - | Custom inline styles. |

### Usage Example

```tsx
import { useSelectionRestore, SelectionPopover } from '@range-kit/react';

function App() {
  const [popoverData, setPopoverData] = useState(null);
  
  const handleSelectionAction = (event) => {
    if (event.type === 'created' || event.type === 'click') {
      setPopoverData({
        position: event.position,
        // ...
      });
    }
  };

  useSelectionRestore({
    // ...
    onSelectionAction: handleSelectionAction
  });

  return (
    <>
      <div id="content">...</div>
      <SelectionPopover
        visible={!!popoverData}
        data={popoverData}
        onClose={() => setPopoverData(null)}
      >
        <button onClick={saveSelection}>Save</button>
      </SelectionPopover>
    </>
  );
}
```