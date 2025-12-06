import {
  SelectionBehaviorType,
  type SelectionRestoreAPI
} from '@l2c/range-kit-core'
import type {
  SelectionActionEvent
} from '@l2c/range-kit-vue'
import type { PopoverData, SelectionItem, UsePopoverReturn } from './use-popover'
import type { Ref } from 'vue'

/**
 * 搜索结果项类型
 */
export interface SearchResultItem {
  keyword: string
  matchCount: number
  type: string
  highlightIds: string[]
}

/**
 * 选区回调配置选项
 */
export interface UseSelectionCallbacksOptions {
  /** 气泡管理 hook 返回值 */
  popover: UsePopoverReturn
  /** 获取 SDK 实例的函数 */
  getSDKInstance: () => SelectionRestoreAPI | null
  /** 获取搜索结果列表的函数（用于检测搜索高亮） */
  getSearchResults?: () => Ref<SearchResultItem[]>
}

/**
 * 选区行为回调 Hook
 */
export function useSelectionCallbacks(options: UseSelectionCallbacksOptions) {
  const { popover, getSDKInstance, getSearchResults } = options

  // 记录最近一次显示气泡的时间戳，用于防止 cleared 事件立即关闭气泡
  let lastPopoverShowTime = 0

  /**
   * 检测点击位置的搜索高亮
   * CSS Custom Highlight API 不会在 DOM 上添加属性，
   * 需要通过检测点击位置是否在搜索高亮的 Range 范围内来判断
   */
  const detectSearchHighlightsAtPoint = (x: number, y: number): SelectionItem[] => {
    const items: SelectionItem[] = []

    // 通过 getter 获取最新的搜索结果
    const searchResults = getSearchResults?.()

    // 如果没有搜索结果，直接返回
    if (!searchResults?.value?.length) {
      return items
    }

    const sdkInstance = getSDKInstance()
    if (!sdkInstance) {
      return items
    }

    // 遍历所有搜索结果，检测点击位置是否在其 Range 范围内
    for (const result of searchResults.value) {
      for (const highlightId of result.highlightIds) {
        // 获取该搜索高亮的 Range
        const range = sdkInstance.getActiveRange(highlightId)
        if (!range) continue

        // 检测点击位置是否在 Range 范围内
        if (isPointInRange(x, y, range)) {
          items.push({
            id: highlightId,
            itemType: 'search',
            text: range.toString() || result.keyword,
            styleType: result.type,
            range: range
          })
        }
      }
    }

    return items
  }

  /**
   * 过滤掉已被保存为选区的搜索高亮
   * 通过比较文本内容来判断搜索高亮是否已被保存
   */
  const filterDuplicateSearchItems = (
    searchItems: SelectionItem[],
    savedItems: SelectionItem[]
  ): SelectionItem[] => {
    if (savedItems.length === 0) return searchItems

    // 收集所有已保存选区的文本（去除空格后比较）
    const savedTexts = new Set(
      savedItems.map(item => item.text?.trim().toLowerCase())
    )

    // 过滤掉文本已被保存的搜索高亮
    return searchItems.filter(searchItem => {
      const searchText = searchItem.text?.trim().toLowerCase()
      return !savedTexts.has(searchText)
    })
  }

  /**
   * 检测点是否在 Range 范围内
   */
  const isPointInRange = (x: number, y: number, range: Range): boolean => {
    try {
      const rects = range.getClientRects()
      const tolerance = 2

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i]
        if (
          x >= rect.left - tolerance &&
          x <= rect.right + tolerance &&
          y >= rect.top - tolerance &&
          y <= rect.bottom + tolerance
        ) {
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 统一选区动作回调
   * 处理所有选区相关事件：created/cleared/click/hover/dblclick/contextmenu
   */
  const onSelectionAction = (event: SelectionActionEvent): void => {
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
      // hover/dblclick/contextmenu 暂不处理
      default:
        break
    }
  }

  /**
   * 处理新建选区动作
   * 当用户划选文本或点击已保存选区时触发
   */
  const handleCreatedAction = (event: SelectionActionEvent): void => {
    if (!event.text || event.text.length === 0) return

    // 获取点击位置（用于检测搜索高亮）
    const position = event.position
    const clickX = position?.x || 0
    const clickY = position?.y || 0

    // 构建统一的选区项列表
    const items: SelectionItem[] = []

    // 过滤掉搜索高亮（type 为 search 的不是已保存选区）
    const savedSelectionOverlaps = (event.overlappedSelections || []).filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    // 如果当前选区完全被某个已保存选区包含，说明用户点击的是已保存选区
    const containingSelection = savedSelectionOverlaps.find(
      (overlap: any) => overlap.overlapType === 'EXISTING_CONTAINS_CURRENT'
    )

    if (containingSelection) {
      // 点击已保存选区 - 添加所有重叠的已保存选区
      for (const overlap of savedSelectionOverlaps) {
        items.push({
          id: overlap.selectionId,
          itemType: 'saved',
          text: overlap.text,
          styleType: overlap.selectionData?.type,
          selectionData: overlap.selectionData
        })
      }

      // 同时检测搜索高亮，并过滤掉已保存的
      const searchItems = detectSearchHighlightsAtPoint(clickX, clickY)
      const filteredSearchItems = filterDuplicateSearchItems(searchItems, items)
      items.push(...filteredSearchItems)

      if (items.length > 0) {
        popover.showPopover({
          position: position,
          items,
          timestamp: event.timestamp
        })
        lastPopoverShowTime = Date.now()
      }
      return
    }

    // 先检测搜索高亮，用于后续去重
    const searchItems = detectSearchHighlightsAtPoint(clickX, clickY)
    const searchTexts = new Set(
      searchItems.map(item => item.text?.trim().toLowerCase())
    )

    // 新建选区 - 添加新划选的文本（如果不是点击搜索高亮产生的）
    if (event.range) {
      const newText = event.text?.trim().toLowerCase()
      // 如果新选文本与搜索高亮文本相同，说明是点击搜索高亮产生的，不添加新选项
      if (!searchTexts.has(newText)) {
        items.push({
          id: `new_${Date.now()}`,
          itemType: 'new',
          text: event.text,
          range: event.range
        })
      }
    }

    // 添加重叠的已保存选区（可删除）
    const savedItems: SelectionItem[] = []
    for (const overlap of savedSelectionOverlaps) {
      const savedItem: SelectionItem = {
        id: overlap.selectionId,
        itemType: 'saved',
        text: overlap.text,
        styleType: overlap.selectionData?.type,
        selectionData: overlap.selectionData
      }
      items.push(savedItem)
      savedItems.push(savedItem)
    }

    // 添加搜索高亮（过滤掉已保存的）
    const filteredSearchItems = filterDuplicateSearchItems(searchItems, savedItems)
    items.push(...filteredSearchItems)

    if (items.length > 0) {
      popover.showPopover({
        position: position,
        items,
        timestamp: event.timestamp
      })
      lastPopoverShowTime = Date.now()
    }
  }

  /**
   * 处理选区清除动作
   */
  const handleClearedAction = (): void => {
    // 如果气泡刚刚显示（200ms 内），忽略 cleared 事件
    // 这是因为点击已保存选区会触发 click 事件显示气泡，
    // 随后浏览器选区变化会触发 cleared 事件，不应该关闭气泡
    if (Date.now() - lastPopoverShowTime < 200) {
      return
    }
    // 选区清除 - 延迟隐藏气泡（避免误触）
    popover.hidePopoverDelayed(50)
  }

  /**
   * 处理点击已保存选区动作
   * 检测所有重叠的已保存选区和搜索高亮，使用统一气泡显示
   */
  const handleClickAction = (event: SelectionActionEvent): void => {
    // 计算点击位置
    const mouseEvent = event.originalEvent as MouseEvent
    const clickX = mouseEvent?.clientX || 0
    const clickY = mouseEvent?.clientY || 0

    // 构建统一的选区项列表
    const items: SelectionItem[] = []

    // 1. 检测已保存选区
    const sdkInstance = getSDKInstance()
    let overlappedSelections: any[] = []

    if (sdkInstance) {
      overlappedSelections = sdkInstance.detectAllSelectionsAtPoint(clickX, clickY)
    }

    // 如果 SDK 没有返回结果，降级使用当前点击的选区
    if (overlappedSelections.length === 0 && event.savedSelectionId) {
      overlappedSelections = [{
        selectionId: event.savedSelectionId,
        text: event.text,
        selectionData: event.savedSelection
      }]
    }

    // 过滤掉搜索高亮类型的选区（它们会在下面单独处理）
    const savedSelections = overlappedSelections.filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    // 将已保存选区转换为统一格式
    const savedItems: SelectionItem[] = []
    for (const overlap of savedSelections) {
      const savedItem: SelectionItem = {
        id: overlap.selectionId,
        itemType: 'saved',
        text: overlap.text,
        styleType: overlap.selectionData?.type,
        selectionData: overlap.selectionData
      }
      items.push(savedItem)
      savedItems.push(savedItem)
    }

    // 2. 检测搜索高亮，并过滤掉已保存的
    const searchItems = detectSearchHighlightsAtPoint(clickX, clickY)
    const filteredSearchItems = filterDuplicateSearchItems(searchItems, savedItems)
    items.push(...filteredSearchItems)

    // 如果没有检测到任何选区项，不显示气泡
    if (items.length === 0) return

    // 计算气泡位置 - 使用鼠标点击位置
    const clickPosition: PopoverData['position'] = {
      x: clickX,
      y: clickY,
      width: 0,
      height: 0
    }

    // 使用新的统一气泡 API
    popover.showPopover({
      position: clickPosition,
      items,
      timestamp: Date.now()
    })

    // 记录气泡显示时间，防止 cleared 事件关闭气泡
    lastPopoverShowTime = Date.now()
  }

  /**
   * 搜索高亮交互回调
   * 统一处理 click/hover/dblclick/contextmenu
   * 点击搜索高亮时使用统一气泡显示所有重叠的选区和搜索高亮
   */
  const onSearchHighlightInteraction = (event: {
    type: 'click' | 'hover' | 'dblclick' | 'contextmenu'
    text: string
    range: Range | null
    originalEvent: MouseEvent
    highlightId?: string
  }): void => {
    // 只处理 click 事件显示气泡
    if (event.type !== 'click') return

    const mouseEvent = event.originalEvent
    const clickX = mouseEvent?.clientX || 0
    const clickY = mouseEvent?.clientY || 0

    // 构建统一的选区项列表
    const items: SelectionItem[] = []

    // 1. 检测已保存选区
    const sdkInstance = getSDKInstance()
    let overlappedSelections: any[] = []

    if (sdkInstance) {
      overlappedSelections = sdkInstance.detectAllSelectionsAtPoint(clickX, clickY)
    }

    // 过滤掉搜索高亮类型的选区
    const savedSelections = overlappedSelections.filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    // 将已保存选区转换为统一格式
    const savedItems: SelectionItem[] = []
    for (const overlap of savedSelections) {
      const savedItem: SelectionItem = {
        id: overlap.selectionId,
        itemType: 'saved',
        text: overlap.text,
        styleType: overlap.selectionData?.type,
        selectionData: overlap.selectionData
      }
      items.push(savedItem)
      savedItems.push(savedItem)
    }

    // 2. 检测搜索高亮，并过滤掉已保存的
    const searchItems = detectSearchHighlightsAtPoint(clickX, clickY)
    const filteredSearchItems = filterDuplicateSearchItems(searchItems, savedItems)
    items.push(...filteredSearchItems)

    // 如果没有检测到任何选区项，不显示气泡
    if (items.length === 0) return

    // 计算气泡位置 - 使用鼠标点击位置
    const clickPosition: PopoverData['position'] = {
      x: clickX,
      y: clickY,
      width: 0,
      height: 0
    }

    // 使用新的统一气泡 API
    popover.showPopover({
      position: clickPosition,
      items,
      timestamp: Date.now()
    })

    // 记录气泡显示时间，防止 cleared 事件关闭气泡
    lastPopoverShowTime = Date.now()
  }

  // ========== 返回接口 ==========
  return {
    onSelectionAction,
    onSearchHighlightInteraction
  }
}

/**
 * Hook 返回值类型
 */
export type UseSelectionCallbacksReturn = ReturnType<typeof useSelectionCallbacks>
