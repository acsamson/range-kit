import { useCallback } from 'react'
import type { UseSearchHighlightReturn, SearchMatchItem } from 'range-kit-react'

export interface UseSearchActionsOptions {
  addSearchKeyword: UseSearchHighlightReturn['addSearchKeyword']
  removeSearchKeyword: UseSearchHighlightReturn['removeSearchKeyword']
  clearSearchHighlights: UseSearchHighlightReturn['clearSearchHighlights']
}

const createSkipOverlapFilter = () => {
  return (items: unknown[], _keyword: string): unknown[] => {
    // Cast items to SearchMatchItem[] to use filter logic
    // Assuming the core logic passes SearchMatchItem[] which has hasOverlap property
    const matchItems = items as SearchMatchItem[]
    return matchItems.filter(item => !item.hasOverlap)
  }
}

export function useSearchActions(options: UseSearchActionsOptions) {
  const { addSearchKeyword, removeSearchKeyword, clearSearchHighlights } = options

  const handleAddSearchKeyword = useCallback(async (
    keyword: string,
    type: string,
    searchOptions: { caseSensitive: boolean; wholeWord: boolean; skipOverlap?: boolean }
  ) => {
    await addSearchKeyword(keyword, type, {
      caseSensitive: searchOptions.caseSensitive,
      wholeWord: searchOptions.wholeWord,
      filterMatches: searchOptions.skipOverlap ? createSkipOverlapFilter() : undefined
    })
  }, [addSearchKeyword])

  const handleRemoveSearchKeyword = useCallback((keyword: string) => {
    removeSearchKeyword(keyword)
  }, [removeSearchKeyword])

  const handleClearSearchKeywords = useCallback(() => {
    clearSearchHighlights()
  }, [clearSearchHighlights])

  return {
    handleAddSearchKeyword,
    handleRemoveSearchKeyword,
    handleClearSearchKeywords
  }
}
