# Vue 组件

## SelectionPopover

一个灵活的、基于 Teleport 的组件，用于显示固定在文本选区上的浮动 UI 元素（如工具栏或菜单）。它使用 `floating-ui/vue` 进行精确定位。

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

### 属性 (Props)

| 属性 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `visible` | `boolean` | `false` | 控制可见性（支持 v-model）。 |
| `data` | `PopoverData` | - | 定位数据，通常来自 `usePopover` 或 `onSelectionAction`。 |
| `placement` | `Placement` | `'top'` | 首选侧边 (`top`, `bottom`, `left`, `right`)。 |
| `offsetDistance` | `number` | `8` | 距离选区的像素距离。 |
| `padding` | `number` | `8` | 距离视口边缘的最小距离。 |
| `flip` | `boolean` | `true` | 空间不足时是否翻转位置。 |
| `shift` | `boolean` | `true` | 是否偏移位置以保持在视口内。 |
| `closeOnClickOutside` | `boolean` | `true` | 点击外部时是否关闭。 |
| `closeOnScroll` | `boolean` | `true` | 页面滚动时是否关闭。 |
| `autoHideDelay` | `number` | `0` | 如果 > 0，则在 N 毫秒后自动关闭。 |
| `popoverClass` | `string \| object` | - | 自定义 CSS 类名。 |
| `popoverStyle` | `object` | - | 自定义内联样式。 |

### 事件

| 事件 | 载荷 | 描述 |
| :--- | :--- | :--- |
| `close` | - | 当 Popover 请求关闭时触发。 |
| `update:visible` | `boolean` | 触发以更新 `visible` 属性 (v-model)。 |

### 使用示例

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
    <button @click="saveCurrentSelection()">保存</button>
  </SelectionPopover>
</template>
```