import { Highlighter, HighlightStyle } from '../types';
import { logSuccess, logWarn, logDebug } from '../debug/logger';
import { SCROLL_MARGIN } from '../constants';

// 检查浏览器是否支持CSS Highlights API
export const isHighlightSupported = typeof Highlight !== 'undefined' && typeof CSS?.highlights !== 'undefined';

/**
 * 基于CSS Highlights API的高亮器（支持多选区同时高亮）
 */
export class CSSBasedHighlighter implements Highlighter {
  private styleElement: HTMLStyleElement | null = null;
  private activeHighlights: Map<string, Highlight> = new Map();
  private typeHighlights: Map<string, Highlight> = new Map(); // 按类型分组的高亮
  private highlightTypes: Map<string, string> = new Map(); // 记录每个高亮ID对应的类型
  private highlightId: number = 0;
  private defaultStyle: HighlightStyle;

  constructor() {
    this.defaultStyle = {
      backgroundColor: '#ffeaa7',  // 明显的黄色背景，容易看清
      color: 'inherit',
      textDecoration: 'none',
      border: 'none',
      borderRadius: '0',
      padding: '0',
      boxShadow: 'none',
    };

    this.injectBaseStyles();

    if (!isHighlightSupported) {
      logWarn('highlighter', 'CSS Highlights API 不支持，将使用降级方案');
    } else {
      logSuccess('highlighter', 'CSS Highlights API 支持检测成功');
    }
  }

