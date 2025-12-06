/**
 * 文本搜索和高亮器
 * 负责在指定容器中搜索和高亮文本
 */

import { logInfo, logWarn, logError, logSuccess } from '../../common/debug';

export interface TextSearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  maxMatches?: number;
  onInteraction?: (event: MouseEvent, instance: unknown) => void;
}

/**
 * 文本搜索和高亮器 - 负责在指定容器中搜索和高亮文本
 */
export class SelectionText {
  /**
   * 检查节点是否在豁免容器内（带有 data-range-exclude 属性）
   */
  private isInExcludedContainer(node: Node): boolean {
    let current: Node | null = node;
    while (current && current !== document.body) {
      if (current instanceof Element && current.hasAttribute('data-range-exclude')) {
        return true;
      }
      current = current.parentNode;
    }
    return false;
  }

  /**
   * 在指定元素中查找文本的所有Range
   */
  findTextRangesInElement(
    element: Element,
    searchText: string,
    options: { caseSensitive: boolean; wholeWord: boolean; maxMatches: number },
  ): Range[] {
    const ranges: Range[] = [];
    const { caseSensitive, wholeWord, maxMatches } = options;

    try {
      // 获取元素的所有文本节点
      const textNodes: Text[] = [];
      const self = this;
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          // 过滤掉在豁免容器内的文本节点
          acceptNode(node: Node): number {
            if (self.isInExcludedContainer(node)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        },
      );

      let node = walker.nextNode();
      while (node) {
        textNodes.push(node as Text);
        node = walker.nextNode();
      }

      // 在每个文本节点中搜索
      for (const textNode of textNodes) {
        if (ranges.length >= maxMatches) break;

        const nodeText = textNode.textContent || '';
        const searchPattern = caseSensitive ? searchText : searchText.toLowerCase();
        const targetText = caseSensitive ? nodeText : nodeText.toLowerCase();

        let startIndex = 0;
        while (startIndex < targetText.length && ranges.length < maxMatches) {
          const foundIndex = targetText.indexOf(searchPattern, startIndex);

          if (foundIndex === -1) break;

          // 检查是否为完整单词匹配
          if (wholeWord) {
            const beforeChar = foundIndex > 0 ? targetText[foundIndex - 1] : '';
            const afterChar = foundIndex + searchPattern.length < targetText.length
              ? targetText[foundIndex + searchPattern.length] : '';

            if (/\w/.test(beforeChar) || /\w/.test(afterChar)) {
              startIndex = foundIndex + 1;
              continue;
            }
          }

          // 创建Range
          const range = document.createRange();
          range.setStart(textNode, foundIndex);
          range.setEnd(textNode, foundIndex + searchText.length);

          ranges.push(range);
          // 重要修改：从下一个字符开始搜索，而不是跳过整个匹配
          // 这样可以找到重叠的匹配（如 "ABC123" 在 "ABC123456" 中）
          startIndex = foundIndex + 1;
        }
      }
    } catch (error) {
      logError('text-search', '在元素中查找文本失败', error);
    }

    return ranges;
  }

  /**
   * 在多个容器中搜索文本
   */
  searchTextInContainers(
    text: string | string[],
    containers: string[],
    options: TextSearchOptions = {},
  ): { ranges: Range[]; total: number; errors: string[] } {
    const result = {
      ranges: [] as Range[],
      total: 0,
      errors: [] as string[],
    };

    try {
      let textArray = Array.isArray(text) ? text : [text];

      // 按文本长度降序排序，确保长文本先被搜索和高亮
      // 这样可以避免短文本先占用了长文本的位置
      textArray = textArray.sort((a, b) => b.length - a.length);

      const { caseSensitive = false, wholeWord = false, maxMatches = Infinity } = options;  // 默认无限制

      if (!textArray || textArray.length === 0 || textArray.every(t => !t || !t.trim())) {
        result.errors.push('搜索文本不能为空');
        return result;
      }

      if (!containers || containers.length === 0) {
        result.errors.push('容器选择器数组不能为空');
        return result;
      }

      logInfo('text-search', `开始在指定容器中搜索文本: ${JSON.stringify(textArray)}`, {
        containers,
        options,
      });

      // 遍历每个文本（已按长度降序排序）
      for (const searchText of textArray) {
        if (!searchText || !searchText.trim()) continue;

        // 遍历每个容器
        for (const containerSelector of containers) {
          try {
            const containerElements = document.querySelectorAll(containerSelector);

            if (containerElements.length === 0) {
              logWarn('text-search', `未找到容器: ${containerSelector}`);
              continue;
            }

            // 在每个容器中查找文本
            for (const container of containerElements) {
              const foundRanges = this.findTextRangesInElement(
                container as Element,
                searchText,
                { caseSensitive, wholeWord, maxMatches: maxMatches - result.ranges.length },
              );

              result.ranges.push(...foundRanges);
              result.total += foundRanges.length;

              // 达到最大匹配数时停止
              if (result.ranges.length >= maxMatches) {
                logInfo('text-search', `已达到最大匹配数 ${maxMatches}，停止搜索`);
                break;
              }
            }

            if (result.ranges.length >= maxMatches) break;
          } catch (error) {
            const errorMsg = `在容器 ${containerSelector} 中搜索文本 "${searchText}" 失败: ${error}`;
            result.errors.push(errorMsg);
            logError('text-search', errorMsg, error);
          }
        }

        if (result.ranges.length >= maxMatches) break;
      }

      logSuccess('text-search', `文本搜索完成: 找到 ${result.total} 个匹配项`);

    } catch (error) {
      const errorMsg = `文本搜索过程中发生错误: ${error}`;
      result.errors.push(errorMsg);
      logError('text-search', errorMsg, error);
    }

    return result;
  }
}
