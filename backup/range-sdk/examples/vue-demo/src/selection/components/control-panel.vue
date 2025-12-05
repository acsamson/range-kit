<template>
  <section class="control-panel">
    <div class="panel-header">
      <h2 class="panel-title">功能控制面板</h2>
      <div class="selection-count">
        已保存选区: <span class="count-badge">{{ currentSelections.length }}</span>
      </div>
    </div>

    <div class="control-grid">
      <!-- 选区操作 -->
      <div class="control-group">
        <h3 class="group-title">选区操作</h3>

        <!-- 类型选择器 -->
        <div class="type-selector">
          <label class="type-label">选区类型:</label>
          <select v-model="selectedSelectionType" class="type-select">
            <option
              v-for="typeConfig in availableTypes"
              :key="typeConfig.type"
              :value="typeConfig.type"
            >
              {{ typeConfig.icon }} {{ typeConfig.label }}
            </option>
          </select>
          <div class="type-preview" :class="`type-${selectedSelectionType}`">
            {{ getTypeConfig(selectedSelectionType)?.description || '默认样式预览' }}
          </div>
        </div>

        <div class="button-group">
          <button
            @click="$emit('save-selection')"
            :disabled="!isInitialized || isLoading"
            class="btn btn-primary"
          >
            <span class="btn-icon">💾</span>
            保存当前选区
          </button>
          <button
            @click="$emit('clear-highlights')"
            :disabled="!isInitialized"
            class="btn btn-outline"
          >
            <span class="btn-icon">🧹</span>
            清除所有高亮
          </button>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="control-group">
        <h3 class="group-title">批量操作</h3>
        <div class="button-group">
          <button
            @click="$emit('restore-all-selections')"
            :disabled="!isInitialized || currentSelections.length === 0"
            class="btn btn-success"
          >
            <span class="btn-icon">🔄</span>
            恢复所有选区
          </button>
          <button
            @click="$emit('clear-all')"
            :disabled="!isInitialized || currentSelections.length === 0"
            class="btn btn-danger"
          >
            <span class="btn-icon">🗑️</span>
            清空所有数据
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

// 定义组件属性
const props = defineProps({
  // SDK初始化状态
  isInitialized: {
    type: Boolean,
    default: false
  },
  // 加载状态
  isLoading: {
    type: Boolean,
    default: false
  },
  // 当前选区列表
  currentSelections: {
    type: Array,
    default: () => []
  },
  // 可用的选区类型
  availableTypes: {
    type: Array,
    default: () => []
  },
  // 获取类型配置函数
  getTypeConfig: {
    type: Function,
    required: true
  },
  // 当前选择的选区类型
  selectedSelectionType: {
    type: String,
    default: 'default'
  }
})

// 定义事件
const emit = defineEmits([
  'save-selection',
  'clear-highlights',
  'restore-all-selections',
  'clear-all',
  'update:selectedSelectionType'
])

// 当前选择的选区类型（使用 computed 实现 v-model）
const selectedSelectionType = computed({
  get: () => props.selectedSelectionType,
  set: (value) => emit('update:selectedSelectionType', value)
})
</script>