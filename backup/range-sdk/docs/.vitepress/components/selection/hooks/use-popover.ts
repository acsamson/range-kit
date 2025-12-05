import { ref } from 'vue'

/**
 * 选区项类型
 */
export type SelectionItemType = 'saved' | 'search' | 'new'

/**
 * 统一的选区项数据
 * 用于在 Popover 中展示所有类型的选区
 */
export interface SelectionItem {
  /** 唯一标识 */
  id: string
  /** 选区类型：saved=已保存选区, search=搜索高亮, new=新划选 */
  itemType: SelectionItemType
  /** 文本内容 */
  text: string
  /** 选区样式类型（如 default, important, search 等） */
  styleType?: string
  /** Range 对象（用于保存操作） */
  range?: Range
  /** 原始选区数据（已保存选区才有） */
  selectionData?: any
}

/**
 * 气泡数据类型
 */
export interface PopoverData {
  /** 位置信息 */
  position?: { x: number; y: number; width: number; height: number }
  /** 所有选区项（包括已保存、搜索高亮、新划选） */
  items: SelectionItem[]
  /** 时间戳 */
  timestamp: number
}

/**
 * 气泡状态管理 Hook
 *
 * @description
 * 管理选区操作气泡的显示状态，支持统一展示：
 * - 已保存的选区（可删除）
 * - 搜索高亮（可保存）
 * - 新划选的文本（可保存）
 *
 * @example
 * ```ts
 * const {
 *   popoverVisible,
 *   popoverData,
 *   showPopover,
 *   hidePopover
 * } = usePopover()
 *
 * // 显示气泡
 * showPopover({
 *   position: { x: 100, y: 200, width: 50, height: 20 },
 *   items: [
 *     { id: 'sel_1', itemType: 'saved', text: '已保存文本' },
 *     { id: 'search_1', itemType: 'search', text: '搜索词', range: someRange }
 *   ],
 *   timestamp: Date.now()
 * })
 * ```
 */
export function usePopover() {
  // ========== 响应式状态 ==========

  /** 气泡是否可见 */
  const popoverVisible = ref<boolean>(false)

  /** 气泡数据 */
  const popoverData = ref<PopoverData>({
    items: [],
    timestamp: 0
  })

  /** 隐藏气泡的定时器 */
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  // ========== 方法 ==========

  /**
   * 清除隐藏定时器
   */
  const clearHideTimer = (): void => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  /**
   * 显示气泡
   * @param data - 气泡数据
   */
  const showPopover = (data: PopoverData): void => {
    clearHideTimer()
    popoverData.value = data
    popoverVisible.value = true
  }

  /**
   * 隐藏气泡
   */
  const hidePopover = (): void => {
    clearHideTimer()
    popoverVisible.value = false
  }

  /**
   * 延迟隐藏气泡（避免误触）
   * @param delay - 延迟毫秒数，默认 50ms
   */
  const hidePopoverDelayed = (delay: number = 50): void => {
    clearHideTimer()
    hideTimer = setTimeout(() => {
      popoverVisible.value = false
      hideTimer = null
    }, delay)
  }

  /**
   * 从气泡数据中移除指定选区项
   * @param itemId - 要移除的选区项 ID
   * @returns 是否还有剩余选区项
   */
  const removeItemFromData = (itemId: string): boolean => {
    popoverData.value.items = popoverData.value.items.filter(item => item.id !== itemId)
    // 如果没有剩余项，自动隐藏气泡
    if (popoverData.value.items.length === 0) {
      hidePopover()
      return false
    }
    return true
  }

  /**
   * 更新指定选区项的类型（如从 search 变为 saved）
   * @param itemId - 选区项 ID
   * @param newType - 新类型
   */
  const updateItemType = (itemId: string, newType: SelectionItemType): void => {
    const item = popoverData.value.items.find(item => item.id === itemId)
    if (item) {
      item.itemType = newType
    }
  }

  // ========== 兼容旧 API ==========

  /** 气泡模式（兼容旧代码） */
  const popoverMode = ref<'save' | 'remove'>('save')

  /** 当前气泡关联的选区数据（兼容旧代码） */
  const currentBehaviorData = ref<any>({})

  /**
   * 显示保存选区气泡（兼容旧 API）
   */
  const showSavePopover = (data: any): void => {
    currentBehaviorData.value = data
    popoverMode.value = 'save'

    // 转换为新格式
    const items: SelectionItem[] = []

    // 添加新划选的文本
    if (data.text && data.range) {
      items.push({
        id: `new_${Date.now()}`,
        itemType: 'new',
        text: data.text,
        range: data.range
      })
    }

    // 添加重叠的已保存选区
    if (data.overlappedRanges?.length) {
      data.overlappedRanges.forEach((overlap: any) => {
        items.push({
          id: overlap.selectionId,
          itemType: 'saved',
          text: overlap.text,
          styleType: overlap.selectionData?.type,
          selectionData: overlap.selectionData
        })
      })
    }

    showPopover({
      position: data.position,
      items,
      timestamp: data.timestamp || Date.now()
    })
  }

  /**
   * 显示删除选区气泡（兼容旧 API）
   */
  const showRemovePopover = (data: any): void => {
    currentBehaviorData.value = data
    popoverMode.value = 'remove'

    // 转换为新格式
    const items: SelectionItem[] = []

    // 添加重叠的已保存选区
    if (data.overlappedRanges?.length) {
      data.overlappedRanges.forEach((overlap: any) => {
        // 区分已保存选区和搜索高亮
        const isSearchHighlight = overlap.selectionData?.type === 'search'
        items.push({
          id: overlap.selectionId,
          itemType: isSearchHighlight ? 'search' : 'saved',
          text: overlap.text,
          styleType: overlap.selectionData?.type,
          selectionData: overlap.selectionData,
          range: overlap.range
        })
      })
    } else if (data.selectionId) {
      // 单个选区的情况
      items.push({
        id: data.selectionId,
        itemType: 'saved',
        text: data.text,
        selectionData: data
      })
    }

    showPopover({
      position: data.position,
      items,
      timestamp: data.timestamp || Date.now()
    })
  }

  // ========== 返回接口 ==========
  return {
    // 新 API
    popoverVisible,
    popoverData,
    showPopover,
    hidePopover,
    hidePopoverDelayed,
    removeItemFromData,
    updateItemType,

    // 兼容旧 API
    popoverMode,
    currentBehaviorData,
    showSavePopover,
    showRemovePopover,
    removeOverlapFromData: removeItemFromData
  }
}

/**
 * Hook 返回值类型
 */
export type UsePopoverReturn = ReturnType<typeof usePopover>
