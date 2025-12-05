import { ref, nextTick, type Ref } from 'vue'
import { useSelectionRestore } from '@ad-audit/range-sdk/vue'
import type { SelectionActionEvent } from '@ad-audit/range-sdk/vue'
import { SelectionBehaviorType, SerializedSelection, SelectionTypeConfig } from '@ad-audit/range-sdk'
import { DEFAULT_SELECTION_TYPES } from '../constants'

/**
 * 气泡数据类型
 */
interface PopoverData {
  /** 动作类型 */
  type: string
  /** 选中文本 */
  text: string
  /** 位置信息 */
  position?: { x: number; y: number; width: number; height: number }
  /** 时间戳 */
  timestamp: number
  /** 选区ID - 用于删除操作 */
  selectionId?: string
  /** Range 对象 */
  range?: Range
}

/**
 * Hook 返回类型
 */
interface UsePageReturn {
  // refs
  demoTextAreaRef: Ref<any>
  selectedSelectionType: Ref<string>

  // 气泡状态
  popoverVisible: Ref<boolean>
  popoverMode: Ref<'save' | 'remove'>
  currentBehaviorData: Ref<PopoverData>

  // SDK状态
  isInitialized: Ref<boolean>
  currentSelections: Ref<SerializedSelection[]>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  availableTypes: SelectionTypeConfig[]
  getTypeConfig: (type: string) => any

  // 事件处理函数
  handleTextSelection: () => void
  handleSaveSelection: () => Promise<void>
  handleClearHighlights: () => void
  handleRestoreAllSelections: () => Promise<void>
  handleRestoreSelection: (selection: SerializedSelection) => Promise<void>
  handleDeleteSelection: (selectionId: string) => Promise<void>
  handleClearAll: () => Promise<void>
  handleSelectionClick: (selection: SerializedSelection) => void
  handlePopoverSaveSelection: (selectionData: PopoverData) => Promise<void>
  handlePopoverRemoveSelection: (selectionData: PopoverData) => Promise<void>
  handlePopoverClose: () => void

  // 初始化函数
  initialize: () => Promise<void>
}

/**
 * 选区页面管理 Hook
 *
 * @description
 * 封装所有与页面选区操作相关的逻辑
 * 使用统一的 onSelectionAction 回调处理所有选区事件
 */
