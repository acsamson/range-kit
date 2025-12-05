<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="popoverRef"
      class="selection-popover"
      :style="popoverStyle"
    >
      <!-- 气泡箭头 -->
      <div class="popover-arrow" :style="arrowStyle"></div>

      <!-- 动态按钮：保存或移除 -->
      <div class="popover-actions">
        <button
          v-if="mode === 'save'"
          @click="handleSaveSelection"
          class="action-btn save-btn"
          :disabled="isSaving"
        >
          <span class="btn-icon">💾</span>
          {{ isSaving ? '保存中...' : '保存当前选区' }}
        </button>

        <button
          v-else-if="mode === 'remove'"
          @click="handleRemoveSelection"
          class="action-btn remove-btn"
          :disabled="isRemoving"
        >
          <span class="btn-icon">🗑️</span>
          {{ isRemoving ? '移除中...' : '移除当前选区' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'

// 定义Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectionData: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'save', // 'save' 或 'remove'
    validator: (value) => ['save', 'remove'].includes(value)
  }
})

// 定义Emits
const emit = defineEmits([
  'save-selection',
  'remove-selection',
  'close'
])

// 响应式数据
const popoverRef = ref(null)
const isSaving = ref(false)
const isRemoving = ref(false)

// 气泡位置计算 - 简化版本，横向显示，避免遮挡文字
const popoverStyle = computed(() => {
  if (!props.selectionData.position) {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999
    }
  }

  const { x, y, width, height } = props.selectionData.position
  const popoverWidth = 180 // 进一步减小宽度，只有一个按钮
  const popoverHeight = 48  // 减小高度，只显示按钮行
  const arrowSize = 6
  const margin = 12

  // 优先显示在选区上方，确保不遮挡文字
  let top = y - popoverHeight - arrowSize - margin
  let left = x + width / 2 - popoverWidth / 2

  // 检查边界并调整位置
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // 水平边界检查
  if (left < margin) {
    left = margin
  } else if (left + popoverWidth > viewportWidth - margin) {
    left = viewportWidth - popoverWidth - margin
  }

  // 垂直边界检查 - 如果上方空间不够，显示在选区下方
  let position = 'top'
  if (top < margin) {
    top = y + height + arrowSize + margin
    position = 'bottom'
  }

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${popoverWidth}px`,
    zIndex: 9999,
    '--arrow-position': position
  }
})

// 箭头样式
const arrowStyle = computed(() => {
  const position = popoverStyle.value['--arrow-position']

  if (position === 'center') {
    return { display: 'none' }
  }

  if (position === 'bottom') {
    return {
      top: '-8px',
      borderBottomColor: '#ffffff',
      borderTopColor: 'transparent'
    }
  }

  // 默认位置（top）
  return {
    bottom: '-8px',
    borderTopColor: '#ffffff',
    borderBottomColor: 'transparent'
  }
})

// 事件处理方法
const handleSaveSelection = async () => {
  isSaving.value = true
  try {
    emit('save-selection', props.selectionData)
  } finally {
    isSaving.value = false
  }
}

const handleRemoveSelection = async () => {
  isRemoving.value = true
  try {
    emit('remove-selection', props.selectionData)
  } finally {
    isRemoving.value = false
  }
}

const handleClose = () => {
  emit('close')
}

// 点击外部关闭
const handleClickOutside = (event) => {
  if (props.visible && popoverRef.value && !popoverRef.value.contains(event.target)) {
    handleClose()
  }
}

// 监听visible变化，添加/移除全局点击事件
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside, true)
    })
  } else {
    document.removeEventListener('click', handleClickOutside, true)
  }
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style scoped>
/* 简化的气泡组件样式 */
.selection-popover {
  --primary-color: #2563eb;
  --danger-color: #dc2626;
  --background-primary: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-color: #e2e8f0;
  --shadow-lg: 0 8px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
  --radius: 8px;

  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  backdrop-filter: blur(8px);
}

.popover-arrow {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--background-primary);
  border-bottom: 6px solid transparent;
}

.popover-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: calc(var(--radius) / 2);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex: 1;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 0.875rem;
}

.save-btn {
  background: var(--primary-color);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.remove-btn {
  background: var(--danger-color);
  color: white;
}

.remove-btn:hover:not(:disabled) {
  background: #b91c1c;
}

/* 动画效果 */
.selection-popover {
  animation: popoverEnter 0.15s ease-out;
}

@keyframes popoverEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .popover-actions {
    flex-direction: column;
    padding: 0.5rem;
  }

  .action-btn {
    font-size: 0.8rem;
    padding: 0.6rem 1rem;
  }
}
</style>