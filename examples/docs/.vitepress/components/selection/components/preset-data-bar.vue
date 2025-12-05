<template>
  <div class="preset-data-bar">
    <span class="preset-label">预设数据：</span>
    <div class="preset-buttons">
      <button
        class="preset-btn"
        :disabled="!isInitialized || isLoading"
        @click="handleLoadMockData"
      >
        加载出师表选区
      </button>
      <button
        class="preset-btn preset-btn-combo"
        :disabled="!isInitialized || isLoading"
        @click="handleLoadMockDataAndSearch"
      >
        加载出师表选区并搜索"中"
      </button>
      <button
        class="preset-btn preset-btn-clear"
        :disabled="!isInitialized || isLoading"
        @click="handleClearPreset"
      >
        清除预设
      </button>
      <button
        class="preset-btn preset-btn-search"
        :disabled="!isInitialized || isLoading"
        @click="handleSearchWithFilter"
      >
        搜索"中"并过滤掉重叠选区
      </button>
      <button
        class="preset-btn preset-btn-search-first"
        :disabled="!isInitialized || isLoading"
        @click="handleSearchFilterFirst"
      >
        搜索"中"过滤重叠并只展示第一个
      </button>
    </div>
    <span class="preset-tip">点击按钮加载预设选区数据进行测试</span>
  </div>
</template>

<script setup lang="ts">
/**
 * 预设数据按钮栏组件
 * 用于快速加载 mock 数据进行测试
 */

interface Props {
  /** SDK 是否已初始化 */
  isInitialized: boolean
  /** 是否正在加载 */
  isLoading: boolean
}

const { isInitialized, isLoading } = defineProps<Props>()

const emit = defineEmits<{
  /** 加载 mock 数据 */
  (e: 'load-mock-data'): void
  /** 加载 mock 数据并搜索"中" */
  (e: 'load-mock-data-and-search'): void
  /** 清除预设数据 */
  (e: 'clear-preset'): void
  /** 搜索并过滤重叠选区 */
  (e: 'search-with-filter'): void
  /** 搜索过滤重叠并只展示第一个 */
  (e: 'search-filter-first'): void
}>()

/**
 * 处理加载 mock 数据
 */
const handleLoadMockData = () => {
  emit('load-mock-data')
}

/**
 * 处理加载 mock 数据并搜索"中"
 */
const handleLoadMockDataAndSearch = () => {
  emit('load-mock-data-and-search')
}

/**
 * 处理清除预设数据
 */
const handleClearPreset = () => {
  emit('clear-preset')
}

/**
 * 处理搜索并过滤重叠选区
 */
const handleSearchWithFilter = () => {
  emit('search-with-filter')
}

/**
 * 处理搜索过滤重叠并只展示第一个
 */
const handleSearchFilterFirst = () => {
  emit('search-filter-first')
}
</script>

<style scoped>
.preset-data-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
}

.preset-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.preset-buttons {
  display: flex;
  gap: 8px;
}

.preset-btn {
  padding: 6px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.preset-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.preset-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-btn-combo {
  color: #059669;
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.preset-btn-combo:hover:not(:disabled) {
  background: #d1fae5;
  border-color: #34d399;
  color: #047857;
}

.preset-btn-clear {
  color: #64748b;
  border-color: #e2e8f0;
}

.preset-btn-clear:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.preset-btn-search {
  color: #1d4ed8;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.preset-btn-search:hover:not(:disabled) {
  background: #dbeafe;
  border-color: #60a5fa;
  color: #1e40af;
}

.preset-btn-search-first {
  color: #7c3aed;
  border-color: #ddd6fe;
  background: #f5f3ff;
}

.preset-btn-search-first:hover:not(:disabled) {
  background: #ede9fe;
  border-color: #a78bfa;
  color: #6d28d9;
}

.preset-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-left: auto;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .preset-data-bar {
    flex-wrap: wrap;
  }

  .preset-tip {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
