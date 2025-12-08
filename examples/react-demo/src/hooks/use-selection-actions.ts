import { useCallback } from 'react'
import type { SerializedSelection, SelectionTypeConfig } from 'range-kit-react'
import type { usePopover, SelectionItem } from './use-popover'

export interface UseSelectionActionsOptions {
  popover: ReturnType<typeof usePopover>
  selectedSelectionType: string
  currentSelections: SerializedSelection[]
  getTypeConfig: (type: string) => SelectionTypeConfig | undefined
  saveCurrentSelection: (id?: string, type?: string, autoHighlight?: boolean, fromRange?: Range) => Promise<SerializedSelection | null>
  restoreSelections: (selections: SerializedSelection[], enableAutoScroll?: boolean) => Promise<void>
  clearAllSelections: () => void
  deleteSelection: (selectionId: string) => Promise<void>
  clearAllSelectionsData: () => Promise<void>
}

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
   * Save item from unified popover
   */
  const handleSaveItem = useCallback(async (item: SelectionItem) => {
    console.log(999999999, item)
    try {
      if (!item.range) {
        showError('Save failed: Invalid range')
        return
      }

      const result = await saveCurrentSelection(
        undefined,
        selectedSelectionType,
        true,
        item.range
      )

      if (result) {
        const typeConfig = getTypeConfig(selectedSelectionType)
        showSuccess(`Selection saved! Type: ${typeConfig?.label || 'Default'}`)

        // Remove item from popover
        const hasRemaining = popover.removeItemFromData(item.id)
        if (!hasRemaining) {
          popover.hidePopover()
        }
      } else {
        showWarning('No valid selection detected')
      }
    } catch (err: any) {
      showError('Save failed: ' + err.message)
    }
  }, [saveCurrentSelection, selectedSelectionType, getTypeConfig, popover])

  /**
   * Delete item from unified popover
   */
  const handleDeleteItem = useCallback(async (item: SelectionItem) => {
    try {
      if (item.itemType !== 'saved') {
        showWarning('Only saved selections can be deleted')
        return
      }

      if (!item.id) {
        showError('Delete failed: Invalid selection ID')
        return
      }

      await deleteSelection(item.id)

      // Remove item from popover
      const hasRemaining = popover.removeItemFromData(item.id)
      if (!hasRemaining) {
        popover.hidePopover()
      }

      showSuccess('Selection deleted')
    } catch (err: any) {
      showError('Delete failed: ' + err.message)
    }
  }, [deleteSelection, popover])

  /**
   * Clear all highlights (UI only)
   */
  const handleClearHighlights = useCallback(() => {
    clearAllSelections()
  }, [clearAllSelections])

  /**
   * Restore all selections
   */
  const handleRestoreAllSelections = useCallback(async () => {
    try {
      await restoreSelections(currentSelections, false)
      showSuccess(`Restored ${currentSelections.length} selections`)
    } catch (err: any) {
      showError('Restore failed: ' + err.message)
    }
  }, [restoreSelections, currentSelections])

  /**
   * Clear all data (with confirm)
   */
  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all selection data?')) {
      try {
        clearAllSelections()
        await clearAllSelectionsData()
        showSuccess('All data cleared')
      } catch (err: any) {
        showError('Clear data failed: ' + err.message)
      }
    }
  }, [clearAllSelections, clearAllSelectionsData])

  /**
   * Print data
   */
  const handlePrintData = useCallback(() => {
    console.group('Current Selections Data')
    console.log(`Total: ${currentSelections.length}`)
    console.log('IDs:', currentSelections.map(s => s.id))
    console.log(currentSelections)
    console.groupEnd()
    alert(`Selection data printed to console (Total ${currentSelections.length}), please check F12`)
  }, [currentSelections])

  return {
    handleSaveItem,
    handleDeleteItem,
    handleClearHighlights,
    handleRestoreAllSelections,
    handleClearAll,
    handlePrintData
  }
}
