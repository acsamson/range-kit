/**
 * 文本高亮管理器
 * 处理文本搜索和高亮功能
 */

import { SelectionText, SelectionHighlighter } from '../wrappers';
import { SelectionSession } from '../../session';
import { logSuccess, logDebug } from '../../common/debug';
import { setupHighlightInteractionHandlers, HighlightedRange, HighlightInteractionEvent } from './highlight-event-handler';
import { detectRangeOverlap, OverlapType } from '../../common/overlap-detector';

/**
 * 搜索匹配项信息
 * 包含每个匹配项的详细信息，用于过滤函数
 */
export interface SearchMatchItem {
  /** 匹配项索引（从0开始） */
  index: number;
  /** 匹配的Range对象 */
  range: Range;
  /** 匹配的文本 */
  text: string;
  /** 是否与已有选区重叠 */
  hasOverlap: boolean;
  /** 重叠的选区ID列表 */
  overlappedSelectionIds: string[];
  /** 重叠详情 */
  overlaps: Array<{
    selectionId: string;
    text: string;
    overlapType: OverlapType;
  }>;
}

/**
 * 搜索匹配项过滤函数
 * @param items - 所有匹配项
 * @param keyword - 搜索关键词
 * @returns 过滤后要高亮的匹配项
 */
export type SearchMatchFilter = (items: SearchMatchItem[], keyword: string) => SearchMatchItem[];

export interface TextHighlightOptions {
  onInteraction?: (event: HighlightInteractionEvent, instance: unknown) => void;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  maxMatches?: number;
  /** 自定义过滤函数，可用于过滤掉重叠选区等 */
  filterMatches?: SearchMatchFilter;
}

export interface TextHighlightResult {
  success: number;
  total: number;
  highlightIds: string[];
  errors: string[];
}

export interface TextHighlightDependencies {
  textSearcher: SelectionText;
  highlighter: SelectionHighlighter;
  selectionManager: SelectionSession;
}

/**
 * 文本高亮管理器
 */
export class TextHighlightManager {
  private eventCleanupFns: Map<string, () => void> = new Map();
  /** 关键词到高亮 ID 的映射，用于按关键词精确清除 */
  private keywordToHighlightIds: Map<string, Set<string>> = new Map();
  /** 所有搜索高亮的 ID 集合（用于快速查找） */
  private allSearchHighlightIds: Set<string> = new Set();

  constructor(private deps: TextHighlightDependencies) {}

  /**
   * 检测并移除完全重复的Range
   * 只移除完全相同的Range（相同的容器和偏移量），保留所有其他Range包括重叠的
   */
  private removeDuplicateRanges(ranges: Range[]): Range[] {
    const uniqueRanges: Range[] = [];
    const rangeSignatures = new Set<string>();

    for (const range of ranges) {
      // 创建Range的唯一签名，基于容器路径和偏移量
      // 使用更精确的签名来避免误判
      const startPath = this.getNodePath(range.startContainer);
      const endPath = this.getNodePath(range.endContainer);
      const signature = `${startPath}:${range.startOffset}-${endPath}:${range.endOffset}`;

      if (!rangeSignatures.has(signature)) {
        rangeSignatures.add(signature);
        uniqueRanges.push(range);
      }
    }

    logDebug('text-highlight', `[去重] 处理前: ${ranges.length} 个Range, 处理后: ${uniqueRanges.length} 个Range`);
    return uniqueRanges;
  }

  /**
   * 获取节点的唯一路径
   */
  private getNodePath(node: Node): string {
    const path: number[] = [];
    let current: Node | null = node;

    while (current && current.parentNode) {
      const parent: Node = current.parentNode;
      const index = Array.from(parent.childNodes).indexOf(current as ChildNode);
      path.unshift(index);
      current = parent;
    }

    return path.join('-');
  }

