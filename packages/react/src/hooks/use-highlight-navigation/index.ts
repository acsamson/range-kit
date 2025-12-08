import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { SelectionRestore } from 'range-kit';
import { scrollToRange } from '../../utils/scroll';

export interface NavigableHighlight {
  id: string;
  text: string;
  range?: Range;
  type?: string;
  data?: any;
}

export interface CurrentHighlightStyle {
  backgroundColor?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  transition?: string;
}

export interface UseHighlightNavigationOptions {
  getInstance: () => SelectionRestore | null;
  currentHighlightStyle?: CurrentHighlightStyle;
  onHighlightStyleChange?: (highlightId: string, isCurrent: boolean) => void;
  onNavigate?: (highlight: NavigableHighlight, index: number) => void;
  loop?: boolean;
  autoScroll?: boolean;
}

export const DEFAULT_CURRENT_HIGHLIGHT_STYLE: CurrentHighlightStyle = {
  backgroundColor: '#ff9632',
  color: '#000000',
  border: 'none',
  borderRadius: '2px',
  transition: 'background-color 0.15s ease'
};

export const CURRENT_HIGHLIGHT_NAME = 'current-navigation-highlight';

export function useHighlightNavigation(options: UseHighlightNavigationOptions) {
  const {
    getInstance,
    currentHighlightStyle = DEFAULT_CURRENT_HIGHLIGHT_STYLE,
    onHighlightStyleChange,
    onNavigate,
    loop = true,
    autoScroll = true
  } = options;

  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [highlightList, setHighlightList] = useState<NavigableHighlight[]>([]);

  // Use ref for highlight instance to persist across renders
  // Note: Highlight API might not be available in all environments (SSR)
  const currentHighlightInstanceRef = useRef<any>(null);
  
  useEffect(() => {
      if (typeof window !== 'undefined' && (window as any).Highlight) {
          currentHighlightInstanceRef.current = new (window as any).Highlight();
      }
  }, []);

  useEffect(() => {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;
    
    const styleId = 'highlight-navigation-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const style = { ...DEFAULT_CURRENT_HIGHLIGHT_STYLE, ...currentHighlightStyle };
    styleElement.textContent = `
      ::highlight(${CURRENT_HIGHLIGHT_NAME}) {
        background-color: ${style.backgroundColor} !important;
        color: ${style.color || 'inherit'};
        border: ${style.border || 'none'};
        border-radius: ${style.borderRadius || '2px'};
        transition: ${style.transition || 'background-color 0.15s ease'};
      }
    `;

    const highlightInstance = new (window as any).Highlight();
    (CSS as any).highlights.set(CURRENT_HIGHLIGHT_NAME, highlightInstance);
    
    // Clean up
    return () => {
      if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
        (CSS as any).highlights.delete(CURRENT_HIGHLIGHT_NAME);
      }
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [currentHighlightStyle]);

  const applyCurrentHighlightStyle = useCallback((highlight: NavigableHighlight | null) => {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;
    const highlightInstance = (CSS as any).highlights.get(CURRENT_HIGHLIGHT_NAME);
    if (!highlightInstance) return;

    highlightInstance.clear();
    if (highlight && highlight.range) {
      highlightInstance.add(highlight.range);
    }
  }, []);

  const refresh = useCallback(() => {
    const instance = getInstance();
    if (!instance) return;

    const selectionIds = instance.getAllActiveSelectionIds();
    const highlights: NavigableHighlight[] = [];

    for (const id of selectionIds) {
      const range = instance.getActiveRange(id);
      if (range) {
        highlights.push({
          id,
          text: range.toString(),
          range
        });
      }
    }

    setHighlightList(highlights);

    // Reset index if out of bounds
    if (currentIndex >= highlights.length) {
      setCurrentIndex(highlights.length > 0 ? 0 : -1);
    }
  }, [getInstance, currentIndex]);

  const goToIndex = useCallback((index: number) => {
    // Need latest list, so we call refresh first?
    // Or rely on state. State might be stale if Kit updated.
    // Better to fetch from Kit again or rely on caller to refresh.
    // Let's fetch fresh list.
    const instance = getInstance();
    if (!instance) return;

    const selectionIds = instance.getAllActiveSelectionIds();
    const currentList: NavigableHighlight[] = selectionIds.map(id => {
        const range = instance.getActiveRange(id);
        return range ? { id, text: range.toString(), range } : null;
    }).filter(Boolean) as NavigableHighlight[];
    
    if (currentList.length === 0) {
        setCurrentIndex(-1);
        setHighlightList([]);
        return;
    }
    
    setHighlightList(currentList);

    let targetIndex = index;
    if (loop) {
      if (targetIndex < 0) targetIndex = currentList.length - 1;
      else if (targetIndex >= currentList.length) targetIndex = 0;
    } else {
      targetIndex = Math.max(0, Math.min(targetIndex, currentList.length - 1));
    }

    const prevIndex = currentIndex;
    setCurrentIndex(targetIndex);
    
    const highlight = currentList[targetIndex];
    applyCurrentHighlightStyle(highlight);

    if (onHighlightStyleChange) {
       if (prevIndex >= 0 && prevIndex < currentList.length) {
         onHighlightStyleChange(currentList[prevIndex].id, false);
       }
       onHighlightStyleChange(highlight.id, true);
    }

    onNavigate?.(highlight, targetIndex);

    if (autoScroll && highlight.range) {
       scrollToRange(highlight.range);
    }
  }, [getInstance, loop, autoScroll, currentIndex, applyCurrentHighlightStyle, onHighlightStyleChange, onNavigate]);

  const goToNext = useCallback(() => goToIndex(currentIndex + 1), [goToIndex, currentIndex]);
  const goToPrev = useCallback(() => goToIndex(currentIndex - 1), [goToIndex, currentIndex]);
  
  const reset = useCallback(() => {
      const prevIndex = currentIndex;
      setCurrentIndex(-1);
      applyCurrentHighlightStyle(null);
       if (onHighlightStyleChange && prevIndex >= 0 && prevIndex < highlightList.length) {
         onHighlightStyleChange(highlightList[prevIndex].id, false);
       }
  }, [currentIndex, highlightList, applyCurrentHighlightStyle, onHighlightStyleChange]);

  const currentHighlight = useMemo(() => {
      if (currentIndex < 0 || currentIndex >= highlightList.length) return null;
      return highlightList[currentIndex];
  }, [currentIndex, highlightList]);

  return {
    currentIndex,
    total: highlightList.length,
    currentHighlight,
    hasPrev: loop ? highlightList.length > 0 : currentIndex > 0,
    hasNext: loop ? highlightList.length > 0 : currentIndex < highlightList.length - 1,
    goToNext,
    goToPrev,
    goToIndex,
    reset,
    refresh
  };
}
