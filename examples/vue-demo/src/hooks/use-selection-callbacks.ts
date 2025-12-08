import type {
  SelectionRestoreAPI,
  SelectionActionEvent,
  PopoverItem
} from 'range-kit-vue'
import { isPointInRange } from 'range-kit-vue'
import type { Ref } from 'vue'
import type { PopoverData, UsePopoverReturn } from './use-popover'

type SelectionItem = PopoverItem

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
 * 词典卡片配置接口
 */
export interface DictionaryCardConfig {
  enabled: boolean
  triggerAction: 'hover' | 'click' | 'dblclick' | 'contextmenu'
  /** 卡片标题 */
  title: string
  /** 卡片内容模板，可使用 {{keyword}} 作为占位符 */
  contentTemplate: string
  /** 是否在卡片中显示关键词 */
  showKeyword: boolean
}

/**
 * 选区回调配置选项
 */
export interface UseSelectionCallbacksOptions {
  /** 气泡管理 hook 返回值 */
  popover: UsePopoverReturn
  /** 获取实例的函数 */
  getInstance: () => SelectionRestoreAPI | null
  /** 获取搜索结果列表的函数（用于检测搜索高亮） */
  getSearchResults?: () => Ref<SearchResultItem[]> | null
  /** 获取当前交互模式 */
  getInteractionMode?: () => string
  /** 获取词典卡片配置 */
  getDictionaryCardConfig?: () => DictionaryCardConfig
}

/**
 * 选区行为回调 Hook
 */
