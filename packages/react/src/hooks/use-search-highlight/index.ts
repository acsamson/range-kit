import { useState, useCallback, useRef, useEffect } from 'react';
import type {
    SelectionRestore,
    SelectionTypeConfig
} from 'range-kit';
import { createInteractionHandler } from '../common';

// ========== 类型定义 ==========

export interface SearchResultItem {
  keyword: string;
  matchCount: number;
  type: string;
  highlightIds: string[];
}

export interface SearchHighlightResult {
  success: boolean;
  text: string;
  matchCount: number;
  instances: Array<{ id: string; text: string }>;
}

export interface SearchHighlightOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  skipOverlap?: boolean;
  maxMatches?: number;
  filterMatches?: (items: unknown[], keyword: string) => unknown[];
}

export interface SearchHighlightInteractionEvent {
  type: 'click' | 'hover' | 'dblclick' | 'contextmenu';
  text: string;
  range?: Range;
  originalEvent?: Event;
}

export interface UseSearchHighlightOptions {
  getInstance: () => SelectionRestore | null;
  containers?: string[];
  selectionStyles?: SelectionTypeConfig[];
  onSearchHighlightInteraction?: (event: SearchHighlightInteractionEvent) => void;
}

export interface UseSearchHighlightReturn {
  searchKeywords: string[];
  searchResults: SearchResultItem[];
  availableTypes: SelectionTypeConfig[];
  getTypeConfig: (type: string) => SelectionTypeConfig | undefined;
  searchAndHighlight: (keywords: string | string[], type?: string, options?: SearchHighlightOptions) => Promise<SearchHighlightResult[]>;
  clearSearchHighlights: (keywords?: string | string[]) => void;
  addSearchKeyword: (keyword: string, type?: string, options?: SearchHighlightOptions) => Promise<SearchHighlightResult | null>;
  removeSearchKeyword: (keyword: string) => void;
}

// ========== 常量 ==========

export const DEFAULT_SEARCH_HIGHLIGHT_STYLE = {
  backgroundColor: '#fff3cd',
  textDecoration: 'underline',
  textDecorationColor: '#f1c40f',
  textDecorationThickness: '2px',
  textUnderlineOffset: '2px'
};

export const DEFAULT_SEARCH_HIGHLIGHT_TYPES: SelectionTypeConfig[] = [
  {
    type: 'search',
    label: '搜索高亮',
    style: DEFAULT_SEARCH_HIGHLIGHT_STYLE,
    description: '默认的搜索高亮样式'
  }
];

// ========== Hook 实现 ==========

/**
 * 搜索高亮 Hook
 * 独立的搜索高亮功能，可单独使用或与 useSelectionRestore 配合使用
 */