  /**
   * 检测 Range 与已有选区的重叠情况
   * @param range - 要检测的 Range
   * @returns 重叠信息
   */
  private detectOverlapsForRange(range: Range): {
    hasOverlap: boolean;
    overlappedSelectionIds: string[];
    overlaps: Array<{ selectionId: string; text: string; overlapType: OverlapType }>;
  } {
    const overlaps: Array<{ selectionId: string; text: string; overlapType: OverlapType }> = [];
    const overlappedSelectionIds: string[] = [];

    // 获取所有已有选区的活跃 Range
    const activeRanges = this.deps.selectionManager.getAllActiveRanges();

    for (const [selectionId, existingRange] of activeRanges) {
      // 跳过搜索高亮自身的 Range
      if (this.allSearchHighlightIds.has(selectionId)) {
        continue;
      }

      try {
        const overlapResult = detectRangeOverlap(range, existingRange);
        if (overlapResult.hasOverlap) {
          overlappedSelectionIds.push(selectionId);
          overlaps.push({
            selectionId,
            text: existingRange.toString(),
            overlapType: overlapResult.overlapType,
          });
        }
      } catch {
        // 忽略比较错误
      }
    }

    return {
      hasOverlap: overlappedSelectionIds.length > 0,
      overlappedSelectionIds,
      overlaps,
    };
  }

