import { ElMessage } from 'element-plus'
import type { UseSearchHighlightReturn, SearchHighlightResult, SearchHighlightOptions } from '../../../../../vue/hooks/use-search-highlight/types'

/**
 * 搜索操作配置选项
 */
export interface UseSearchActionsOptions {
  /** useSearchHighlight hook 返回值中的方法 */
  addSearchKeyword: UseSearchHighlightReturn['addSearchKeyword']
  removeSearchKeyword: UseSearchHighlightReturn['removeSearchKeyword']
  clearSearchHighlights: UseSearchHighlightReturn['clearSearchHighlights']
}

/**
 * 添加搜索关键词的选项
 */
export interface AddKeywordOptions {
  /** 是否区分大小写 */
  caseSensitive?: boolean
  /** 是否全词匹配 */
  wholeWord?: boolean
  /** 自定义过滤函数 */
  filterMatches?: SearchHighlightOptions['filterMatches']
}

/**
 * 搜索高亮操作 Hook
 *
 * @description
 * 提供搜索高亮的操作封装，包括：
 * - 添加搜索关键词
 * - 移除搜索关键词
 * - 清除所有搜索高亮
 *
 * @example
 * ```ts
 * const {
 *   addSearchKeyword,
 *   removeSearchKeyword,
 *   clearSearchHighlights
 * } = useSearchHighlight({ ... })
 *
 * const {
 *   handleAddSearchKeyword,
 *   handleRemoveSearchKeyword,
 *   handleClearSearchKeywords
 * } = useSearchActions({
 *   addSearchKeyword,
 *   removeSearchKeyword,
 *   clearSearchHighlights
 * })
 *
 * // 添加搜索关键词
 * await handleAddSearchKeyword('关键词', 'search', { caseSensitive: false })
 *
 * // 移除搜索关键词
 * handleRemoveSearchKeyword('关键词')
 *
 * // 清除所有搜索高亮
 * handleClearSearchKeywords()
 * ```
 */
export function useSearchActions(options: UseSearchActionsOptions) {
  const {
    addSearchKeyword,
    removeSearchKeyword,
    clearSearchHighlights
  } = options

  /**
   * 添加搜索关键词（支持指定类型）
   * SDK 内部自动管理 searchResults 状态
   *
   * @param keyword - 搜索关键词
   * @param type - 高亮类型
   * @param options - 搜索选项（大小写敏感、全词匹配等）
   */
  const handleAddSearchKeyword = async (
    keyword: string,
    type: string,
    options: AddKeywordOptions = {}
  ): Promise<SearchHighlightResult | null> => {
    try {
      const result = await addSearchKeyword(keyword, type, {
        caseSensitive: options.caseSensitive ?? false,
        wholeWord: options.wholeWord ?? false,
        filterMatches: options.filterMatches
      })
      if (result) {
        if (result.matchCount > 0) {
          ElMessage.success(`找到 ${result.matchCount} 个匹配项`)
        } else {
          ElMessage.warning(`未找到关键词 "${keyword}"`)
        }
        return result
      }
      return null
    } catch (err: any) {
      ElMessage.error('搜索失败: ' + err.message)
      return null
    }
  }

  /**
   * 移除搜索关键词
   * SDK 内部自动更新 searchResults 状态
   *
   * @param keyword - 要移除的关键词
   */
  const handleRemoveSearchKeyword = (keyword: string): void => {
    removeSearchKeyword(keyword)
    ElMessage.success(`已移除 "${keyword}"`)
  }

  /**
   * 清除所有搜索关键词
   * SDK 内部自动清空 searchResults 状态
   */
  const handleClearSearchKeywords = (): void => {
    clearSearchHighlights()
    ElMessage.success('已清除所有搜索高亮')
  }

  // ========== 返回接口 ==========
  return {
    handleAddSearchKeyword,
    handleRemoveSearchKeyword,
    handleClearSearchKeywords
  }
}

/**
 * Hook 返回值类型
 */
export type UseSearchActionsReturn = ReturnType<typeof useSearchActions>
