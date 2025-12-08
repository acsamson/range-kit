import type { Ref } from 'vue'
import type { InteractionType, BaseInteractionEvent } from '../common'
import type { SelectionRestoreAPI, SelectionTypeConfig, SearchMatchItem, SearchMatchFilter } from 'range-kit'

// 重新导出类型供外部使用
export type { SearchMatchItem, SearchMatchFilter }

/**
 * 搜索高亮交互类型（复用通用类型）
 */
export type SearchHighlightInteractionType = InteractionType

/**
 * 搜索高亮交互事件数据
 * 继承自 BaseInteractionEvent，添加搜索高亮特有字段
 * 注意：不包含 position，UI 层使用 common 工具函数计算
 */
export interface SearchHighlightInteractionEvent extends BaseInteractionEvent {
  /** 关键词文本 */
  text: string
  /** 已选中的 Range（可用于计算位置或保存选区） */
  range: Range | null
}

/**
 * 搜索高亮选项
 */
export interface SearchHighlightOptions {
  /** 是否区分大小写，默认 false */
  caseSensitive?: boolean
  /** 是否全词匹配，默认 false */
  wholeWord?: boolean
  /** 最大匹配数量，默认不限制 */
  maxMatches?: number
  /**
   * 自定义过滤函数
   * 可用于过滤掉与已有选区重叠的匹配项，或只展示特定的匹配项
   * @param items - 所有匹配项，每项包含重叠信息
   * @param keyword - 搜索关键词
   * @returns 过滤后要高亮的匹配项
   * @example
   * // 过滤掉重叠选区
   * filterMatches: (items) => items.filter(item => !item.hasOverlap)
   * // 只展示第一个匹配项
   * filterMatches: (items) => items.slice(0, 1)
   */
  filterMatches?: SearchMatchFilter
}

/**
 * 搜索高亮结果
 */
export interface SearchHighlightResult {
  /** 是否成功 */
  success: boolean
  /** 高亮的文本 */
  text: string
  /** 匹配数量 */
  matchCount: number
  /** 高亮实例列表 */
  instances: Array<{ id: string; text: string }>
}

/**
 * 搜索结果项（包含类型信息）
 * 用于 Kit 内部管理搜索结果状态
 */
export interface SearchResultItem {
  /** 搜索关键词 */
  keyword: string
  /** 匹配数量 */
  matchCount: number
  /** 高亮类型 */
  type: string
  /** 高亮实例 ID 列表 */
  highlightIds: string[]
}

/**
 * useSearchHighlight hook 配置选项
 */
export interface UseSearchHighlightOptions {
  /** 获取 range-kit 实例 */
  getInstance: () => SelectionRestoreAPI | null
  /** 容器选择器数组 */
  containers?: string[]
  /**
   * 搜索高亮样式配置
   * 用于定义不同类型搜索高亮的样式
   */
  selectionStyles?: SelectionTypeConfig[]
  /** 搜索高亮交互回调 - 统一处理 click/hover/dblclick/contextmenu */
  onSearchHighlightInteraction?: (event: SearchHighlightInteractionEvent) => void
}

/**
 * Hook 返回值接口
 */
export interface UseSearchHighlightReturn {
  /** 当前搜索高亮的关键词列表 */
  searchKeywords: Ref<string[]>
  /** 当前搜索结果列表（包含类型、匹配数等完整信息） */
  searchResults: Ref<SearchResultItem[]>
  /** 可用的搜索高亮样式类型 */
  availableTypes: SelectionTypeConfig[]
  /** 获取指定类型的样式配置 */
  getTypeConfig: (type: string) => SelectionTypeConfig | undefined
  /** 搜索并高亮指定关键词 */
  searchAndHighlight: (keywords: string | string[], type?: string, options?: SearchHighlightOptions) => Promise<SearchHighlightResult[]>
  /** 清除搜索高亮 */
  clearSearchHighlights: (keywords?: string | string[]) => void
  /** 添加搜索关键词 */
  addSearchKeyword: (keyword: string, type?: string, options?: SearchHighlightOptions) => Promise<SearchHighlightResult | null>
  /** 移除搜索关键词 */
  removeSearchKeyword: (keyword: string) => void
}