export function useSelectionCallbacks(options: UseSelectionCallbacksOptions) {
  const { popover, getInstance, getSearchResults, getInteractionMode, getDictionaryCardConfig } = options

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

    const instance = getInstance()
    if (!instance) {
      return items
    }

    // 遍历所有搜索结果，检测点击位置是否在其 Range 范围内
    for (const result of searchResults.value) {
      for (const highlightId of result.highlightIds) {
        // 获取该搜索高亮的 Range
        const range = instance.getActiveRange(highlightId)
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
   * 统一选区动作回调
   * 处理所有选区相关事件：created/cleared/click/hover/dblclick/contextmenu
   */
  const onSelectionAction = (event: SelectionActionEvent): void => {
    // 获取当前交互模式，默认为 'click'
    const currentMode = getInteractionMode?.() || 'click'

    switch (event.type) {
      case 'created':
        handleCreatedAction(event)
        break
      case 'cleared':
        handleClearedAction()
        break
      case 'click':
        if (currentMode === 'click') {
          handleClickAction(event)
        }
        break
      case 'hover':
        if (currentMode === 'hover') {
          handleClickAction(event)
        }
        break
      case 'dblclick':
        if (currentMode === 'dblclick') {
          handleClickAction(event)
        }
        break
      case 'contextmenu':
        if (currentMode === 'contextmenu') {
          event.originalEvent?.preventDefault() // 阻止默认右键菜单
          handleClickAction(event)
        }
        break
      default:
        break
    }
  }

  /**
   * 处理新建选区动作
   * 当用户划选文本或点击已保存选区时触发
   * 注意：搜索高亮由 onSearchHighlightInteraction 独立处理
   */
  const handleCreatedAction = (event: SelectionActionEvent): void => {
    if (!event.text || event.text.length === 0) return

    const position = event.position

    // 构建统一的选区项列表
    const items: SelectionItem[] = []

    // 过滤掉搜索高亮（搜索高亮由 onSearchHighlightInteraction 独立处理）
    const savedSelectionOverlaps = (event.overlappedSelections || []).filter(
      (overlap: unknown) => (overlap as { selectionData?: { type?: string } }).selectionData?.type !== 'search'
    )

    // 如果当前选区完全被某个已保存选区包含，说明用户点击的是已保存选区
    const containingSelection = savedSelectionOverlaps.find(
      (overlap: unknown) => (overlap as { overlapType?: string }).overlapType === 'EXISTING_CONTAINS_CURRENT'
    )

    if (containingSelection) {
      // 点击已保存选区 - 添加所有重叠的已保存选区
      for (const overlap of savedSelectionOverlaps) {
        const typedOverlap = overlap as { selectionId: string; text: string; selectionData?: { type?: string } }
        items.push({
          id: typedOverlap.selectionId,
          itemType: 'saved',
          text: typedOverlap.text,
          styleType: typedOverlap.selectionData?.type,
          selectionData: typedOverlap.selectionData
        })
      }

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

    // 新建选区 - 添加新划选的文本
    if (event.range) {
      items.push({
        id: `new_${Date.now()}`,
        itemType: 'new',
        text: event.text,
        range: event.range
      })
    }

    // 添加重叠的已保存选区（可删除）
    for (const overlap of savedSelectionOverlaps) {
      const typedOverlap = overlap as { selectionId: string; text: string; selectionData?: { type?: string } }
      items.push({
        id: typedOverlap.selectionId,
        itemType: 'saved',
        text: typedOverlap.text,
        styleType: typedOverlap.selectionData?.type,
        selectionData: typedOverlap.selectionData
      })
    }

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
   * 仅处理已保存选区，搜索高亮由 onSearchHighlightInteraction 独立处理
   */
  const handleClickAction = (event: SelectionActionEvent): void => {
    // 计算点击位置
    const mouseEvent = event.originalEvent as MouseEvent
    const clickX = mouseEvent?.clientX || 0
    const clickY = mouseEvent?.clientY || 0

    // 构建统一的选区项列表
    const items: SelectionItem[] = []

    // 1. 检测已保存选区
    const instance = getInstance()
    let overlappedSelections: any[] = []

    if (instance) {
      overlappedSelections = instance.detectAllSelectionsAtPoint(clickX, clickY)
    }

    // 如果没有返回结果，降级使用当前点击的选区
    if (overlappedSelections.length === 0 && event.savedSelectionId) {
      overlappedSelections = [{
        selectionId: event.savedSelectionId,
        text: event.text,
        selectionData: event.savedSelection
      }]
    }

    // 过滤掉搜索高亮类型的选区（搜索高亮由 onSearchHighlightInteraction 独立处理）
    const savedSelections = overlappedSelections.filter(
      (overlap: any) => overlap.selectionData?.type !== 'search'
    )

    // 将已保存选区转换为统一格式
    for (const overlap of savedSelections) {
      items.push({
        id: overlap.selectionId,
        itemType: 'saved',
        text: overlap.text,
        styleType: overlap.selectionData?.type,
        selectionData: overlap.selectionData
      })
    }

    // 如果没有检测到任何已保存选区，不显示气泡
    // 搜索高亮会通过 onSearchHighlightInteraction 独立触发
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
   *
   * 注意：搜索高亮的交互模式可以通过词典卡片配置独立控制，
   * 与左侧控制面板的选区交互模式互不影响
   */
  const onSearchHighlightInteraction = (event: {
    type: 'click' | 'hover' | 'dblclick' | 'contextmenu'
    text: string
    range: Range | null
    originalEvent: MouseEvent
    highlightId?: string
  }): void => {
    // 获取词典卡片配置
    const dictionaryConfig = getDictionaryCardConfig?.()


    // 如果词典卡片功能已启用，使用词典卡片的独立触发动作
    // 否则使用左侧控制面板的交互模式（保持向后兼容）
    let targetMode: string
    if (dictionaryConfig?.enabled) {
      targetMode = dictionaryConfig.triggerAction
    } else {
      // 词典卡片未启用时，使用左侧控制面板的交互模式
      targetMode = getInteractionMode?.() || 'click'
    }

    // 根据目标模式过滤事件
    if (event.type !== targetMode) return

    // 如果是右键菜单，阻止默认行为
    if (event.type === 'contextmenu') {
      event.originalEvent?.preventDefault()
    }

    const mouseEvent = event.originalEvent
    const clickX = mouseEvent?.clientX || 0
    const clickY = mouseEvent?.clientY || 0

    // 构建统一的选区项列表
    const items: SelectionItem[] = []

    // 1. 检测已保存选区
    const instance = getInstance()
    let overlappedSelections: any[] = []

    if (instance) {
      overlappedSelections = instance.detectAllSelectionsAtPoint(clickX, clickY)
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

    // 获取词典卡片配置，用于在气泡中显示自定义内容
    // 注意：这里使用 dictionaryConfig 变量（在函数开头已获取）
    const hasDictionaryDisplayConfig = dictionaryConfig?.enabled && filteredSearchItems.length > 0

    // 使用新的统一气泡 API
    popover.showPopover({
      position: clickPosition,
      items,
      timestamp: Date.now(),
      // 如果启用了词典卡片且有搜索高亮，传递词典配置
      ...(hasDictionaryDisplayConfig && {
        dictionaryConfig: {
          title: dictionaryConfig!.title,
          contentTemplate: dictionaryConfig!.contentTemplate,
          showKeyword: dictionaryConfig!.showKeyword
        }
      })
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