  /**
   * 注入基础CSS样式
   */
  private injectBaseStyles(): void {
    // 首先检查是否已经存在样式元素，如果存在则复用
    const existingStyle = document.querySelector('#css-highlighter-styles') as HTMLStyleElement;
    if (existingStyle) {
      this.styleElement = existingStyle;
      logDebug('highlighter', '复用已存在的CSS样式元素', {
        styleElementId: this.styleElement.id,
      });
      return;
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'css-highlighter-styles';
    this.styleElement.textContent = `
      /* CSS Highlights API 只支持少数属性：background-color、color、text-decoration等 */
      /* 注意：border、border-radius、padding等属性不被支持 */
      
      /* 默认高亮样式 - 只使用支持的属性 */
      ::highlight(default) {
        background-color: #ffeaa7 !important;
        color: inherit !important;
      }
    `;

    document.head.appendChild(this.styleElement);

    // 调试信息
    logDebug('highlighter', 'CSS样式元素已注入到<head>', {
      styleElementId: this.styleElement.id,
      styleContent: this.styleElement.textContent,
      isHighlightSupported: isHighlightSupported,
      hasCSS: typeof CSS !== 'undefined',
      hasHighlights: typeof CSS !== 'undefined' && 'highlights' in CSS,
    });
  }

  /**
   * 注册类型样式
   */
  registerTypeStyle(type: string, style: HighlightStyle): void {
    // 🔍 调试信息：方法被调用
    logDebug('highlighter', '🔧 registerTypeStyle 被调用:', {
      type: type,
      style: style,
      hasStyleElement: !!this.styleElement,
      isHighlightSupported: isHighlightSupported,
    });

    if (!this.styleElement || !isHighlightSupported) {
      logWarn('highlighter', '⚠️ registerTypeStyle 提前返回:', {
        hasStyleElement: !!this.styleElement,
        isHighlightSupported: isHighlightSupported,
      });
      return;
    }

    // 重要：CSS Highlights API只支持有限的样式属性
    // 支持：background-color, color, text-decoration-*, text-shadow, opacity
    // 不支持：border, border-radius, padding, box-shadow, outline等
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

    // 如果没有任何支持的样式，提供一个默认背景色
    if (supportedStyles.length === 0) {
      supportedStyles.push('background-color: #ffeb3b !important');
      logWarn('highlighter', `类型 ${type} 没有CSS Highlights API支持的样式，使用默认背景色`);
    }

    const cssRule = `
      ::highlight(${type}) {
        ${supportedStyles.join(';\n        ')};
      }
    `;

    // 🔍 调试信息：样式添加前的状态
    const beforeLength = this.styleElement.textContent?.length || 0;
    logDebug('highlighter', '🔧 样式添加前:', {
      beforeLength: beforeLength,
      cssRule: cssRule,
    });

    // 添加新的样式规则
    this.styleElement.textContent += '\n' + cssRule;

    // 🔍 调试信息：样式添加后的状态
    const afterLength = this.styleElement.textContent?.length || 0;
    logSuccess('highlighter', `✅ 注册类型样式: ${type}`, {
      originalStyle: style,
      supportedStylesCount: supportedStyles.length,
      beforeLength: beforeLength,
      afterLength: afterLength,
      lengthDiff: afterLength - beforeLength,
    });
  }

  /**
   * 高亮选区（向后兼容）
   */
  highlight(range: Range): string {
    return this.highlightWithType(range, 'default');
  }

  /**
   * 高亮选区（支持多选区同时高亮和多种类型）
   */
  highlightWithType(range: Range, type: string = 'default', autoScroll: boolean = true): string {
    try {
      // 🔍 调试信息：确认传入的类型
      logDebug('highlighter', '🎯 highlightWithType 被调用:', {
        type: type,
        rangeText: range.toString().substring(0, 30) + '...',
        typeIsDefault: type === 'default',
      });

      // 验证范围
      if (range.collapsed) {
        logWarn('highlighter', 'Range is collapsed, skipping highlight');
        return '';
      }

      // 验证Range是否指向有效的DOM位置
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        logWarn('highlighter', 'Range has zero dimensions, likely invalid DOM position', {
          startContainer: range.startContainer.nodeName,
          endContainer: range.endContainer.nodeName,
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          text: range.toString().substring(0, 50) + '...',
        });
        return '';
      }

      // 生成唯一ID用于内部管理
      const highlightId = `highlight-${++this.highlightId}`;

      if (isHighlightSupported) {
        // 使用CSS Highlights API
        const highlight = new Highlight(range.cloneRange());
        this.activeHighlights.set(highlightId, highlight);
        this.highlightTypes.set(highlightId, type); // 记录类型映射

        // 根据类型获取或创建高亮组
        let typeHighlight = this.typeHighlights.get(type);
        if (!typeHighlight) {
          typeHighlight = new Highlight();
          this.typeHighlights.set(type, typeHighlight);
          CSS.highlights.set(type, typeHighlight);

          // 🔍 调试信息：新创建的高亮组
          logDebug('highlighter', '🆕 创建新的高亮组:', {
            type: type,
            totalTypeHighlights: this.typeHighlights.size,
            cssHighlightsSize: CSS.highlights.size,
          });
        } else {
          // 🔍 调试信息：使用现有的高亮组
          logDebug('highlighter', '🔄 使用现有高亮组:', {
            type: type,
            existingRangeCount: typeHighlight.size,
          });
        }

        // 将当前Range添加到对应类型的高亮中
        typeHighlight.add(range.cloneRange());

        // 🔍 调试信息：确认添加到CSS.highlights
        logSuccess('highlighter', '✅ 高亮已添加到CSS.highlights:', {
          type: type,
          highlightId: highlightId,
          cssHighlightsKeys: Array.from(CSS.highlights.keys()),
          currentTypeRangeCount: typeHighlight.size,
        });

        // 调试日志
        logSuccess('highlighter', 'CSS Highlights API 高亮已添加', {
          highlightId,
          type: type,
          text: range.toString(),
          totalHighlights: this.activeHighlights.size,
          registrySize: CSS.highlights.size,
          rangeDetails: {
            startContainer: range.startContainer.nodeName,
            endContainer: range.endContainer.nodeName,
            startOffset: range.startOffset,
            endOffset: range.endOffset,
          },
        });
      } else {
        // 如果不支持CSS Highlights API，记录警告并返回空ID
        logWarn('highlighter', 'CSS Highlights API不支持，无法高亮', {
          text: range.toString().substring(0, 50) + '...',
        });
        return '';
      }

      // 根据autoScroll参数决定是否滚动到选区位置
      if (autoScroll) {
        this.scrollToRange(range);
      }

      return highlightId;

    } catch (error) {
      logWarn('highlighter', 'Highlight failed', { error: (error as Error).message });
      return '';
    }
  }