export function usePage(): UsePageReturn {
  // 演示文本区域引用
  const demoTextAreaRef = ref<any>(null)

  // 当前选择的选区类型
  const selectedSelectionType = ref<string>('default')

  // 气泡组件相关状态
  const popoverVisible = ref<boolean>(false)
  const popoverMode = ref<'save' | 'remove'>('save')
  const currentBehaviorData = ref<PopoverData>({
    type: 'created',
    text: '',
    position: undefined,
    timestamp: Date.now()
  })

  // 隐藏气泡的定时器
  let hidePopoverTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 统一选区动作处理
   */
  const handleSelectionAction = (event: SelectionActionEvent): void => {
    // 清除之前的定时器
    if (hidePopoverTimer) {
      clearTimeout(hidePopoverTimer)
      hidePopoverTimer = null
    }

    switch (event.type) {
      case 'created':
        handleCreatedAction(event)
        break
      case 'cleared':
        handleClearedAction()
        break
      case 'click':
        handleClickAction(event)
        break
      case 'hover':
        console.log('🎯 选区被悬停:', {
          text: event.text.substring(0, 30) + '...',
          selectionId: event.savedSelectionId
        })
        break
      default:
        break
    }
  }

  /**
   * 处理新建选区
   */
  const handleCreatedAction = (event: SelectionActionEvent): void => {
    if (!event.text || event.text.length === 0) return

    console.log('📝 新建选区:', event)

    // 过滤掉搜索高亮
    const savedSelectionOverlaps = (event.overlappedSelections || []).filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    // 检查是否点击了已保存选区
    const containingSelection = savedSelectionOverlaps.find(
      (overlap: any) => overlap.overlapType === 'EXISTING_CONTAINS_CURRENT'
    )

    if (containingSelection) {
      // 点击已保存选区 - 显示删除气泡
      currentBehaviorData.value = {
        type: 'click',
        text: event.text,
        position: event.position,
        timestamp: event.timestamp,
        selectionId: containingSelection.selectionId
      }
      popoverMode.value = 'remove'
      popoverVisible.value = true
      return
    }

    // 新建选区 - 显示保存气泡
    currentBehaviorData.value = {
      type: 'created',
      text: event.text,
      position: event.position,
      timestamp: event.timestamp,
      range: event.range || undefined
    }
    popoverMode.value = 'save'
    popoverVisible.value = true
  }

  /**
   * 处理选区清除
   */
  const handleClearedAction = (): void => {
    // 延迟隐藏气泡（避免误触）
    hidePopoverTimer = setTimeout(() => {
      // 只有当不是移除模式时才隐藏气泡
      if (popoverMode.value !== 'remove') {
        popoverVisible.value = false
      }
    }, 50)
  }

  /**
   * 处理点击已保存选区
   */
  const handleClickAction = (event: SelectionActionEvent): void => {
    console.log('🖱️ 选区被点击:', {
      text: event.text.substring(0, 30) + '...',
      selectionId: event.savedSelectionId
    })

    // 计算点击位置
    const mouseEvent = event.originalEvent as MouseEvent
    const clickX = mouseEvent?.clientX || 0
    const clickY = mouseEvent?.clientY || 0

    // 设置气泡数据
    currentBehaviorData.value = {
      type: 'click',
      text: event.text,
      position: {
        x: clickX - 100,
        y: clickY - 10,
        width: 200,
        height: 20
      },
      timestamp: Date.now(),
      selectionId: event.savedSelectionId
    }

    // 设置为移除模式并显示气泡
    popoverMode.value = 'remove'
    popoverVisible.value = true
  }

  // 初始化 selection restore hook
  const {
    isInitialized,
    currentSelections,
    isLoading,
    error,
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData,
    availableTypes,
    getTypeConfig,
    getSDKInstance
  } = useSelectionRestore({
    appId: 'selection-demo',
    containers: ['.demo-text-container'],
    selectionStyles: DEFAULT_SELECTION_TYPES,
    // 使用统一的选区动作回调
    onSelectionAction: handleSelectionAction,
    onSelectionSaved: (selection) => {
      console.log('选区已保存:', selection)
      popoverVisible.value = false

      // 保存后自动滚动到选区位置
      const sdkInstance = getSDKInstance()
      if (sdkInstance) {
        setTimeout(async () => {
          try {
            const result = await sdkInstance.highlightSelections([selection], 0)
            console.log('🎯 保存后自动滚动到选区:', {
              success: result.success,
              selectionId: selection.id,
              text: selection.text.substring(0, 30) + '...'
            })
          } catch (err) {
            console.warn('保存后滚动失败:', err)
          }
        }, 100)
      }
    },
    onSelectionDeleted: (selectionId) => {
      console.log('选区已删除:', selectionId)
    }
  })

  // 处理文本选择
  const handleTextSelection = (): void => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      console.log('检测到文本选择:', selection.toString())
    }
  }

  // 保存当前选区
  const handleSaveSelection = async (): Promise<void> => {
    try {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        alert('请先选择一些文本')
        return
      }

      const result = await saveCurrentSelection(undefined, selectedSelectionType.value)
      if (result) {
        const typeConfig = getTypeConfig(selectedSelectionType.value)
        alert(`选区已保存！类型: ${typeConfig?.label || '默认'} (${result.id})`)
      } else {
        alert('没有检测到有效的选区')
      }
    } catch (err: any) {
      alert('保存选区失败: ' + err.message)
    }
  }

  // 清除所有高亮
  const handleClearHighlights = (): void => {
    clearAllSelections()
  }

  // 恢复所有选区
  const handleRestoreAllSelections = async (): Promise<void> => {
    try {
      await restoreSelections(currentSelections.value, true)
      alert(`成功恢复 ${currentSelections.value.length} 个选区`)
    } catch (err: any) {
      alert('恢复选区失败: ' + err.message)
    }
  }

  // 恢复单个选区
  const handleRestoreSelection = async (selection: SerializedSelection): Promise<void> => {
    try {
      await restoreSelections([selection], true)
      alert('选区恢复成功')
    } catch (err: any) {
      alert('恢复选区失败: ' + err.message)
    }
  }

  // 删除选区
  const handleDeleteSelection = async (selectionId: string): Promise<void> => {
    if (confirm('确定要删除这个选区吗？')) {
      try {
        await deleteSelection(selectionId)
        alert('选区删除成功')
      } catch (err: any) {
        alert('删除选区失败: ' + err.message)
      }
    }
  }

  // 清空所有数据
  const handleClearAll = async (): Promise<void> => {
    if (confirm('确定要清空所有选区数据吗？此操作不可撤销。')) {
      try {
        clearAllSelections()
        await clearAllSelectionsData()
        alert('所有数据和高亮已清空')
      } catch (err: any) {
        alert('清空数据失败: ' + err.message)
      }
    }
  }

  // 处理选区项点击
  const handleSelectionClick = (selection: SerializedSelection): void => {
    console.log('选区项被点击:', selection)
  }

  // 气泡保存选区
  const handlePopoverSaveSelection = async (selectionData: PopoverData): Promise<void> => {
    try {
      // 如果有存储的 range，恢复选区
      if (selectionData.range) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(selectionData.range)
        }
      }

      const result = await saveCurrentSelection(undefined, selectedSelectionType.value)
      if (result) {
        const typeConfig = getTypeConfig(selectedSelectionType.value)
        alert(`选区已保存并高亮！类型: ${typeConfig?.label || '默认'} (${result.id})`)
      } else {
        alert('保存选区失败：没有检测到有效的选区')
      }
    } catch (err: any) {
      alert('保存选区失败: ' + err.message)
    }
  }

  // 气泡移除选区
  const handlePopoverRemoveSelection = async (selectionData: PopoverData): Promise<void> => {
    try {
      const selectionId = selectionData.selectionId
      if (!selectionId) {
        console.error('没有找到选区ID')
        alert('移除选区失败：无效的选区ID')
        return
      }

      const sdkInstance = getSDKInstance()

      // 删除选区数据
      await deleteSelection(selectionId)

      // 手动清除所有高亮并重新显示剩余的选区
      if (sdkInstance) {
        sdkInstance.clearHighlight()

        try {
          const remainingSelections = currentSelections.value.filter(s => s.id !== selectionId)
          if (remainingSelections.length > 0) {
            await sdkInstance.highlightSelections(remainingSelections)
          }
        } catch (restoreError) {
          console.warn('重新高亮剩余选区失败:', restoreError)
        }
      }

      popoverVisible.value = false
      alert(`选区已移除！(${selectionId.substring(0, 8)}...)`)
    } catch (err: any) {
      console.error('移除选区失败:', err)
      alert('移除选区失败: ' + err.message)
    }
  }

  // 关闭气泡
  const handlePopoverClose = (): void => {
    popoverVisible.value = false
  }

  // 组件挂载后的初始化
  const initialize = async (): Promise<void> => {
    await nextTick()
    console.log('Selection Demo 组件已挂载')
  }

  return {
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
  }
}
