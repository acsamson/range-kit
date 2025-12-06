<template>
  <section class="control-panel">
    <div class="panel-header">
      <h2 class="panel-title">功能控制面板</h2>
      <div class="selection-count">
        已保存选区: <span class="count-badge">{{ currentSelections.length }}</span>
      </div>
    </div>

    <div class="control-grid">
      <!-- 选区类型 -->
      <div class="control-group">
        <h3 class="group-title">选区类型</h3>

        <!-- 类型选择器 -->
        <div class="type-selector">
          <label class="type-label">选中文本后将使用此类型高亮:</label>
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
            @click="$emit('clear-highlights')"
            :disabled="!isInitialized"
            class="btn btn-outline"
          >
            <span class="btn-icon">🧹</span>
            清除所有高亮
          </button>
          <button
            @click="$emit('print-data')"
            :disabled="!isInitialized || currentSelections.length === 0"
            class="btn btn-outline"
          >
            <span class="btn-icon">🖨️</span>
            打印数据
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
  'clear-highlights',
  'restore-all-selections',
  'export-data',
  'print-data',
  'clear-all',
  'update:selectedSelectionType'
])

// 当前选择的选区类型（使用 computed 实现 v-model）
const selectedSelectionType = computed({
  get: () => props.selectedSelectionType,
  set: (value) => emit('update:selectedSelectionType', value)
})
</script>

<style scoped>
/* 控制面板主容器 - 企业简洁风格 */
.control-panel {
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.selection-count {
  font-size: 13px;
  color: #6b7280;
}

.count-badge {
  background: #f3f4f6;
  color: #1f2937;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  margin-left: 6px;
  font-size: 12px;
}

/* 侧边栏内使用单列布局 */
.control-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 768px) {
  .control-grid {
    flex-direction: column;
  }
}

.control-group {
  background: #fafafa;
  border-radius: 6px;
  padding: 14px;
  border: 1px solid #e5e7eb;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.type-selector {
  margin-bottom: 0;
}

.type-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.type-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  font-size: 13px;
}

.type-select:focus {
  outline: none;
  border-color: #6b7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.1);
}

.type-select option {
  background: white;
  color: #1f2937;
}

.type-preview {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  background: #f9fafb;
  border-left: 3px solid #6b7280;
  color: #6b7280;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 按钮基础样式 - 企业简洁风格 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  background: white;
  color: #374151;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.btn-primary {
  background: #ffffff;
  color: #059669;
  border-color: #059669;
}

.btn-primary:hover:not(:disabled) {
  background: #ecfdf5;
}

.btn-success {
  background: #ffffff;
  color: #0284c7;
  border-color: #0284c7;
}

.btn-success:hover:not(:disabled) {
  background: #f0f9ff;
}

.btn-info {
  background: #ffffff;
  color: #2563eb;
  border-color: #2563eb;
}

.btn-info:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-danger {
  background: #ffffff;
  color: #dc2626;
  border-color: #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-outline {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
}

/* 类型预览样式 - 企业配色 */
.type-default {
  border-left-color: #6b7280;
}

.type-highlight {
  border-left-color: #9ca3af;
}

.type-annotation {
  border-left-color: #6b7280;
}

.type-bookmark {
  border-left-color: #9ca3af;
}
</style>