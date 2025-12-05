<!--
  词汇选择面板组件
  允许用户选择要高亮的词汇列表
-->
<template>
  <div class="panel-section">
    <div class="section-header">
      <h3 class="section-title">高亮词汇选择</h3>
      <div class="header-buttons">
        <button
          v-if="hasSelectedWords"
          class="apply-btn"
          @click="emit('apply-selection')"
        >
          应用选择
        </button>
        <button
          class="clear-highlights-btn-header"
          @click="emit('clear-highlights')"
        >
          清除高亮
        </button>
      </div>
    </div>

    <div class="selection-controls">
      <label class="select-all-checkbox">
        <input
          type="checkbox"
          :checked="isAllSelected"
          :indeterminate="isPartialSelected"
          @change="toggleSelectAll"
        >
        <span class="checkbox-label">全选 ({{ selectedWords.size }}/{{ availableWords.length }})</span>
      </label>

      <div class="control-buttons">
        <button
          v-if="hasSelectedWords"
          class="clear-selection-btn-inline"
          @click="clearSelection"
        >
          清除选择
        </button>
      </div>
    </div>

    <div class="word-list">
      <div
        v-for="word in availableWords"
        :key="word"
        class="word-item"
        :class="{ selected: selectedWords.has(word) }"
        @click="toggleWord(word)"
      >
        <input
          type="checkbox"
          :checked="selectedWords.has(word)"
          class="word-checkbox"
          @click.stop="toggleWord(word)"
        />
        <span class="word-text">{{ word }}</span>
        <span class="word-badge">词汇</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 接收props
const props = defineProps<{
  availableWords: string[]
  selectedWords: Set<string>
}>()

// 定义事件
const emit = defineEmits<{
  'apply-selection': []
  'update:selectedWords': [value: Set<string>]
  'clear-highlights': []
}>()

// 计算属性
const hasSelectedWords = computed(() => props.selectedWords.size > 0)
const isAllSelected = computed(() =>
  props.availableWords.length > 0 && props.selectedWords.size === props.availableWords.length
)
const isPartialSelected = computed(() =>
  props.selectedWords.size > 0 && props.selectedWords.size < props.availableWords.length
)

// 切换单个词汇选择状态
const toggleWord = (word: string) => {
  const newSet = new Set(props.selectedWords)
  if (newSet.has(word)) {
    newSet.delete(word)
  } else {
    newSet.add(word)
  }
  emit('update:selectedWords', newSet)
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    emit('update:selectedWords', new Set())
  } else {
    // 全选
    emit('update:selectedWords', new Set(props.availableWords))
  }
}

// 清除所有选择
const clearSelection = () => {
  emit('update:selectedWords', new Set())
}
</script>

<style scoped>
/* 词汇选择面板样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.selection-controls {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
}

.select-all-checkbox input {
  margin-right: 0.5rem;
  cursor: pointer;
}

.checkbox-label {
  color: #495057;
  font-size: 14px;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
}

.clear-selection-btn-inline {
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #f56c6c;
  color: white;
}

.clear-selection-btn-inline:hover {
  background: #f78989;
}

.word-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
}

.word-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.word-item:last-child {
  border-bottom: none;
}

.word-item:hover {
  background: #f5f7fa;
}

.word-item.selected {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.word-checkbox {
  margin-right: 0.75rem;
  cursor: pointer;
}

.word-text {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.word-badge {
  font-size: 11px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 400;
}


.apply-btn,
.clear-highlights-btn-header {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-btn {
  background: #67c23a;
  color: white;
}

.apply-btn:hover {
  background: #85ce61;
}

.clear-highlights-btn-header {
  background: #909399;
  color: white;
}

.clear-highlights-btn-header:hover {
  background: #a6a9ad;
}
</style>