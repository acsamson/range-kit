/**
 * 文本高亮管理器
 * 处理文本搜索和高亮功能
 */

import { SelectionText } from '../core/selection-text';
import { SelectionHighlighter } from '../core/selection-highlighter';
import { SelectionInstanceManager } from '../manager/selection-instance-manager';
import { logSuccess, logDebug } from '../debug/logger';
import { setupHighlightInteractionHandlers, HighlightedRange, HighlightInteractionEvent } from './highlight-event-handler';
import { detectRangeOverlap, OverlapType } from './overlap-detector';

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
  selectionManager: SelectionInstanceManager;
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

  // /**
  //  * 检测并分组重叠的Range
  //  * 返回每个Range及其关联的所有文本（用于重叠检测）
  //  */
  // private groupOverlappingRanges(ranges: Range[], textArray: string[]): Map<Range, string[]> {
  //   const rangeToTexts = new Map<Range, string[]>();

  //   // 为每个Range初始化其对应的文本
  //   ranges.forEach((range) => {
  //     const rangeText = range.toString();
  //     const associatedTexts: string[] = [];

  //     // 找出所有与这个Range匹配的文本
  //     textArray.forEach(text => {
  //       if (rangeText.includes(text) || text.includes(rangeText)) {
  //         associatedTexts.push(text);
  //       }
  //     });

  //     rangeToTexts.set(range, associatedTexts);
  //   });

  //   logDebug('text-highlight', `[分组] 处理了 ${ranges.length} 个Range，识别了重叠关系`);
  //   return rangeToTexts;
  // }

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
   * 合并重叠的Range，只保留最长的
   * 只有当Range真正重叠（有交集）时才合并，保留覆盖范围最大的那个
   */
  private mergeOverlappingRanges(ranges: Range[]): Range[] {
    if (ranges.length === 0) return [];

    // 收集所有Range的文本和位置信息
    interface RangeInfo {
      range: Range;
      text: string;
      startOffset: number;
      endOffset: number;
      container: Node;
    }

    const rangeInfos: RangeInfo[] = [];

    for (const range of ranges) {
      // 只处理同一文本节点内的Range
      if (range.startContainer === range.endContainer &&
          range.startContainer.nodeType === Node.TEXT_NODE) {
        rangeInfos.push({
          range: range.cloneRange(),
          text: range.toString(),
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          container: range.startContainer,
        });
      } else {
        // 跨节点的Range直接保留
        rangeInfos.push({
          range: range.cloneRange(),
          text: range.toString(),
          startOffset: -1,
          endOffset: -1,
          container: range.startContainer,
        });
      }
    }

    // 按容器分组
    const grouped = new Map<Node, RangeInfo[]>();
    for (const info of rangeInfos) {
      if (info.startOffset === -1) {
        // 跨节点的直接添加到结果
        continue;
      }
      if (!grouped.has(info.container)) {
        grouped.set(info.container, []);
      }
      grouped.get(info.container)!.push(info);
    }

    const mergedRanges: Range[] = [];

    // 处理跨节点的Range（直接添加）
    for (const info of rangeInfos) {
      if (info.startOffset === -1) {
        mergedRanges.push(info.range);
      }
    }

    // 对每个容器的Range进行处理
    for (const [, infos] of grouped) {
      if (infos.length === 1) {
        mergedRanges.push(infos[0].range);
        continue;
      }

      // 按起始位置排序
      infos.sort((a, b) => {
        if (a.startOffset !== b.startOffset) {
          return a.startOffset - b.startOffset;
        }
        // 如果起始位置相同，长的排前面
        return (b.endOffset - b.startOffset) - (a.endOffset - a.startOffset);
      });

      // 只合并真正有重叠（交集）的Range
      const kept: RangeInfo[] = [];

      for (const info of infos) {
        let shouldKeep = true;

        // 检查是否与已保留的Range有真正的重叠
        for (let i = 0; i < kept.length; i++) {
          const existing = kept[i];

          // 检查两个Range是否真正重叠（有交集）
          const hasOverlap = (
            // existing包含info的起始点
            (existing.startOffset <= info.startOffset && info.startOffset < existing.endOffset) ||
            // existing包含info的结束点
            (existing.startOffset < info.endOffset && info.endOffset <= existing.endOffset) ||
            // info包含existing的起始点
            (info.startOffset <= existing.startOffset && existing.startOffset < info.endOffset) ||
            // info包含existing的结束点
            (info.startOffset < existing.endOffset && existing.endOffset <= info.endOffset)
          );

          if (hasOverlap) {
            // 只有真正重叠时才需要处理
            
            // 如果当前Range完全包含已存在的Range，替换它
            if (info.startOffset <= existing.startOffset &&
                info.endOffset >= existing.endOffset) {
              kept[i] = info;
              shouldKeep = false;
              break;
            }

            // 如果当前Range被已存在的Range完全包含，跳过
            if (existing.startOffset <= info.startOffset &&
                existing.endOffset >= info.endOffset) {
              shouldKeep = false;
              break;
            }

            // 如果有部分重叠但不是完全包含关系
            // 这种情况比较复杂，可以根据需求决定是合并还是都保留
            // 这里选择都保留，让用户能看到所有匹配
          }
          
          // 如果完全相同的Range，去重
          if (info.startOffset === existing.startOffset && 
              info.endOffset === existing.endOffset) {
            shouldKeep = false;
            break;
          }
        }

        if (shouldKeep) {
          kept.push(info);
        }
      }

      // 添加保留的Range
      for (const info of kept) {
        mergedRanges.push(info.range);
      }
    }

    logDebug('text-highlight',
      `[合并重叠] 处理前: ${ranges.length} 个Range, 处理后: ${mergedRanges.length} 个Range`);

    return mergedRanges;
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
        const cleanupFn = setupHighlightInteractionHandlers(
          containers,
          highlightedRanges,
          type,
          options.onInteraction,
          instance,
          () => this.deps.highlighter.clearHighlight(),
          textArray, // 传递原始文本数组用于重叠检测
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
