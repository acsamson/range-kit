<template>
  <div class="selection-demo">
    <!-- 导航栏 -->
    <NavigationBar />

    <!-- 主要内容 - 左右布局 -->
    <main class="main-content">
      <div class="layout-container">
        <!-- 左侧侧边栏 - 配置区域 -->
        <aside class="sidebar">
          <!-- 状态指示器 -->
          <StatusIndicator
            :is-initialized="isInitialized"
            :error="error"
          />

          <!-- 控制面板 -->
          <ControlPanel
            :selected-selection-type="selectedSelectionType"
            @update:selected-selection-type="selectedSelectionType = $event"
            :is-initialized="isInitialized"
            :is-loading="isLoading"
            :current-selections="currentSelections"
            :available-types="availableTypes"
            :get-type-config="getTypeConfig"
            @clear-highlights="handleClearHighlights"
            @restore-all-selections="handleRestoreAllSelections"
            @export-data="handleExportData"
            @print-data="handlePrintData"
            @clear-all="handleClearAll"
          />

          <!-- 选区列表 -->
          <SelectionList
            v-if="currentSelections.length > 0"
            :current-selections="currentSelections"
            :get-type-config="getTypeConfig"
            @selection-click="handleSelectionClick"
            @restore-selection="handleRestoreSelection"
            @delete-selection="handleDeleteSelection"
          />

          <!-- 空状态 -->
          <EmptyState v-else />
        </aside>

        <!-- 右侧主内容区域 -->
        <section class="main-panel">
          <!-- 预设数据按钮栏 -->
          <PresetDataBar
            :is-initialized="isInitialized"
            :is-loading="isLoading"
            @load-mock-data="handleLoadMockData"
            @load-mock-data-and-search="handleLoadMockDataAndSearch"
            @clear-preset="handleClearPreset"
            @search-with-filter="handleSearchWithFilter"
            @search-filter-first="handleSearchFilterFirst"
          />

          <!-- 搜索高亮筛选栏 -->
          <SearchHighlight
            :is-initialized="isInitialized"
            :keywords="searchKeywords"
            :keyword-results="searchResults"
            :available-types="searchAvailableTypes"
            :get-type-config="getSearchTypeConfig"
            :default-type="selectedSelectionType"
            @add-keyword="handleAddSearchKeyword"
            @remove-keyword="handleRemoveSearchKeyword"
            @clear-all="handleClearSearchKeywords"
          />

          <!-- 高亮导航控制栏 -->
          <HighlightNavigator
            :current-index="navigation.currentIndex.value"
            :total="navigation.total.value"
            @go-prev="navigation.goToPrev"
            @go-next="navigation.goToNext"
            @reset="navigation.reset"
          />

          <!-- 演示文本区域 -->
          <DemoTextArea
            ref="demoTextAreaRef"
            @text-selection="handleTextSelection"
          />
        </section>
      </div>
    </main>

    <!-- 选区操作气泡（新版统一组件） -->
    <SelectionPopover
      :visible="popoverVisible"
      :popover-data="popoverData"
      @save-item="handleSaveItem"
      @delete-item="handleDeleteItem"
      @close="handlePopoverClose"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import SelectionPopover from './components/popover.vue'

// 导入拆分后的组件
import NavigationBar from './components/navigation-bar.vue'
import StatusIndicator from './components/status-indicator.vue'
import ControlPanel from './components/control-panel.vue'
import DemoTextArea from './components/demo-text-area.vue'
import SelectionList from './components/selection-list.vue'
import EmptyState from './components/empty-state.vue'
import SearchHighlight from './components/search-highlight.vue'
import PresetDataBar from './components/preset-data-bar.vue'
import HighlightNavigator from './components/highlight-navigator.vue'

// 导入页面管理hook
import { usePage } from './hooks/use-page'

// 使用页面管理hook
const {
  // refs
  demoTextAreaRef,
  selectedSelectionType,

  // 气泡状态（新 API）
  popoverVisible,
  popoverData,

  // SDK状态
  isInitialized,
  currentSelections,
  isLoading,
  error,
  availableTypes,
  getTypeConfig,

  // 搜索高亮状态
  searchKeywords,
  searchResults,
  searchAvailableTypes,
  getSearchTypeConfig,

  // 事件处理函数
  handleTextSelection,
  handleClearHighlights,
  handleRestoreAllSelections,
  handleRestoreSelection,
  handleDeleteSelection,
  handleClearAll,
  handleExportData,
  handlePrintData,
  handleSelectionClick,
  // 新 API
  handleSaveItem,
  handleDeleteItem,
  handlePopoverClose,

  // 搜索高亮事件处理函数
  handleAddSearchKeyword,
  handleRemoveSearchKeyword,
  handleClearSearchKeywords,

  // 预设数据处理函数
  handleLoadMockData,
  handleLoadMockDataAndSearch,
  handleClearPreset,
  handleSearchWithFilter,
  handleSearchFilterFirst,

  // 导航功能
  navigation,

  // 初始化函数
  initialize
} = usePage()

// 组件挂载后的初始化
onMounted(async () => {
  await initialize()
})
</script>

<style>
@import './styles/index.css';
</style>