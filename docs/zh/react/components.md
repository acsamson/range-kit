# React 组件

## SelectionPopover

一个灵活的、基于 Portal 的组件，用于显示固定在文本选区上的浮动 UI 元素（如工具栏或菜单）。它使用 `floating-ui` 进行精确定位。

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

### 属性 (Props)

| 属性 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `visible` | `boolean` | **必填** | 控制 Popover 的可见性。 |
| `data` | `PopoverData` | - | 定位数据，通常来自 `usePopover` 或 `onSelectionAction`。 |
| `onClose` | `() => void` | - | 当 Popover 应该关闭时触发的回调（例如点击外部）。 |
| `placement` | `Placement` | `'top'` | 首选侧边 (`top`, `bottom`, `left`, `right`)。 |
| `offsetDistance` | `number` | `8` | 距离选区的像素距离。 |
| `closeOnClickOutside` | `boolean` | `true` | 点击 Popover 外部时是否关闭。 |
| `closeOnScroll` | `boolean` | `true` | 页面滚动时是否关闭。 |
| `autoHideDelay` | `number` | `0` | 如果 > 0，则在 N 毫秒后自动关闭。 |
| `className` | `string` | - | 自定义 CSS 类名。 |
| `style` | `CSSProperties` | - | 自定义内联样式。 |

### 使用示例

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
        <button onClick={saveSelection}>保存</button>
      </SelectionPopover>
    </>
  );
}
```