/**
 * ===================================================================
 * Layer 4: 跨元素Range构建器 - 跨元素选区Range创建与验证
 * ===================================================================
 */

import { SerializedSelection } from '../../../../types';
import { intelligentTextMatch } from '../../utils';
import { logDebug, logWarn } from '../../../../common/debug';
import { findEndElementCandidates } from './candidate-finder';
import { L4_WEIGHT_ADJUSTMENTS } from '../../../../constants';

/**
 * 尝试创建跨元素Range
 */
export function tryCreateCrossElementRange(
  startElement: Element,
  text: string,
  data: SerializedSelection,
): Range | null {
  const { multipleAnchors } = data.restore;
  if (!multipleAnchors || !multipleAnchors.startAnchors || !multipleAnchors.endAnchors) {
    return null;
  }

  try {
    logDebug('L4', 'L4尝试跨元素Range构建', {
      startTag: multipleAnchors.startAnchors.tagName,
      endTag: multipleAnchors.endAnchors.tagName,
      expectedTextLength: text.length,
      startElementText: (startElement.textContent || '').substring(0, 50) + '...',
    });

    const endElementCandidates = findEndElementCandidates(startElement, multipleAnchors);

    for (const endElement of endElementCandidates) {
      const crossElementRange = createCrossElementRange(startElement, endElement, text);
      if (crossElementRange) {
        logDebug('L4', 'L4跨元素Range构建成功', {
          startElement: startElement.tagName,
          endElement: endElement.tagName,
          rangeText: crossElementRange.toString().substring(0, 100) + '...',
          rangeLength: crossElementRange.toString().length,
        });
        return crossElementRange;
      }
    }

    return null;
  } catch (error) {
    logWarn('L4', 'L4跨元素Range构建失败', {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * 创建跨元素Range
 */
export function createCrossElementRange(
  startElement: Element,
  endElement: Element,
  expectedText: string,
): Range | null {
  try {
    const commonAncestor = findCommonAncestor(startElement, endElement);
    if (!commonAncestor) {
      logDebug('L4', 'L4跨元素Range构建失败：无共同祖先');
      return null;
    }

    const commonAncestorText = commonAncestor.textContent || '';
    const normalizedExpectedText = normalizeTextForComparison(expectedText);
    const normalizedAncestorText = normalizeTextForComparison(commonAncestorText);

    let textIndex = normalizedAncestorText.indexOf(normalizedExpectedText);

    // 如果精确匹配失败，尝试更灵活的匹配策略
    if (textIndex === -1) {
      const midPoint = Math.floor(expectedText.length / 2);
      const firstHalf = normalizeTextForComparison(expectedText.substring(0, midPoint));
      const secondHalf = normalizeTextForComparison(expectedText.substring(midPoint));

      const firstIndex = normalizedAncestorText.indexOf(firstHalf);
      if (firstIndex !== -1) {
        const secondIndex = normalizedAncestorText.indexOf(secondHalf, firstIndex);
        if (secondIndex !== -1) {
          textIndex = firstIndex;
          const actualLength = secondIndex + secondHalf.length - firstIndex;
          logDebug('L4', 'L4使用分段匹配策略', {
            firstHalf: firstHalf.substring(0, 20) + '...',
            secondHalf: secondHalf.substring(0, 20) + '...',
            actualLength,
            expectedLength: expectedText.length,
          });
        }
      }
    }

    if (textIndex === -1) {
      logDebug('L4', 'L4跨元素Range构建失败：在共同祖先中未找到匹配文本');
      return null;
    }

    const range = createRangeFromTextPosition(commonAncestor, textIndex, expectedText.length);
    if (!range) {
      logDebug('L4', 'L4跨元素Range构建失败：无法创建Range');
      return null;
    }

    const rangeText = range.toString();
    const normalizedRangeText = normalizeTextForComparison(rangeText);
    const normalizedExpectedTextForComparison = normalizeTextForComparison(expectedText);

    const similarity = calculateTextSimilarity(normalizedRangeText, normalizedExpectedTextForComparison);

    logDebug('L4', 'L4跨元素Range文本比较', {
      expectedLength: expectedText.length,
      actualLength: rangeText.length,
      similarity: (similarity * 100).toFixed(1) + '%',
      expectedStart: expectedText.substring(0, 30) + '...',
      actualStart: rangeText.substring(0, 30) + '...',
    });

    if (similarity >= L4_WEIGHT_ADJUSTMENTS.CROSS_ELEMENT_MIN_SIMILARITY) {
      logDebug('L4', 'L4跨元素Range结构匹配接受', {
        similarity: (similarity * 100).toFixed(1) + '%',
        reason: '结构匹配模式，降低文本相似度要求',
      });
      return range;
    }

    logDebug('L4', 'L4跨元素Range相似度过低', {
      similarity: (similarity * 100).toFixed(1) + '%',
      threshold: '30%',
      reason: '文本相似度不足',
    });

    return null;
  } catch (error) {
    logWarn('L4', 'L4跨元素Range创建失败', {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * 在元素中查找精确文本
 */
export function findExactTextInElement(element: Element, text: string): Range | null {
  const elementText = element.textContent || '';
  const index = intelligentTextMatch(elementText, text);

  if (index === -1) return null;

  return createRangeFromTextPosition(element, index, text.length);
}

/**
 * 创建Range从文本位置
 */
export function createRangeFromTextPosition(
  element: Element,
  startIndex: number,
  length: number,
): Range | null {
  try {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let currentOffset = 0;
    let node = walker.nextNode() as Text | null;

    while (node) {
      const nodeLength = node.textContent?.length || 0;

      if (currentOffset <= startIndex && currentOffset + nodeLength > startIndex) {
        const range = document.createRange();
        const startOffset = startIndex - currentOffset;
        const endOffset = Math.min(startOffset + length, nodeLength);

        range.setStart(node, startOffset);

        if (startOffset + length <= nodeLength) {
          range.setEnd(node, endOffset);
        } else {
          let remainingLength = length - (nodeLength - startOffset);
          let endNode = walker.nextNode() as Text | null;

          while (endNode && remainingLength > 0) {
            const endNodeLength = endNode.textContent?.length || 0;
            if (remainingLength <= endNodeLength) {
              range.setEnd(endNode, remainingLength);
              break;
            }
            remainingLength -= endNodeLength;
            endNode = walker.nextNode() as Text | null;
          }

          if (!endNode) {
            range.setEnd(node, nodeLength);
          }
        }

        return range;
      }

      currentOffset += nodeLength;
      node = walker.nextNode() as Text | null;
    }

    return null;
  } catch (error) {
    logWarn('L4', 'L4创建Range失败', {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * 标准化文本用于比较
 */
export function normalizeTextForComparison(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
}

/**
 * 查找两个元素的共同祖先
 */
export function findCommonAncestor(element1: Element, element2: Element): Element | null {
  if (element1 === element2) {
    return element1.parentElement;
  }

  const ancestors = new Set<Element>();
  let current: Element | null = element1;

  while (current) {
    ancestors.add(current);
    current = current.parentElement;
  }

  current = element2;
  while (current) {
    if (ancestors.has(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * 计算文本相似度
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1.0;

  const minLength = Math.min(text1.length, text2.length);
  const maxLength = Math.max(text1.length, text2.length);

  if (maxLength === 0) return 0;

  let commonPrefix = 0;
  for (let i = 0; i < minLength; i++) {
    if (text1[i] === text2[i]) {
      commonPrefix++;
    } else {
      break;
    }
  }

  const prefixSimilarity = commonPrefix / maxLength;
  const lengthSimilarity = minLength / maxLength;
  const containsSimilarity = Math.max(
    text1.includes(text2) ? 0.8 : 0,
    text2.includes(text1) ? 0.8 : 0,
  );

  return Math.max(prefixSimilarity, lengthSimilarity * 0.7, containsSimilarity);
}
