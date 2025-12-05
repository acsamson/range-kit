<template>
  <div class="selection-demo">
    <!-- 主要内容 -->
    <main class="main-content">
      <div class="content-container">
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
          @save-selection="handleSaveSelection"
          @clear-highlights="handleClearHighlights"
          @restore-all-selections="handleRestoreAllSelections"
          @clear-all="handleClearAll"
        />

        <!-- 演示文本区域 -->
        <DemoTextArea
          ref="demoTextAreaRef"
          @text-selection="handleTextSelection"
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
      </div>
    </main>

    <!-- 选区操作气泡 -->
    <SelectionPopover
      :visible="popoverVisible"
      :selection-data="currentBehaviorData"
      :mode="popoverMode"
      @save-selection="handlePopoverSaveSelection"
      @remove-selection="handlePopoverRemoveSelection"
      @close="handlePopoverClose"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import SelectionPopover from './components/popover.vue'

// 导入拆分后的组件
import StatusIndicator from './components/status-indicator.vue'
import ControlPanel from './components/control-panel.vue'
import DemoTextArea from './components/demo-text-area.vue'
import SelectionList from './components/selection-list.vue'
import EmptyState from './components/empty-state.vue'

// 导入页面管理hook
import { usePage } from './hooks/use-page'

// 使用页面管理hook
const {
  // refs
  demoTextAreaRef,
  selectedSelectionType,

  // 气泡状态
  popoverVisible,
  popoverMode,
  currentBehaviorData,

  // SDK状态
  isInitialized,
  currentSelections,
  isLoading,
  error,
  availableTypes,
  getTypeConfig,

  // 事件处理函数
  handleTextSelection,
  handleSaveSelection,
  handleClearHighlights,
  handleRestoreAllSelections,
  handleRestoreSelection,
  handleDeleteSelection,
  handleClearAll,
  handleSelectionClick,
  handlePopoverSaveSelection,
  handlePopoverRemoveSelection,
  handlePopoverClose,

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