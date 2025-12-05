import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useSelectionRestore, useSearchHighlight } from '../../../../../vue/hooks'
import { DEFAULT_SELECTION_TYPES } from '../constants'
import { mockSelections } from '../mock'
import type { SerializedSelection } from '../../../../../src/core/selection-restore'

// 导入拆分的 hooks
import { usePopover } from './use-popover'
import { useSelectionCallbacks } from './use-selection-callbacks'
import { useSelectionActions } from './use-selection-actions'
import { useSearchActions } from './use-search-actions'
import { useDemoActions } from './use-demo-actions'

/**
 * 选区页面管理 Hook
 *
 * @description
 * 组合所有拆分的 hooks，提供完整的选区页面功能：
 * - usePopover: 气泡状态管理
 * - useSelectionCallbacks: 选区行为回调
 * - useSelectionActions: 选区 CRUD 操作
 * - useSearchActions: 搜索高亮操作
 * - useDemoActions: Demo 专用功能
 *
 * @example
 * ```ts
 * const {
 *   // 气泡状态
 *   popoverVisible,
 *   popoverMode,
 *   currentBehaviorData,
 *
 *   // SDK 状态
 *   isInitialized,
 *   currentSelections,
 *
 *   // 操作方法
 *   handlePopoverSaveSelection,
 *   handleAddSearchKeyword,
 *   // ...
 * } = usePage()
 * ```
 */
export function usePage() {
  // ========== 页面状态 ==========
  const demoTextAreaRef = ref<any>(null)
  const selectedSelectionType = ref<string>('default')

  // ========== 气泡状态 ==========
  const popover = usePopover()

  // ========== SDK ==========
  // 使用对象来存储引用，避免闭包捕获旧值的问题
  const refs = {
    getSDKInstance: (() => null) as () => any,
    searchResults: null as any
  }

  // 创建回调函数（需要 popover、getSDKInstance 和 searchResults）
  const callbacks = useSelectionCallbacks({
    popover,
    getSDKInstance: () => refs.getSDKInstance(),
    getSearchResults: () => refs.searchResults
  })

  // 初始化 SDK
  const {
    isInitialized,
    currentSelections,
    isLoading,
    error,
    availableTypes,
    getTypeConfig,
    getSDKInstance,
    // 核心方法
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData,
    // 导航功能
    navigation
  } = useSelectionRestore({
    appId: 'selection-demo',
    containers: ['.demo-text-container'],
    selectionStyles: DEFAULT_SELECTION_TYPES,
    // 使用统一的选区动作回调
    onSelectionAction: callbacks.onSelectionAction,
    onSelectionSaved: () => {
      popover.hidePopover()
    }
  })

  // 更新引用
  refs.getSDKInstance = getSDKInstance

  // ========== 搜索高亮 ==========
  const {
    searchKeywords,
    searchResults,
    availableTypes: searchAvailableTypes,
    getTypeConfig: getSearchTypeConfig,
    addSearchKeyword,
    removeSearchKeyword,
    clearSearchHighlights
  } = useSearchHighlight({
    getSDKInstance,
    containers: ['.demo-text-container'],
    selectionStyles: DEFAULT_SELECTION_TYPES,
    onSearchHighlightInteraction: callbacks.onSearchHighlightInteraction
  })

  // 更新 searchResults 引用（供 callbacks 使用）
  refs.searchResults = searchResults

  // ========== 选区操作 ==========
  const selectionActions = useSelectionActions({
    popover,
    selectedSelectionType,
    currentSelections,
    getTypeConfig,
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData
  })

  // ========== 搜索操作 ==========
  const searchActions = useSearchActions({
    addSearchKeyword,
    removeSearchKeyword,
    clearSearchHighlights
  })

  // ========== Demo 操作 ==========
  const demoActions = useDemoActions({
    currentSelections,
    restoreSelections,
    clearAllSelections,
    clearAllSelectionsData,
    addSearchKeyword,
    mockSelections: mockSelections as SerializedSelection[]
  })

  // ========== 滚动监听 ==========
  const handleScroll = (): void => {
    if (popover.popoverVisible.value) {
      popover.hidePopover()
    }
  }

  onMounted(() => {
    const container = document.querySelector('.demo-text-container')
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
  })

  onUnmounted(() => {
    const container = document.querySelector('.demo-text-container')
    if (container) {
      container.removeEventListener('scroll', handleScroll)
    }
    window.removeEventListener('scroll', handleScroll)
  })

  // ========== 初始化 ==========
  const initialize = async (): Promise<void> => {
    await nextTick()
  }

  // ========== 返回接口 ==========
  return {
    // refs
    demoTextAreaRef,
    selectedSelectionType,

    // 气泡状态（新 API）
    popoverVisible: popover.popoverVisible,
    popoverData: popover.popoverData,
    // 气泡状态（旧 API 兼容）
    popoverMode: popover.popoverMode,
    currentBehaviorData: popover.currentBehaviorData,

    // SDK 状态
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

    // 选区操作（新 API）
    handleSaveItem: selectionActions.handleSaveItem,
    handleDeleteItem: selectionActions.handleDeleteItem,
    // 选区操作（旧 API 兼容）
    handlePopoverSaveSelection: selectionActions.handlePopoverSaveSelection,
    handlePopoverRemoveSelection: selectionActions.handlePopoverRemoveSelection,
    handleRemoveOverlap: selectionActions.handleRemoveOverlap,
    // 其他操作
    handleClearHighlights: selectionActions.handleClearHighlights,
    handleRestoreAllSelections: selectionActions.handleRestoreAllSelections,
    handleRestoreSelection: selectionActions.handleRestoreSelection,
    handleDeleteSelection: selectionActions.handleDeleteSelection,
    handleClearAll: selectionActions.handleClearAll,

    // 气泡操作
    handlePopoverClose: popover.hidePopover,

    // 搜索高亮操作
    handleAddSearchKeyword: searchActions.handleAddSearchKeyword,
    handleRemoveSearchKeyword: searchActions.handleRemoveSearchKeyword,
    handleClearSearchKeywords: searchActions.handleClearSearchKeywords,

    // Demo 操作
    handleExportData: demoActions.handleExportData,
    handlePrintData: demoActions.handlePrintData,
    handleSelectionClick: demoActions.handleSelectionClick,
    handleLoadMockData: demoActions.handleLoadMockData,
    handleClearPreset: demoActions.handleClearPreset,
    handleLoadMockDataAndSearch: demoActions.handleLoadMockDataAndSearch,
    handleSearchWithFilter: demoActions.handleSearchWithFilter,
    handleSearchFilterFirst: demoActions.handleSearchFilterFirst,

    // 文本选择（预留接口）
    handleTextSelection: (): void => {},

    // 导航功能
    navigation,

    // 初始化
    initialize
  }
}
