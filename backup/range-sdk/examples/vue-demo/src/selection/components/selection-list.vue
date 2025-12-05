<template>
  <section class="selections-section">
    <div class="section-header">
      <h3 class="section-title">已保存的选区</h3>
      <span class="selection-count">{{ currentSelections.length }} 个选区</span>
    </div>

    <div class="selections-list">
      <div
        v-for="selection in currentSelections"
        :key="selection.id"
        class="selection-item"
        @click="$emit('selection-click', selection)"
      >
        <div class="selection-content">
          <div class="selection-header">
            <div class="selection-text">
              "{{ selection.text.length > 80 ? selection.text.substring(0, 80) + '...' : selection.text }}"
            </div>
            <div class="selection-type-badge" :class="`type-${selection.type || 'default'}`">
              {{ getTypeConfig(selection.type || 'default')?.icon || '✨' }}
              {{ getTypeConfig(selection.type || 'default')?.label || '默认高亮' }}
            </div>
          </div>
          <div class="selection-meta">
            <span class="meta-item">
              <span class="meta-label">时间:</span>
              <span class="meta-value">{{ formatDate(selection.timestamp) }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">ID:</span>
              <span class="meta-value">{{ selection.id.substring(0, 8) }}...</span>
            </span>
          </div>
        </div>
        <div class="selection-actions">
          <button
            @click.stop="$emit('restore-selection', selection)"
            class="action-btn restore-btn"
            title="恢复此选区"
          >
            🔄
          </button>
          <button
            @click.stop="$emit('delete-selection', selection.id)"
            class="action-btn delete-btn"
            title="删除此选区"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// 定义组件属性
defineProps({
  // 当前选区列表
  currentSelections: {
    type: Array,
    default: () => []
  },
  // 获取类型配置函数
  getTypeConfig: {
    type: Function,
    required: true
  }
})

// 定义事件
defineEmits([
  'selection-click',
  'restore-selection',
  'delete-selection'
])

// 格式化日期
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>