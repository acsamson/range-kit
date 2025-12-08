import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type {
  UseSearchHighlightOptions,
  UseSearchHighlightReturn,
  SearchHighlightOptions,
  SearchHighlightResult,
  SearchResultItem
} from './types'
import { createInteractionHandler } from '../common'
import { DEFAULT_SEARCH_HIGHLIGHT_TYPES } from './constants'
import type { SelectionTypeConfig } from 'range-kit'

// 导出类型
export * from './types'

/**
 * 搜索高亮 Hook
 * 独立的搜索高亮功能，可单独使用或与 useSelectionRestore 配合使用
 */
export function useSearchHighlight(options: UseSearchHighlightOptions): UseSearchHighlightReturn {
  // ========== 响应式状态 ==========
  const searchKeywords = ref<string[]>([])
  /** 搜索结果列表（包含类型、匹配数等完整信息） */
  const searchResults = ref<SearchResultItem[]>([])

  // 样式配置
  const selectionStyles: SelectionTypeConfig[] = [
    ...DEFAULT_SEARCH_HIGHLIGHT_TYPES,
    ...(options.selectionStyles || [])
  ]

  // ========== 交互处理器 ==========
  const interactionHandler = options.onSearchHighlightInteraction
    ? createInteractionHandler({
        keywords: searchKeywords,
        containers: options.containers || [],
        onInteraction: (event) => {
          options.onSearchHighlightInteraction?.({
            type: event.type,
            text: event.text,
            range: event.range,
            originalEvent: event.originalEvent
          })
        }
      })
    : null

  // ========== 样式相关方法 ==========

  /**
   * 获取指定类型的样式配置
   */
  const getTypeConfig = (type: string): SelectionTypeConfig | undefined => {
    return selectionStyles.find(t => t.type === type)
  }

  // ========== 核心方法 ==========

  /**
   * 确保类型样式已注册到 Kit
   * 搜索高亮时需要先注册类型样式，才能正确应用样式
   */
  const ensureTypeRegistered = (type: string): void => {
    const instance = options.getInstance()
    if (!instance) return

    // 查找类型配置
    const typeConfig = selectionStyles.find(t => t.type === type)
    if (typeConfig) {
      // 注册类型到 Kit（如果已存在会覆盖）
      instance.registerSelectionType(typeConfig)
    }
  }

  /**
   * 更新搜索结果
   * 内部方法，用于统一管理 searchResults 状态
   */
  const updateSearchResult = (keyword: string, type: string, matchCount: number, highlightIds: string[]): void => {
    const existingIndex = searchResults.value.findIndex(r => r.keyword === keyword)
    if (existingIndex >= 0) {
      // 更新现有结果
      searchResults.value[existingIndex].matchCount = matchCount
      searchResults.value[existingIndex].type = type
      searchResults.value[existingIndex].highlightIds = highlightIds
    } else {
      // 添加新结果
      searchResults.value.push({ keyword, matchCount, type, highlightIds })
    }
  }

  /**
   * 搜索并高亮关键词
   */
  const searchAndHighlight = async (
    keywords: string | string[],
    type: string = 'search',
    searchOptions: SearchHighlightOptions = {}
  ): Promise<SearchHighlightResult[]> => {
    const instance = options.getInstance()
    if (!instance) throw new Error('Kit未初始化')

    // 确保类型样式已注册
    ensureTypeRegistered(type)

    const keywordArray = Array.isArray(keywords) ? keywords : [keywords]
    const results: SearchHighlightResult[] = []
    const containers = options.containers?.length ? options.containers : ['body']

    for (const keyword of keywordArray) {
      if (!keyword?.trim()) continue

      try {
        const result = await instance.highlightTextInContainers(keyword, type, containers, {
          caseSensitive: searchOptions.caseSensitive ?? false,
          wholeWord: searchOptions.wholeWord ?? false,
          maxMatches: searchOptions.maxMatches,
          filterMatches: searchOptions.filterMatches as ((items: unknown[], keyword: string) => unknown[]) | undefined
        })

        if (!searchKeywords.value.includes(keyword)) {
          searchKeywords.value.push(keyword)
        }

        const matchCount = result.success || 0
        const highlightIds = result.highlightIds || []

        // 更新搜索结果状态
        updateSearchResult(keyword, type, matchCount, highlightIds)

        results.push({
          success: matchCount > 0,
          text: keyword,
          matchCount,
          instances: highlightIds.map((id: string) => ({ id, text: keyword }))
        })
      } catch {
        results.push({ success: false, text: keyword, matchCount: 0, instances: [] })
      }
    }

    return results
  }

  /**
   * 清除搜索高亮
   */
  const clearSearchHighlights = (keywords?: string | string[]) => {
    const instance = options.getInstance()
    if (!instance) return

    const containers = options.containers?.length ? options.containers : ['body']

    if (keywords) {
      const keywordArray = Array.isArray(keywords) ? keywords : [keywords]
      for (const keyword of keywordArray) {
        instance.clearTextHighlights(keyword, containers)
        // 移除关键词
        const keywordIndex = searchKeywords.value.indexOf(keyword)
        if (keywordIndex > -1) searchKeywords.value.splice(keywordIndex, 1)
        // 移除搜索结果
        const resultIndex = searchResults.value.findIndex(r => r.keyword === keyword)
        if (resultIndex > -1) searchResults.value.splice(resultIndex, 1)
      }
    } else {
      instance.clearTextHighlights(undefined, containers)
      searchKeywords.value = []
      searchResults.value = []
    }
  }

  /**
   * 添加搜索关键词
   */
  const addSearchKeyword = async (
    keyword: string,
    type: string = 'search',
    searchOptions: SearchHighlightOptions = {}
  ): Promise<SearchHighlightResult | null> => {
    if (!keyword?.trim()) return null
    const results = await searchAndHighlight(keyword, type, searchOptions)
    return results[0] || null
  }

  /**
   * 移除搜索关键词
   */
  const removeSearchKeyword = (keyword: string) => {
    clearSearchHighlights(keyword)
  }

  // ========== 生命周期 ==========

  onMounted(() => {
    interactionHandler?.setup()
  })

  onUnmounted(() => {
    interactionHandler?.cleanup()
  })

  // ========== 返回接口 ==========
  return {
    searchKeywords: searchKeywords as Ref<string[]>,
    searchResults: searchResults as Ref<SearchResultItem[]>,
    availableTypes: selectionStyles,
    getTypeConfig,
    searchAndHighlight,
    clearSearchHighlights,
    addSearchKeyword,
    removeSearchKeyword
  }
}
