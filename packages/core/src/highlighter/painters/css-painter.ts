/**
 * CSS Highlights API 绘制器
 *
 * 基于 CSS Highlights API 的高亮实现
 * 支持多选区同时高亮和多种类型
 */

import type {
  IEventfulHighlighter,
  HighlightStyle,
  HighlightEventType,
  HighlightEventData,
  HighlightEventListener,
} from '../types';

import { HighlightEventType as EventType } from '../types';

// 检查浏览器是否支持 CSS Highlights API
export const isHighlightSupported =
  typeof Highlight !== 'undefined' && typeof CSS?.highlights !== 'undefined';

// 滚动边距
const SCROLL_MARGIN = 50;

/**
 * CSS 绘制器
 *
 * 基于 CSS Highlights API 实现的高亮绘制器
 */
export class CSSPainter implements IEventfulHighlighter {
  private styleElement: HTMLStyleElement | null = null;
  private activeHighlights: Map<string, Highlight> = new Map();
  private typeHighlights: Map<string, Highlight> = new Map();
  private highlightTypes: Map<string, string> = new Map();
  private highlightRanges: Map<string, Range> = new Map();
  private highlightId: number = 0;
  private defaultStyle: HighlightStyle;
  private eventListeners: Map<HighlightEventType, Set<HighlightEventListener>> = new Map();

  constructor() {
    this.defaultStyle = {
      backgroundColor: '#ffeaa7',
      color: 'inherit',
      textDecoration: 'none',
    };

    this.injectBaseStyles();

    // 初始化事件监听器映射
    Object.values(EventType).forEach(eventType => {
      this.eventListeners.set(eventType, new Set());
    });
  }

  // ========== 事件接口实现 ==========