  /**
   * 执行高亮逻辑（抽取的核心高亮功能）
   */
  private async performHighlight(
    text: string | string[],
    type: string,
    containers: string[],
    options: TextHighlightOptions,
    instance: unknown,
  ): Promise<TextHighlightResult> {
    // 保存原始文本数组，用于重叠检测
    const textArray = Array.isArray(text) ? text : [text];
    const keyword = textArray[0] || '';

    // 只传递文本搜索相关的选项
    const searchOptions = {
      caseSensitive: options.caseSensitive ?? false,
      wholeWord: options.wholeWord ?? false,
      maxMatches: options.maxMatches ?? Infinity,  // 默认无限制
    };
    const searchResult = this.deps.textSearcher.searchTextInContainers(text, containers, searchOptions);

    // 不再合并重叠的Range，保留所有匹配的文本
    // 只移除完全相同的Range（相同的起始和结束位置）
    let rangesToHighlight = this.removeDuplicateRanges(searchResult.ranges);

    // 如果提供了过滤函数，先构建匹配项信息并调用过滤函数
    if (options.filterMatches && rangesToHighlight.length > 0) {
      // 构建匹配项信息
      const matchItems: SearchMatchItem[] = rangesToHighlight.map((range, index) => {
        const overlapInfo = this.detectOverlapsForRange(range);
        return {
          index,
          range,
          text: range.toString(),
          hasOverlap: overlapInfo.hasOverlap,
          overlappedSelectionIds: overlapInfo.overlappedSelectionIds,
          overlaps: overlapInfo.overlaps,
        };
      });

      // 调用过滤函数
      const filteredItems = options.filterMatches(matchItems, keyword);

      // 更新要高亮的 Range 列表
      rangesToHighlight = filteredItems.map(item => item.range);

      logDebug('text-highlight',
        `[过滤匹配项] 过滤前: ${matchItems.length} 个, 过滤后: ${filteredItems.length} 个`);
    }

    const result: TextHighlightResult = {
      success: 0,
      total: rangesToHighlight.length, // 使用处理后的Range数量
      highlightIds: [],
      errors: searchResult.errors,
    };

    try {
      // 注册类型样式
      const typeConfig = this.deps.selectionManager.getRegisteredType(type);
      if (typeConfig?.style) {
        this.deps.highlighter.registerTypeStyle(type, typeConfig.style);
      }

      // 收集高亮的Range信息
      const highlightedRanges: HighlightedRange[] = [];

      // 批量高亮找到的Range
      for (const range of rangesToHighlight) {
        try {
          const highlightId = this.deps.highlighter.highlightWithType(range, type, false);
          if (highlightId) {
            result.highlightIds.push(highlightId);
            result.success++;

            // 将搜索高亮的 Range 注册到 activeRanges，使其能被导航功能统计
            this.deps.selectionManager.registerActiveRange(highlightId, range);

            // 记录高亮 ID 到所有搜索高亮集合
            this.allSearchHighlightIds.add(highlightId);

            // 记录每个关键词对应的高亮 ID（用于按关键词清除）
            const rangeText = range.toString();
            for (const kw of textArray) {
              // 检查这个 range 是否匹配这个关键词
              if (rangeText.toLowerCase().includes(kw.toLowerCase()) ||
                  kw.toLowerCase().includes(rangeText.toLowerCase())) {
                if (!this.keywordToHighlightIds.has(kw)) {
                  this.keywordToHighlightIds.set(kw, new Set());
                }
                this.keywordToHighlightIds.get(kw)!.add(highlightId);
              }
            }

            highlightedRanges.push({
              highlightId,
              range: range.cloneRange(),
              text: range.toString(),
            });
          }
        } catch (error) {
          const errorMsg = `高亮Range失败: ${error}`;
          result.errors.push(errorMsg);
        }
      }

      // 设置交互事件处理
      if (options.onInteraction && highlightedRanges.length > 0) {
        // 获取 registeredTypes 用于鼠标样式
        const allTypes = this.deps.selectionManager.getAllRegisteredTypes();
        const registeredTypesMap = new Map(allTypes.map(t => [t.type, t]));

        const cleanupFn = setupHighlightInteractionHandlers(
          containers,
          highlightedRanges,
          type,
          options.onInteraction,
          instance,
          () => this.deps.highlighter.clearHighlight(),
          textArray, // 传递原始文本数组用于重叠检测
          registeredTypesMap, // 传递类型配置，避免全局变量
        );

        const cleanupKey = `${type}-${Date.now()}`;
        this.eventCleanupFns.set(cleanupKey, cleanupFn);
      }

      logSuccess('text-highlight', `文本高亮完成: ${result.success}/${result.total} 个匹配项成功高亮`);
    } catch (error) {
      const errorMsg = `文本高亮过程中发生错误: ${error}`;
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * 根据文本高亮指定容器中的所有匹配文本
   */
  async highlightTextInContainers(
    text: string | string[],
    type: string,
    containers: string[],
    options: TextHighlightOptions = {},
    instance: unknown,
  ): Promise<TextHighlightResult> {
    // 执行高亮
    const result = await this.performHighlight(text, type, containers, options, instance);
    return result;
  }

  /**
   * 清除文本高亮
   * 支持按关键词精确清除，只清除搜索高亮，不影响预设选区的高亮
   * @param text 要清除的关键词，不传则清除所有搜索高亮
   * @param containers 容器选择器（暂未使用，保留接口兼容）
   */
  clearTextHighlights(text?: string, containers?: string[]): void {
    // 获取底层高亮器实例，用于按 ID 清除
    const cssHighlighter = this.deps.highlighter.getHighlighter();

    if (text) {
      // 按关键词精确清除
      const highlightIds = this.keywordToHighlightIds.get(text);
      if (highlightIds) {
        for (const highlightId of highlightIds) {
          // 从 CSS 高亮中移除
          cssHighlighter.clearHighlightById(highlightId);
          // 从 activeRanges 中移除
          this.deps.selectionManager.unregisterActiveRange(highlightId);
          // 从所有搜索高亮集合中移除
          this.allSearchHighlightIds.delete(highlightId);
        }
        // 移除该关键词的映射
        this.keywordToHighlightIds.delete(text);
      }
    } else {
      // 清除所有搜索高亮
      // 清除所有事件监听器
      this.eventCleanupFns.forEach(cleanupFn => cleanupFn());
      this.eventCleanupFns.clear();

      // 清除所有搜索高亮的 ID
      for (const highlightId of this.allSearchHighlightIds) {
        // 从 CSS 高亮中移除
        cssHighlighter.clearHighlightById(highlightId);
        // 从 activeRanges 中移除
        this.deps.selectionManager.unregisterActiveRange(highlightId);
      }
      this.allSearchHighlightIds.clear();
      this.keywordToHighlightIds.clear();
    }
  }

  /**
   * 销毁管理器，清理所有资源
   */
  destroy(): void {
    this.clearTextHighlights();
  }
}