  /**
   * 更新CSS样式（用于动态样式变更）
   */
  private updateHighlightStyles(style: HighlightStyle): void {
    if (!this.styleElement || !isHighlightSupported) return;

    const cssRule = `
      ::highlight(selection-highlight) {
        background-color: ${style.backgroundColor || '#fff8e1'};
        border: ${style.border || 'none'};
        border-radius: ${style.borderRadius || '2px'};
        padding: ${style.padding || '1px 0'};
        box-shadow: ${style.boxShadow || 'none'};
        opacity: ${style.opacity || 1};
        transition: ${style.transition || 'all 0.2s ease'};
      }
    `;

    // 更新样式
    const existingRule = this.styleElement.textContent || '';
    this.styleElement.textContent = existingRule.replace(
      /::highlight\(selection-highlight\)[^}]+}/,
      cssRule,
    );
  }

  /**
   * 滚动到指定范围位置
   */
  scrollToRange(range: Range): void {
    try {
      // 首先尝试将选区滚动到视图中
      this.scrollIntoView(range);

      // 然后进行精确的中心定位
      setTimeout(() => {
        const rect = range.getBoundingClientRect();

        logSuccess('highlighter', '🚀 选区位置信息', {
          rect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height,
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
          },
        });

        // 检查是否需要进一步调整位置
        const needsCentering = (
          rect.top < SCROLL_MARGIN ||
          rect.bottom > window.innerHeight - SCROLL_MARGIN ||
          rect.left < SCROLL_MARGIN ||
          rect.right > window.innerWidth - SCROLL_MARGIN
        );

        if (needsCentering) {
          // 计算将选区放在视口中心的位置
          const rectCenterY = rect.top + (rect.height / 2);
          const rectCenterX = rect.left + (rect.width / 2);
          const viewportCenterY = window.innerHeight / 2;
          const viewportCenterX = window.innerWidth / 2;

          const targetY = window.scrollY + (rectCenterY - viewportCenterY);
          const targetX = window.scrollX + (rectCenterX - viewportCenterX);

          logSuccess('highlighter', '🎯 精确滚动到中心位置', {
            currentScrollY: window.scrollY,
            currentScrollX: window.scrollX,
            rectCenterY,
            rectCenterX,
            targetY: Math.max(0, targetY),
            targetX: Math.max(0, targetX),
          });

          window.scrollTo({
            top: Math.max(0, targetY),
            left: Math.max(0, targetX),
            behavior: 'smooth',
          });

          logSuccess('highlighter', '✅ 精确滚动命令已发送');
        } else {
          logSuccess('highlighter', '✅ 选区已在合适位置，无需精确滚动');
        }
      }, 300);

    } catch (error) {
      logWarn('highlighter', '滚动到选区位置失败', { error: (error as Error).message });
    }
  }

  /**
   * 使用原生scrollIntoView方法滚动到选区
   */
  private scrollIntoView(range: Range): void {
    try {
      // 创建临时元素作为滚动目标
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.width = '1px';
      tempElement.style.height = '1px';
      tempElement.style.overflow = 'hidden';
      tempElement.style.opacity = '0';
      tempElement.style.pointerEvents = 'none';

      // 将临时元素插入到Range的起始位置
      try {
        range.insertNode(tempElement);

        logSuccess('highlighter', '🎯 使用scrollIntoView滚动到选区');

        // 滚动到临时元素
        tempElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
        });

        // 清理临时元素
        setTimeout(() => {
          if (tempElement.parentNode) {
            tempElement.parentNode.removeChild(tempElement);
          }
        }, 100);

      } catch (insertError) {
        // 如果插入失败，尝试其他方法
        logWarn('highlighter', '无法插入临时元素，尝试选择容器滚动', { error: (insertError as Error).message });

        // 获取Range的公共祖先容器
        const container = range.commonAncestorContainer;
        const elementToScroll = container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : container as Element;

        if (elementToScroll && typeof elementToScroll.scrollIntoView === 'function') {
          elementToScroll.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
          logSuccess('highlighter', '✅ 已滚动到容器元素');
        }
      }
    } catch (error) {
      logWarn('highlighter', 'scrollIntoView失败', { error: (error as Error).message });
    }
  }

  /**
   * 清除所有高亮
   */
  clearHighlight(): void {
    if (isHighlightSupported) {
      // 清除所有类型的高亮
      CSS.highlights.clear();
      this.activeHighlights.clear();
      this.typeHighlights.clear();
      this.highlightTypes.clear();

      logSuccess('highlighter', '所有CSS高亮已清除');
    } else {
      // 如果不支持CSS Highlights API，记录警告但不做任何操作
      logWarn('highlighter', 'CSS Highlights API不支持，无法高亮');
    }

    // 清除CSS变量
    const root = document.documentElement;
    root.style.removeProperty('--highlight-bg');
  }

  /**
   * 清除指定类型的高亮
   */
  clearHighlightByType(type: string): void {
    if (isHighlightSupported) {
      CSS.highlights.delete(type);
      this.typeHighlights.delete(type);
      logSuccess('highlighter', `清除类型 ${type} 的高亮`);
    }
  }

  /**
   * 清除指定ID的高亮
   * 注意：由于CSS Highlights API的限制，我们无法直接从Highlight中移除特定Range
   * 解决方案：我们需要重建所有相同类型的高亮，但排除要删除的那个
   */
  clearHighlightById(highlightId: string): void {
    const highlight = this.activeHighlights.get(highlightId);
    const highlightType = this.highlightTypes.get(highlightId);

    if (!highlight || !highlightType) {
      logWarn('highlighter', `未找到高亮 ID: ${highlightId}`, {
        hasHighlight: !!highlight,
        hasType: !!highlightType,
      });
      return;
    }

    logSuccess('highlighter', `准备清除高亮 ID: ${highlightId}`, {
      type: highlightType,
      beforeRemoval: {
        totalHighlights: this.activeHighlights.size,
        typeHighlights: this.typeHighlights.get(highlightType)?.size || 0,
      },
    });

    // 先重建该类型的高亮，排除当前要删除的高亮
    this.rebuildTypeHighlights(highlightType, [highlightId]);

    // 然后从内部状态中移除
    this.activeHighlights.delete(highlightId);
    this.highlightTypes.delete(highlightId);

    logSuccess('highlighter', `已清除高亮 ID: ${highlightId}`, {
      afterRemoval: {
        totalHighlights: this.activeHighlights.size,
        typeHighlights: this.typeHighlights.get(highlightType)?.size || 0,
      },
    });
  }

  /**
   * 设置高亮移除回调
   */
  onHighlightRemoved?: (highlightId: string, type: string) => void;

  /**
   * 重建指定类型的高亮，排除指定的高亮ID
   * 这是解决CSS Highlights API无法移除单个Range限制的方案
   */
  rebuildTypeHighlights(type: string, excludeHighlightIds: string[] = []): void {
    if (!isHighlightSupported) return;

    logDebug('highlighter', `🔧 开始重建类型 ${type} 的高亮`, {
      excludeHighlightIds,
      totalActiveHighlights: this.activeHighlights.size,
      currentTypeHighlights: this.typeHighlights.get(type)?.size || 0,
    });

    // 收集该类型中所有需要保留的Range
    const remainingRanges: Range[] = [];
    const excludedCount = { total: 0, byType: 0, byExclusion: 0 };

    for (const [highlightId, highlight] of this.activeHighlights.entries()) {
      excludedCount.total++;

      // 跳过要排除的高亮ID
      if (excludeHighlightIds.includes(highlightId)) {
        excludedCount.byExclusion++;
        logDebug('highlighter', `⏭️ 跳过被排除的高亮ID: ${highlightId}`);
        continue;
      }

      // 检查这个高亮是否属于目标类型
      const highlightType = this.highlightTypes.get(highlightId);
      if (highlightType !== type) {
        excludedCount.byType++;
        logDebug('highlighter', `⏭️ 跳过不同类型的高亮: ${highlightId} (类型: ${highlightType})`);
        continue;
      }

      logDebug('highlighter', `✅ 保留高亮: ${highlightId} (类型: ${highlightType})`);

      // 收集该类型的Range
      for (const abstractRange of highlight) {
        if (abstractRange instanceof Range) {
          remainingRanges.push(abstractRange.cloneRange());
        }
      }
    }

    // 清除该类型的现有高亮
    const existingTypeHighlight = this.typeHighlights.get(type);
    if (existingTypeHighlight) {
      existingTypeHighlight.clear();
    }

    // 重建该类型的高亮
    if (remainingRanges.length > 0) {
      const newTypeHighlight = new Highlight(...remainingRanges);
      this.typeHighlights.set(type, newTypeHighlight);
      CSS.highlights.set(type, newTypeHighlight);

      logSuccess('highlighter', `重建类型 ${type} 的高亮`, {
        remainingRanges: remainingRanges.length,
        excludedIds: excludeHighlightIds,
      });
    } else {
      // 如果没有剩余的Range，完全移除该类型
      this.typeHighlights.delete(type);
      CSS.highlights.delete(type);

      logSuccess('highlighter', `类型 ${type} 的所有高亮已清除`);
    }
  }

  /**
   * 获取当前高亮数量
   */
  getActiveHighlightCount(): number {
    return this.activeHighlights.size;
  }

  /**
   * 检查是否有活跃高亮
   */
  hasActiveHighlights(): boolean {
    return this.activeHighlights.size > 0;
  }

  /**
   * 设置默认样式
   */
  setDefaultStyle(style: HighlightStyle): void {
    this.defaultStyle = { ...this.defaultStyle, ...style };
    this.updateHighlightStyles(this.defaultStyle);
    logDebug('highlighter', '默认高亮样式已更新', style);
  }

  /**
   * 创建高亮样式字符串
   */
  createHighlightStyle(style: HighlightStyle): string {
    const rules = Object.entries(style)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');

    return `::highlight(selection-highlight) { ${rules}; }`;
  }

  /**
   * 销毁高亮器
   */
  destroy(): void {
    this.clearHighlight();

    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }

    logDebug('highlighter', 'CSS高亮器已销毁');
  }

  /**
   * 创建测试高亮来验证CSS Highlights API功能
   * 注意：此方法已被移除以避免页面刷新时的自动选区问题
   * 如需测试，可以调用 testHighlightAPI() 方法
   */

  /**
   * 测试CSS Highlights API功能
   */
  testHighlightAPI(): boolean {
    try {
      if (!isHighlightSupported) {
        logWarn('highlighter', 'CSS Highlights API 不支持');
        return false;
      }

      // 创建一个测试范围
      const testElement = document.body;
      const range = new Range();
      const textNode = testElement.childNodes[0];

      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        logWarn('highlighter', '没有找到可测试的文本节点');
        return false;
      }

      range.setStart(textNode, 0);
      range.setEnd(textNode, Math.min(1, textNode.textContent?.length || 0));

      // 创建测试高亮
      const testHighlight = new Highlight(range);
      CSS.highlights.set('test-highlight', testHighlight);

      logSuccess('highlighter', 'CSS Highlights API 测试成功', {
        registrySize: CSS.highlights.size,
        testRange: range.toString(),
      });

      // 清理测试高亮
      CSS.highlights.delete('test-highlight');
      return true;
    } catch (error) {
      logWarn('highlighter', 'CSS Highlights API 测试失败', { error: (error as Error).message });
      return false;
    }
  }
}