  on(eventType: HighlightEventType, listener: HighlightEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.add(listener);
    }
  }

  off(eventType: HighlightEventType, listener: HighlightEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(
    eventType: HighlightEventType,
    data: Omit<HighlightEventData, 'type' | 'timestamp'>,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners && listeners.size > 0) {
      const eventData: HighlightEventData = {
        type: eventType,
        timestamp: Date.now(),
        ...data,
      };

      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch {
          // 忽略监听器错误
        }
      });
    }
  }

  // ========== 高亮接口实现 ==========

  private injectBaseStyles(): void {
    const existingStyle = document.querySelector(
      '#css-painter-styles',
    ) as HTMLStyleElement;
    if (existingStyle) {
      this.styleElement = existingStyle;
      return;
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'css-painter-styles';
    this.styleElement.textContent = `
      ::highlight(default) {
        background-color: #ffeaa7 !important;
        color: inherit !important;
      }
    `;

    document.head.appendChild(this.styleElement);
  }

  registerTypeStyle(type: string, style: HighlightStyle): void {
    if (!this.styleElement || !isHighlightSupported) return;

    const supportedStyles: string[] = [];

    if (style.backgroundColor) {
      supportedStyles.push(`background-color: ${style.backgroundColor} !important`);
    }
    if (style.color) {
      supportedStyles.push(`color: ${style.color} !important`);
    }
    if (style.textDecoration) {
      supportedStyles.push(`text-decoration: ${style.textDecoration} !important`);
    }
    if (style.textDecorationStyle) {
      supportedStyles.push(`text-decoration-style: ${style.textDecorationStyle} !important`);
    }
    if (style.textDecorationColor) {
      supportedStyles.push(`text-decoration-color: ${style.textDecorationColor} !important`);
    }
    if (style.textDecorationThickness) {
      supportedStyles.push(`text-decoration-thickness: ${style.textDecorationThickness} !important`);
    }
    if (style.textUnderlineOffset) {
      supportedStyles.push(`text-underline-offset: ${style.textUnderlineOffset} !important`);
    }
    if (style.textShadow) {
      supportedStyles.push(`text-shadow: ${style.textShadow} !important`);
    }
    if (style.fontWeight) {
      supportedStyles.push(`font-weight: ${style.fontWeight} !important`);
    }
    if (style.opacity !== undefined) {
      supportedStyles.push(`opacity: ${style.opacity} !important`);
    }

    if (supportedStyles.length === 0) {
      supportedStyles.push('background-color: #ffeb3b !important');
    }

    const cssRule = `
      ::highlight(${type}) {
        ${supportedStyles.join(';\n        ')};
      }
    `;

    this.styleElement.textContent += '\n' + cssRule;
  }

  highlight(range: Range, _style?: HighlightStyle): string {
    return this.highlightWithType(range, 'default');
  }

  highlightWithType(
    range: Range,
    type: string = 'default',
    autoScroll: boolean = true,
  ): string {
    try {
      if (range.collapsed) {
        return '';
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        return '';
      }

      const highlightId = `highlight-${++this.highlightId}`;

      if (isHighlightSupported) {
        const highlight = new Highlight(range.cloneRange());
        this.activeHighlights.set(highlightId, highlight);
        this.highlightTypes.set(highlightId, type);

        let typeHighlight = this.typeHighlights.get(type);
        if (!typeHighlight) {
          typeHighlight = new Highlight();
          this.typeHighlights.set(type, typeHighlight);
          CSS.highlights.set(type, typeHighlight);
        }

        const clonedRange = range.cloneRange();
        typeHighlight.add(clonedRange);
        this.highlightRanges.set(highlightId, clonedRange);

        this.emit(EventType.ADDED, {
          highlightId,
          highlightType: type,
          range: clonedRange,
        });
      } else {
        return '';
      }

      if (autoScroll) {
        this.scrollToRange(range);
      }

      return highlightId;
    } catch {
      return '';
    }
  }

  scrollToRange(range: Range): void {
    try {
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.width = '1px';
      tempElement.style.height = '1px';
      tempElement.style.overflow = 'hidden';
      tempElement.style.opacity = '0';
      tempElement.style.pointerEvents = 'none';

      try {
        range.insertNode(tempElement);

        tempElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });

        setTimeout(() => {
          if (tempElement.parentNode) {
            tempElement.parentNode.removeChild(tempElement);
          }
        }, 100);
      } catch {
        const container = range.commonAncestorContainer;
        const elementToScroll =
          container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as Element);

        if (elementToScroll && typeof elementToScroll.scrollIntoView === 'function') {
          elementToScroll.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
        }
      }

      setTimeout(() => {
        const rect = range.getBoundingClientRect();
        const needsCentering =
          rect.top < SCROLL_MARGIN ||
          rect.bottom > window.innerHeight - SCROLL_MARGIN ||
          rect.left < SCROLL_MARGIN ||
          rect.right > window.innerWidth - SCROLL_MARGIN;

        if (needsCentering) {
          const rectCenterY = rect.top + rect.height / 2;
          const rectCenterX = rect.left + rect.width / 2;
          const viewportCenterY = window.innerHeight / 2;
          const viewportCenterX = window.innerWidth / 2;

          const targetY = window.scrollY + (rectCenterY - viewportCenterY);
          const targetX = window.scrollX + (rectCenterX - viewportCenterX);

          window.scrollTo({
            top: Math.max(0, targetY),
            left: Math.max(0, targetX),
            behavior: 'smooth',
          });
        }
      }, 300);
    } catch {
      // 忽略滚动错误
    }
  }

  clearHighlight(): void {
    if (isHighlightSupported) {
      CSS.highlights.clear();
      this.activeHighlights.clear();
      this.typeHighlights.clear();
      this.highlightTypes.clear();
      this.highlightRanges.clear();
      this.emit(EventType.CLEARED, {});
    }

    const root = document.documentElement;
    root.style.removeProperty('--highlight-bg');
  }

  clearHighlightByType(type: string): void {
    if (isHighlightSupported) {
      CSS.highlights.delete(type);
      this.typeHighlights.delete(type);
    }
  }

  clearHighlightById(highlightId: string): void {
    const highlight = this.activeHighlights.get(highlightId);
    const highlightType = this.highlightTypes.get(highlightId);

    if (!highlight || !highlightType) {
      return;
    }

    const removedRange = this.highlightRanges.get(highlightId);
    this.rebuildTypeHighlights(highlightType, [highlightId]);

    this.activeHighlights.delete(highlightId);
    this.highlightTypes.delete(highlightId);
    this.highlightRanges.delete(highlightId);

    this.emit(EventType.REMOVED, {
      highlightId,
      highlightType,
      range: removedRange,
    });
  }

  private rebuildTypeHighlights(type: string, excludeHighlightIds: string[] = []): void {
    if (!isHighlightSupported) return;

    const remainingRanges: Range[] = [];

    for (const [highlightId, highlight] of this.activeHighlights.entries()) {
      if (excludeHighlightIds.includes(highlightId)) continue;

      const highlightType = this.highlightTypes.get(highlightId);
      if (highlightType !== type) continue;

      for (const abstractRange of highlight) {
        if (abstractRange instanceof Range) {
          remainingRanges.push(abstractRange.cloneRange());
        }
      }
    }

    const existingTypeHighlight = this.typeHighlights.get(type);
    if (existingTypeHighlight) {
      existingTypeHighlight.clear();
    }

    if (remainingRanges.length > 0) {
      const newTypeHighlight = new Highlight(...remainingRanges);
      this.typeHighlights.set(type, newTypeHighlight);
      CSS.highlights.set(type, newTypeHighlight);
    } else {
      this.typeHighlights.delete(type);
      CSS.highlights.delete(type);
    }
  }

  getActiveHighlightCount(): number {
    return this.activeHighlights.size;
  }

  hasActiveHighlights(): boolean {
    return this.activeHighlights.size > 0;
  }

  setDefaultStyle(style: HighlightStyle): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
    this.emit(EventType.STYLE_CHANGED, {});
  }

  createHighlightStyle(style: HighlightStyle): string {
    const rules = Object.entries(style)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');

    return `::highlight(selection-highlight) { ${rules}; }`;
  }

  destroy(): void {
    this.clearHighlight();
    this.eventListeners.forEach(listeners => listeners.clear());
    this.eventListeners.clear();

    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }
}