export function useSearchHighlight(options: UseSearchHighlightOptions): UseSearchHighlightReturn {
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  
  // 使用 ref 追踪关键词，供 interaction handler 使用
  const searchKeywordsRef = useRef<string[]>([]);

  // 同步 searchKeywords 到 ref
  useEffect(() => {
    searchKeywordsRef.current = searchKeywords;
  }, [searchKeywords]);

  const selectionStyles = [
    ...DEFAULT_SEARCH_HIGHLIGHT_TYPES,
    ...(options.selectionStyles || [])
  ];

  // ========== 交互处理器 ==========
  
  useEffect(() => {
    if (!options.onSearchHighlightInteraction) return;

    const handler = createInteractionHandler({
      keywordsRef: searchKeywordsRef,
      containers: options.containers || [],
      onInteraction: (event) => {
        options.onSearchHighlightInteraction?.({
          type: event.type,
          text: event.text,
          range: event.range,
          originalEvent: event.originalEvent
        });
      }
    });

    handler.setup();

    return () => {
      handler.cleanup();
    };
  }, [options.onSearchHighlightInteraction, options.containers]);

  /**
   * 获取指定类型的样式配置
   */
  const getTypeConfig = useCallback((type: string): SelectionTypeConfig | undefined => {
    return selectionStyles.find(t => t.type === type);
  }, []);

  /**
   * 确保类型样式已注册到 Kit
   */
  const ensureTypeRegistered = useCallback((type: string) => {
    const instance = options.getInstance();
    if (!instance) return;
    const typeConfig = selectionStyles.find(t => t.type === type);
    if (typeConfig) {
      instance.registerSelectionType(typeConfig);
    }
  }, [options.getInstance]);

  /**
   * 更新搜索结果
   */
  const updateSearchResult = useCallback((keyword: string, type: string, matchCount: number, highlightIds: string[]) => {
    setSearchResults(prev => {
      const idx = prev.findIndex(r => r.keyword === keyword);
      if (idx >= 0) {
        const newResults = [...prev];
        newResults[idx] = { ...newResults[idx], matchCount, type, highlightIds };
        return newResults;
      } else {
        return [...prev, { keyword, matchCount, type, highlightIds }];
      }
    });
  }, []);

  /**
   * 搜索并高亮关键词
   */
  const searchAndHighlight = useCallback(async (
    keywords: string | string[],
    type: string = 'search',
    searchOptions: SearchHighlightOptions = {}
  ): Promise<SearchHighlightResult[]> => {
    const instance = options.getInstance();
    if (!instance) throw new Error('Not initialized');

    ensureTypeRegistered(type);

    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    const results: SearchHighlightResult[] = [];
    const containers = options.containers?.length ? options.containers : ['body'];

    for (const keyword of keywordArray) {
      if (!keyword?.trim()) continue;

      try {
        // 注意：不再传递 onInteraction，由 createInteractionHandler 统一处理
        const result = await instance.highlightTextInContainers(keyword, type, containers, {
          caseSensitive: searchOptions.caseSensitive ?? false,
          wholeWord: searchOptions.wholeWord ?? false,
          maxMatches: searchOptions.maxMatches,
          filterMatches: searchOptions.filterMatches
        });

        setSearchKeywords(prev => {
          if (!prev.includes(keyword)) return [...prev, keyword];
          return prev;
        });

        const matchCount = result.success || 0;
        const highlightIds = result.highlightIds || [];

        updateSearchResult(keyword, type, matchCount, highlightIds);

        results.push({
          success: matchCount > 0,
          text: keyword,
          matchCount,
          instances: highlightIds.map((id: string) => ({ id, text: keyword }))
        });
      } catch {
        results.push({ success: false, text: keyword, matchCount: 0, instances: [] });
      }
    }
    return results;
  }, [options.getInstance, options.containers, ensureTypeRegistered, updateSearchResult]);

  /**
   * 清除搜索高亮
   */
  const clearSearchHighlights = useCallback((keywords?: string | string[]) => {
    const instance = options.getInstance();
    if (!instance) return;

    const containers = options.containers?.length ? options.containers : ['body'];

    if (keywords) {
      const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
      for (const keyword of keywordArray) {
        instance.clearTextHighlights(keyword, containers);

        setSearchKeywords(prev => prev.filter(k => k !== keyword));
        setSearchResults(prev => prev.filter(r => r.keyword !== keyword));
      }
    } else {
      instance.clearTextHighlights(undefined, containers);
      setSearchKeywords([]);
      setSearchResults([]);
    }
  }, [options.getInstance, options.containers]);

  /**
   * 添加搜索关键词
   */
  const addSearchKeyword = useCallback(async (
    keyword: string,
    type: string = 'search',
    searchOptions: SearchHighlightOptions = {}
  ): Promise<SearchHighlightResult | null> => {
    if (!keyword?.trim()) return null;
    const results = await searchAndHighlight(keyword, type, searchOptions);
    return results[0] || null;
  }, [searchAndHighlight]);

  /**
   * 移除搜索关键词
   */
  const removeSearchKeyword = useCallback((keyword: string) => {
    clearSearchHighlights(keyword);
  }, [clearSearchHighlights]);

  return {
    searchKeywords,
    searchResults,
    availableTypes: selectionStyles,
    getTypeConfig,
    searchAndHighlight,
    clearSearchHighlights,
    addSearchKeyword,
    removeSearchKeyword
  };
}
