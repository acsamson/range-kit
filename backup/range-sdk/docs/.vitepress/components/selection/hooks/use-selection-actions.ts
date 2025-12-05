import { ElMessage } from 'element-plus'
import type { Ref } from 'vue'
import type { SerializedSelection, SelectionTypeConfig } from '../../../../../src/core/selection-restore'
import type { PopoverData, SelectionItem, UsePopoverReturn } from './use-popover'

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
 *
 * @description
 * 提供选区的 CRUD 操作，包括：
 * - 保存选区（从气泡触发）
 * - 删除选区（单个/重叠选区）
 * - 恢复选区（单个/全部）
 * - 清除高亮
 * - 清空所有数据
 *
 * @example
 * ```ts
 * const popover = usePopover()
 * const selectedSelectionType = ref('default')
 *
 * const {
 *   currentSelections,
 *   saveCurrentSelection,
 *   deleteSelection,
 *   // ... 其他 SDK 方法
 * } = useSelectionRestore({ ... })
 *
 * const actions = useSelectionActions({
 *   popover,
 *   selectedSelectionType,
 *   currentSelections,
 *   getTypeConfig,
 *   saveCurrentSelection,
 *   restoreSelections,
 *   clearAllSelections,
 *   deleteSelection,
 *   clearAllSelectionsData
 * })
 *
 * // 保存选区
 * await actions.handlePopoverSaveSelection(selectionData)
 *
 * // 删除选区
 * await actions.handleDeleteSelection('sel_123')
 * ```
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

  /**
   * 保存选区（从气泡触发）
   * SDK 内部已实现：
   * - 从指定 Range 保存选区（无需手动恢复浏览器选区）
   * - 保存后自动高亮新选区，不清除其他高亮
   */
  const handlePopoverSaveSelection = async (selectionData: PopoverData): Promise<void> => {
    try {
      const result = await saveCurrentSelection(
        undefined,
        selectedSelectionType.value,
        true,
        selectionData.range || undefined
      )
      if (result) {
        const typeConfig = getTypeConfig(selectedSelectionType.value)
        ElMessage.success(`选区已保存！类型: ${typeConfig?.label || '默认'}`)
      } else {
        ElMessage.warning('没有检测到有效的选区')
      }
    } catch (err: any) {
      ElMessage.error('保存选区失败: ' + err.message)
    }
  }

  /**
   * 移除选区（从气泡触发）
   * 只删除指定选区，不清除其他高亮
   */
  const handlePopoverRemoveSelection = async (selectionData: PopoverData): Promise<void> => {
    try {
      const selectionId = selectionData.selectionId
      if (!selectionId) {
        ElMessage.error('移除选区失败：无效的选区ID')
        return
      }

      await deleteSelection(selectionId)
      popover.hidePopover()
      ElMessage.success('选区已移除')
    } catch (err: any) {
      ElMessage.error('移除选区失败: ' + err.message)
    }
  }

  /**
   * 移除重叠选区（从气泡中点击）- 旧 API 兼容
   * 只删除指定选区，不清除其他高亮
   */
  const handleRemoveOverlap = async (overlap: any): Promise<void> => {
    try {
      const selectionId = overlap.selectionId
      if (!selectionId) {
        ElMessage.error('移除选区失败：无效的选区ID')
        return
      }

      await deleteSelection(selectionId)

      // 更新气泡数据，如果没有剩余选区则关闭气泡
      const hasRemaining = popover.removeOverlapFromData(selectionId)
      if (!hasRemaining) {
        popover.hidePopover()
      }

      ElMessage.success('选区已移除')
    } catch (err: any) {
      ElMessage.error('移除选区失败: ' + err.message)
    }
  }

  /**
   * 保存选区项（新 API）
   * 从统一气泡中点击保存按钮时触发
   * 支持保存搜索高亮和新划选的文本
   */
  const handleSaveItem = async (item: SelectionItem): Promise<void> => {
    try {
      if (!item.range) {
        ElMessage.error('保存选区失败：没有有效的范围')
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
        ElMessage.success(`选区已保存！类型: ${typeConfig?.label || '默认'}`)

        // 从气泡中移除该项
        const hasRemaining = popover.removeItemFromData(item.id)
        if (!hasRemaining) {
          popover.hidePopover()
        }
      } else {
        ElMessage.warning('没有检测到有效的选区')
      }
    } catch (err: any) {
      ElMessage.error('保存选区失败: ' + err.message)
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
        ElMessage.warning('只能删除已保存的选区')
        return
      }

      if (!item.id) {
        ElMessage.error('删除选区失败：无效的选区ID')
        return
      }

      await deleteSelection(item.id)

      // 从气泡中移除该项
      const hasRemaining = popover.removeItemFromData(item.id)
      if (!hasRemaining) {
        popover.hidePopover()
      }

      ElMessage.success('选区已删除')
    } catch (err: any) {
      ElMessage.error('删除选区失败: ' + err.message)
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
      ElMessage.success(`成功恢复 ${currentSelections.value.length} 个选区`)
    } catch (err: any) {
      ElMessage.error('恢复选区失败: ' + err.message)
    }
  }

  /**
   * 恢复单个选区
   */
  const handleRestoreSelection = async (selection: SerializedSelection): Promise<void> => {
    try {
      await restoreSelections([selection], false)
      ElMessage.success('选区恢复成功')
    } catch (err: any) {
      ElMessage.error('恢复选区失败: ' + err.message)
    }
  }

  /**
   * 删除选区（带确认框）
   */
  const handleDeleteSelection = async (selectionId: string): Promise<void> => {
    if (confirm('确定要删除这个选区吗？')) {
      try {
        await deleteSelection(selectionId)
        ElMessage.success('选区删除成功')
      } catch (err: any) {
        ElMessage.error('删除选区失败: ' + err.message)
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
        ElMessage.success('所有数据已清空')
      } catch (err: any) {
        ElMessage.error('清空数据失败: ' + err.message)
      }
    }
  }

  // ========== 返回接口 ==========
  return {
    // 旧 API（保持兼容）
    handlePopoverSaveSelection,
    handlePopoverRemoveSelection,
    handleRemoveOverlap,
    // 新 API（统一气泡）
    handleSaveItem,
    handleDeleteItem,
    // 其他操作
    handleClearHighlights,
    handleRestoreAllSelections,
    handleRestoreSelection,
    handleDeleteSelection,
    handleClearAll
  }
}

/**
 * Hook 返回值类型
 */
export type UseSelectionActionsReturn = ReturnType<typeof useSelectionActions>
