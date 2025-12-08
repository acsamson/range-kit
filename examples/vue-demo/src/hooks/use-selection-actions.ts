import type { Ref } from 'vue'
import type { SerializedSelection, SelectionTypeConfig } from 'range-kit-vue'
import type { SelectionItem, UsePopoverReturn } from './use-popover'

/**
 * 选区操作配置选项
 */
export interface UseSelectionActionsOptions {
  /** 气泡管理 hook 返回值 */
  popover: UsePopoverReturn
  /** 当前选中的选区类型 */
  selectedSelectionType: Ref<string>
  /** 当前选区列表 */
  currentSelections: Ref<SerializedSelection[]>
  /** 获取类型配置的函数 */
  getTypeConfig: (type: string) => SelectionTypeConfig | undefined
  /** 保存当前选区 */
  saveCurrentSelection: (id?: string, type?: string, autoHighlight?: boolean, fromRange?: Range) => Promise<SerializedSelection | null>
  /** 恢复选区列表 */
  restoreSelections: (selections: SerializedSelection[], enableAutoScroll?: boolean) => Promise<void>
  /** 清除所有高亮 */
  clearAllSelections: () => void
  /** 删除选区 */
  deleteSelection: (selectionId: string) => Promise<void>
  /** 清空所有选区数据 */
  clearAllSelectionsData: () => Promise<void>
}

/**
 * 选区操作 Hook
 */
export function useSelectionActions(options: UseSelectionActionsOptions) {
  const {
    popover,
    selectedSelectionType,
    currentSelections,
    getTypeConfig,
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData
  } = options

  const showSuccess = (msg: string) => console.log(msg)
  const showWarning = (msg: string) => console.warn(msg)
  const showError = (msg: string) => console.error(msg)

  /**
   * 保存选区项（新 API）
   * 从统一气泡中点击保存按钮时触发
   * 支持保存搜索高亮和新划选的文本
   */
  const handleSaveItem = async (item: SelectionItem): Promise<void> => {
    try {
      if (!item.range) {
        showError('保存选区失败：没有有效的范围')
        return
      }

      const result = await saveCurrentSelection(
        undefined,
        selectedSelectionType.value,
        true,
        item.range
      )

      if (result) {
        const typeConfig = getTypeConfig(selectedSelectionType.value)
        showSuccess(`选区已保存！类型: ${typeConfig?.label || '默认'}`)

        // 从气泡中移除该项
        const hasRemaining = popover.removeItemFromData(item.id)
        if (!hasRemaining) {
          popover.hidePopover()
        }
      } else {
        showWarning('没有检测到有效的选区')
      }
    } catch (err: any) {
      showError('保存选区失败: ' + err.message)
    }
  }

  /**
   * 删除选区项（新 API）
   * 从统一气泡中点击删除按钮时触发
   * 只能删除已保存的选区
   */
  const handleDeleteItem = async (item: SelectionItem): Promise<void> => {
    try {
      if (item.itemType !== 'saved') {
        showWarning('只能删除已保存的选区')
        return
      }

      if (!item.id) {
        showError('删除选区失败：无效的选区ID')
        return
      }

      await deleteSelection(item.id)

      // 从气泡中移除该项
      const hasRemaining = popover.removeItemFromData(item.id)
      if (!hasRemaining) {
        popover.hidePopover()
      }

      showSuccess('选区已删除')
    } catch (err: any) {
      showError('删除选区失败: ' + err.message)
    }
  }

  /**
   * 清除所有高亮
   */
  const handleClearHighlights = (): void => {
    clearAllSelections()
  }

  /**
   * 恢复所有选区
   */
  const handleRestoreAllSelections = async (): Promise<void> => {
    try {
      await restoreSelections(currentSelections.value, false)
      showSuccess(`成功恢复 ${currentSelections.value.length} 个选区`)
    } catch (err: any) {
      showError('恢复选区失败: ' + err.message)
    }
  }

  /**
   * 恢复单个选区
   */
  const handleRestoreSelection = async (selection: SerializedSelection): Promise<void> => {
    try {
      await restoreSelections([selection], false)
      showSuccess('选区恢复成功')
    } catch (err: any) {
      showError('恢复选区失败: ' + err.message)
    }
  }

  /**
   * 删除选区（带确认框）
   */
  const handleDeleteSelection = async (selectionId: string): Promise<void> => {
    if (confirm('确定要删除这个选区吗？')) {
      try {
        await deleteSelection(selectionId)
        showSuccess('选区删除成功')
      } catch (err: any) {
        showError('删除选区失败: ' + err.message)
      }
    }
  }

  /**
   * 清空所有数据（带确认框）
   */
  const handleClearAll = async (): Promise<void> => {
    if (confirm('确定要清空所有选区数据吗？')) {
      try {
        clearAllSelections()
        await clearAllSelectionsData()
        showSuccess('所有数据已清空')
      } catch (err: any) {
        showError('清空数据失败: ' + err.message)
      }
    }
  }

  /**
   * 打印选区数据
   */
  const handlePrintData = (): void => {
    console.group('Current Selections Data')
    console.log(`Total: ${currentSelections.value.length}`)
    console.log('IDs:', currentSelections.value.map(s => s.id))
    console.log(currentSelections.value)
    console.groupEnd()
    alert(`选区数据已打印到控制台 (共 ${currentSelections.value.length} 个)，请按 F12 查看`)
  }

  // ========== 返回接口 ==========
  return {
    // 新 API（统一气泡）
    handleSaveItem,
    handleDeleteItem,
    // 其他操作
    handleClearHighlights,
    handleRestoreAllSelections,
    handleRestoreSelection,
    handleDeleteSelection,
    handleClearAll,
    handlePrintData
  }
}

/**
 * Hook 返回值类型
 */
export type UseSelectionActionsReturn = ReturnType<typeof useSelectionActions>