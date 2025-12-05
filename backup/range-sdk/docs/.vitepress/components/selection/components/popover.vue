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

      <!-- 选区列表 -->
      <div class="selection-list">
        <div class="list-header">
          <span class="header-title">{{ headerTitle }}</span>
        </div>

        <div class="list-content">
          <div
            v-for="item in popoverData.items"
            :key="item.id"
            class="selection-item"
            :class="[`item-${item.itemType}`]"
          >
            <!-- 类型标签 -->
            <span class="item-type-badge" :class="[`badge-${item.itemType}`]">
              {{ getTypeLabel(item) }}
            </span>

            <!-- 文本内容 -->
            <span class="item-text" :title="item.text">
              {{ truncateText(item.text, 20) }}
            </span>

            <!-- 操作按钮 -->
            <div class="item-actions">
              <!-- 已保存选区：显示删除按钮 -->
              <button
                v-if="item.itemType === 'saved'"
                class="action-btn delete-btn"
                @click="handleDeleteItem(item)"
                :disabled="isProcessing"
                title="删除选区"
              >
                🗑️
              </button>

              <!-- 搜索高亮或新划选：显示保存按钮 -->
              <button
                v-if="item.itemType === 'search' || item.itemType === 'new'"
                class="action-btn save-btn"
                @click="handleSaveItem(item)"
                :disabled="isProcessing"
                title="保存为选区"
              >
                💾
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import type { SelectionItem, PopoverData } from '../hooks/use-popover'

// 定义 Props
const props = defineProps<{
  visible: boolean
  popoverData: PopoverData
}>()

// 定义 Emits
const emit = defineEmits<{
  (e: 'save-item', item: SelectionItem): void
  (e: 'delete-item', item: SelectionItem): void
  (e: 'close'): void
}>()

// 响应式状态
const popoverRef = ref<HTMLElement | null>(null)
const isProcessing = ref(false)

/**
 * 标题计算
 */
const headerTitle = computed(() => {
  const items = props.popoverData.items
  const savedCount = items.filter(i => i.itemType === 'saved').length
  const searchCount = items.filter(i => i.itemType === 'search').length
  const newCount = items.filter(i => i.itemType === 'new').length

  if (items.length === 1) {
    if (savedCount === 1) return '选区操作'
    if (searchCount === 1) return '搜索结果'
    if (newCount === 1) return '新建选区'
  }

  const parts: string[] = []
  if (savedCount > 0) parts.push(`${savedCount} 个选区`)
  if (searchCount > 0) parts.push(`${searchCount} 个搜索`)
  if (newCount > 0) parts.push(`${newCount} 个新选`)

  return parts.join(' + ') || '选区操作'
})

/**
 * 获取类型标签
 */
const getTypeLabel = (item: SelectionItem): string => {
  switch (item.itemType) {
    case 'saved':
      return '已保存'
    case 'search':
      return '搜索'
    case 'new':
      return '新选'
    default:
      return ''
  }
}

/**
 * 截断文本
 */
const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

/**
 * 处理保存选区项
 */
const handleSaveItem = async (item: SelectionItem) => {
  isProcessing.value = true
  try {
    emit('save-item', item)
  } finally {
    isProcessing.value = false
  }
}

/**
 * 处理删除选区项
 */
const handleDeleteItem = async (item: SelectionItem) => {
  isProcessing.value = true
  try {
    emit('delete-item', item)
  } finally {
    isProcessing.value = false
  }
}

/**
 * 关闭气泡
 */
const handleClose = () => {
  emit('close')
}

// 气泡位置计算
const popoverStyle = computed(() => {
  if (!props.popoverData.position) {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999
    }
  }

  const { x, y, width, height } = props.popoverData.position
  const itemCount = props.popoverData.items.length

  // 动态计算尺寸
  const popoverWidth = 260
  const popoverHeight = 44 + Math.min(itemCount, 5) * 44 // 限制最多显示5个

  const arrowSize = 6
  const margin = 12

  // 优先显示在选区上方
  let top = y - popoverHeight - arrowSize - margin
  let left = x + width / 2 - popoverWidth / 2

  // 边界检查
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  if (left < margin) {
    left = margin
  } else if (left + popoverWidth > viewportWidth - margin) {
    left = viewportWidth - popoverWidth - margin
  }

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

  return {
    bottom: '-8px',
    borderTopColor: '#ffffff',
    borderBottomColor: 'transparent'
  }
})

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (props.visible && popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    handleClose()
  }
}

// 延迟注册定时器引用
let registerTimer: ReturnType<typeof setTimeout> | null = null

// 监听 visible 变化
watch(() => props.visible, (newVisible) => {
  // 清理之前的定时器
  if (registerTimer) {
    clearTimeout(registerTimer)
    registerTimer = null
  }

  if (newVisible) {
    // 延迟到下一个事件循环再注册监听器
    // 确保触发显示的点击事件已完全处理完毕
    registerTimer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      registerTimer = null
    }, 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (registerTimer) {
    clearTimeout(registerTimer)
  }
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 气泡容器 */
.selection-popover {
  --primary-color: #2563eb;
  --success-color: #16a34a;
  --danger-color: #dc2626;
  --warning-color: #d97706;
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
  animation: popoverEnter 0.15s ease-out;
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

/* 列表样式 */
.selection-list {
  padding: 0.5rem;
}

.list-header {
  padding: 0.25rem 0.5rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
}

.header-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 220px;
  overflow-y: auto;
}

/* 选区项样式 */
.selection-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: 6px;
  transition: all 0.15s;
}

/* 已保存选区 */
.item-saved {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.item-saved:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* 搜索高亮 */
.item-search {
  background: #fefce8;
  border: 1px solid #fde047;
}

.item-search:hover {
  background: #fef9c3;
  border-color: #facc15;
}

/* 新划选 */
.item-new {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.item-new:hover {
  background: #dcfce7;
  border-color: #4ade80;
}

/* 类型标签 */
.item-type-badge {
  flex-shrink: 0;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
}

.badge-saved {
  background: #dc2626;
  color: white;
}

.badge-search {
  background: #d97706;
  color: white;
}

.badge-new {
  background: #16a34a;
  color: white;
}

/* 文本内容 */
.item-text {
  flex: 1;
  font-size: 0.75rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮 */
.item-actions {
  flex-shrink: 0;
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.action-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn {
  background: var(--danger-color);
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #b91c1c;
}

.save-btn {
  background: var(--primary-color);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

/* 动画 */
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

/* 滚动条样式 */
.list-content::-webkit-scrollbar {
  width: 4px;
}

.list-content::-webkit-scrollbar-track {
  background: transparent;
}

.list-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.list-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
