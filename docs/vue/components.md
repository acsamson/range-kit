# Vue Components

## SelectionPopover

A flexible, Teleport-based component for displaying floating UI elements (like toolbars or menus) anchored to a text selection. It uses `floating-ui/vue` for precise positioning.

```vue
<template>
  <SelectionPopover
    v-model:visible="isVisible"
    :data="popoverData"
    @close="handleClose"
  >
    <MyToolbar />
  </SelectionPopover>
</template>

<script setup>
import { SelectionPopover } from '@range-kit/vue';
</script>
```

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `visible` | `boolean` | `false` | Controls the visibility (supports v-model). |
| `data` | `PopoverData` | - | Positioning data, usually coming from `usePopover` or `onSelectionAction`. |
| `placement` | `Placement` | `'top'` | Preferred side (`top`, `bottom`, `left`, `right`). |
| `offsetDistance` | `number` | `8` | Distance in pixels from the selection. |
| `padding` | `number` | `8` | Minimum distance from viewport edges. |
| `flip` | `boolean` | `true` | Whether to flip placement if space is insufficient. |
| `shift` | `boolean` | `true` | Whether to shift position to stay in viewport. |
| `closeOnClickOutside` | `boolean` | `true` | Whether to close when clicking outside. |
| `closeOnScroll` | `boolean` | `true` | Whether to close when the page is scrolled. |
| `autoHideDelay` | `number` | `0` | If > 0, automatically closes after N ms. |
| `popoverClass` | `string \| object` | - | Custom CSS class. |
| `popoverStyle` | `object` | - | Custom inline styles. |

### Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `close` | - | Emitted when the popover requests to close. |
| `update:visible` | `boolean` | Emitted to update the `visible` prop (v-model). |

### Usage Example

```vue
<script setup>
import { ref } from 'vue';
import { useSelectionRestore, SelectionPopover } from '@range-kit/vue';

const popoverData = ref(null);
const isVisible = ref(false);

const { saveCurrentSelection } = useSelectionRestore({
  rootNodeId: 'content',
  onSelectionAction: (event) => {
    if (event.type === 'created' || event.type === 'click') {
      popoverData.value = {
        position: event.position
      };
      isVisible.value = true;
    }
  }
});
</script>

<template>
  <div id="content">...</div>
  
  <SelectionPopover
    v-model:visible="isVisible"
    :data="popoverData"
  >
    <button @click="saveCurrentSelection()">Save</button>
  </SelectionPopover>
</template>
```