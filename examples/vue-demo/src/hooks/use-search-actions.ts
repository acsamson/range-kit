import {
  UseSearchHighlightReturn,
  SearchMatchItem
} from 'range-kit-vue'

export interface UseSearchActionsOptions {
  /** 添加搜索关键词 */
  addSearchKeyword: UseSearchHighlightReturn['addSearchKeyword']
  /** 移除搜索关键词 */
  removeSearchKeyword: UseSearchHighlightReturn['removeSearchKeyword']
  /** 清除所有搜索高亮 */
  clearSearchHighlights: UseSearchHighlightReturn['clearSearchHighlights']
}

/**
 * 创建跳过重叠选区的过滤函数
 */
const createSkipOverlapFilter = () => {
  return (items: SearchMatchItem[]): SearchMatchItem[] => {
    return items.filter(item => !item.hasOverlap)
  }
}

/**
 * 搜索操作 Hook
 *
 * @description
 * 处理搜索组件的 UI 事件，连接组件和 useSearchHighlight Hook
 */
export function useSearchActions(options: UseSearchActionsOptions) {
  const { addSearchKeyword, removeSearchKeyword, clearSearchHighlights } = options

  /**
   * 处理添加搜索关键词
   */
  const handleAddSearchKeyword = async (
    keyword: string,
    type: string,
    searchOptions: { caseSensitive: boolean; wholeWord: boolean; skipOverlap?: boolean }
  ): Promise<void> => {
    await addSearchKeyword(keyword, type, {
      caseSensitive: searchOptions.caseSensitive,
      wholeWord: searchOptions.wholeWord,
      filterMatches: searchOptions.skipOverlap ? createSkipOverlapFilter() : undefined
    })
  }

  /**
   * 处理移除搜索关键词
   */
  const handleRemoveSearchKeyword = (keyword: string): void => {
    removeSearchKeyword(keyword)
  }

  /**
   * 处理清除所有搜索关键词
   */
  const handleClearSearchKeywords = (): void => {
    clearSearchHighlights()
  }

  return {
    handleAddSearchKeyword,
    handleRemoveSearchKeyword,
    handleClearSearchKeywords
  }
}

export type UseSearchActionsReturn = ReturnType<typeof useSearchActions>
