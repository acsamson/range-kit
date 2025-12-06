import { useState, useCallback } from 'react';
import type { 
    SelectionRestore, 
    SelectionTypeConfig 
} from '@l2c/range-kit-core';

// Duplicate types to avoid deep imports if not exported, or just define subset
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
  maxMatches?: number;
  filterMatches?: (items: any[], keyword: string) => any[];
}

export interface UseSearchHighlightOptions {
  getSDKInstance: () => SelectionRestore | null;
  containers?: string[];
  selectionStyles?: SelectionTypeConfig[];
}

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

export function useSearchHighlight(options: UseSearchHighlightOptions) {
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  
  const selectionStyles = [
      ...DEFAULT_SEARCH_HIGHLIGHT_TYPES,
      ...(options.selectionStyles || [])
  ];

  const ensureTypeRegistered = useCallback((type: string) => {
      const sdk = options.getSDKInstance();
      if (!sdk) return;
      const typeConfig = selectionStyles.find(t => t.type === type);
      if (typeConfig) {
          sdk.registerSelectionType(typeConfig);
      }
  }, [options.getSDKInstance]);

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

  const searchAndHighlight = useCallback(async (
      keywords: string | string[],
      type: string = 'search',
      searchOptions: SearchHighlightOptions = {}
  ) => {
      const sdk = options.getSDKInstance();
      if (!sdk) throw new Error('SDK not initialized');

      ensureTypeRegistered(type);

      const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
      const results: SearchHighlightResult[] = [];
      const containers = options.containers?.length ? options.containers : ['body'];

      for (const keyword of keywordArray) {
          if (!keyword?.trim()) continue;

          try {
              const result = await sdk.highlightTextInContainers(keyword, type, containers, {
                  caseSensitive: searchOptions.caseSensitive,
                  wholeWord: searchOptions.wholeWord,
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
          } catch (e) {
              results.push({ success: false, text: keyword, matchCount: 0, instances: [] });
          }
      }
      return results;
  }, [options.getSDKInstance, options.containers, ensureTypeRegistered, updateSearchResult]);

  const clearSearchHighlights = useCallback((keywords?: string | string[]) => {
      const sdk = options.getSDKInstance();
      if (!sdk) return;

      const containers = options.containers?.length ? options.containers : ['body'];

      if (keywords) {
          const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
          for (const keyword of keywordArray) {
              sdk.clearTextHighlights(keyword, containers);
              
              setSearchKeywords(prev => prev.filter(k => k !== keyword));
              setSearchResults(prev => prev.filter(r => r.keyword !== keyword));
          }
      } else {
          sdk.clearTextHighlights(undefined, containers);
          setSearchKeywords([]);
          setSearchResults([]);
      }
  }, [options.getSDKInstance, options.containers]);

  return {
      searchKeywords,
      searchResults,
      availableTypes: selectionStyles,
      searchAndHighlight,
      clearSearchHighlights
  };
}
