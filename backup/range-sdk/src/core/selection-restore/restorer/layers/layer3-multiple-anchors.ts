/**
 * ===================================================================
 * Layer 3: 多重锚点恢复算法
 * ===================================================================
 */

import { SerializedSelection, ContainerConfig } from '../../types';
import { applySelectionWithStrictValidation, intelligentTextMatch } from '../utils';
import { logDebug, logWarn, logError, logSuccess } from '../../debug/logger';

export function restoreByMultipleAnchors(data: SerializedSelection, containerConfig?: ContainerConfig): boolean {
  const { multipleAnchors, text } = data;

  if (!multipleAnchors.startAnchors || !multipleAnchors.endAnchors) {
    logWarn('L3', 'L3跳过：缺少锚点信息', {
      startAnchors: !!multipleAnchors.startAnchors,
      endAnchors: !!multipleAnchors.endAnchors,
    });
    return false;
  }

  try {
    logDebug('L3', 'L3开始：多重锚点恢复', {
      startAnchor: {
        tagName: multipleAnchors.startAnchors.tagName,
        className: multipleAnchors.startAnchors.className,
        id: multipleAnchors.startAnchors.id,
      },
      endAnchor: {
        tagName: multipleAnchors.endAnchors.tagName,
        className: multipleAnchors.endAnchors.className,
        id: multipleAnchors.endAnchors.id,
      },
      textLength: text.length,
      containerConfig: containerConfig ? {
        enabledContainers: containerConfig.enabledContainers.length,
        disabledContainers: containerConfig.disabledContainers.length,
      } : '无容器配置',
    });

    // 查找匹配的锚点元素，传递容器配置
    const startCandidatesWithText = findAnchorElements(multipleAnchors.startAnchors, text, containerConfig);
    const endCandidatesWithText = findAnchorElements(multipleAnchors.endAnchors, text, containerConfig);

    if (startCandidatesWithText.length === 0 || endCandidatesWithText.length === 0) {
      logWarn('L3', 'L3失败：找不到匹配的锚点元素', {
        startCandidatesCount: startCandidatesWithText.length,
        endCandidatesCount: endCandidatesWithText.length,
        startAnchor: multipleAnchors.startAnchors,
        endAnchor: multipleAnchors.endAnchors,
        containerFiltered: containerConfig ? true : false,
      });
      return false;
    }

    logDebug('L3', `L3候选元素：找到${startCandidatesWithText.length}个匹配元素`);

    // 尝试每个候选组合
    for (let i = 0; i < startCandidatesWithText.length && i < 10; i++) {
      const startElement = startCandidatesWithText[i].element;

      logDebug('L3', `L3测试候选元素 ${i + 1}/${startCandidatesWithText.length}`);

      for (const endCandidate of endCandidatesWithText) {
        const endElement = endCandidate.element;

        // 尝试在这对元素中恢复选区
        const result = tryRestoreInElementPair(startElement, endElement, text);
        if (result) {
          logSuccess('L3', 'L3找到文本位置', {
            startElement: startElement.tagName,
            endElement: endElement.tagName,
            textLength: text.length,
          });

          return applySelectionWithStrictValidation(result, text, 'L3');
        }
      }
    }

    logWarn('L3', 'L3失败：所有候选元素都未通过验证', {
      总候选数: startCandidatesWithText.length * endCandidatesWithText.length,
      测试的组合数: Math.min(startCandidatesWithText.length, 10) * endCandidatesWithText.length,
    });

    return false;

  } catch (error) {
    logError('L3', 'L3处理异常', {
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * 计算元素与锚点的相似度
 */
function calculateElementSimilarityLocal(element: Element, anchor: any): number {
  let score = 0;
  let maxScore = 0;

  // 标签名匹配
  maxScore += 1;
  if (element.tagName.toLowerCase() === anchor.tagName.toLowerCase()) {
    score += 1;
  }

  // ID匹配
  if (anchor.id) {
    maxScore += 1;
    if (element.id === anchor.id) {
      score += 1;
    }
  }

  // 类名匹配
  if (anchor.className) {
    maxScore += 1;
    if (element.className === anchor.className) {
      score += 1;
    } else if (element.className && anchor.className) {
      const elementClasses = new Set(element.className.split(/\s+/));
      const anchorClasses = new Set(anchor.className.split(/\s+/));
      const intersection = new Set([...elementClasses].filter(x => anchorClasses.has(x)));
      score += intersection.size / Math.max(elementClasses.size, anchorClasses.size);
    }
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * 查找匹配指定锚点的元素
 * 支持根节点限定: 在指定的根节点内查找而不是整个document
 */
function findAnchorElements(anchor: any, expectedText?: string, containerConfig?: ContainerConfig) {
  const candidates: { element: Element; similarity: number; textSimilarity: number }[] = [];

  // 根节点限定: 如果指定了rootNodeId，只在该节点内查找
  let rootNode: Element | Document = document;
  if (containerConfig?.rootNodeId) {
    const foundNode = document.getElementById(containerConfig.rootNodeId);
    if (!foundNode) {
      logWarn('L3', '指定的根节点不存在，降级到document', { rootNodeId: containerConfig.rootNodeId });
    } else {
      rootNode = foundNode;
    }
  }

  // 构建选择器
  let selector = anchor.tagName.toLowerCase();
  if (anchor.id) selector += `#${anchor.id}`;
  if (anchor.className) {
    const classes = anchor.className.split(' ').filter(Boolean);
    selector += classes.map((cls: string) => `.${cls}`).join('');
  }

  try {
    const elements = rootNode.querySelectorAll(selector);
    elements.forEach(element => {
      // 🎯 容器范围过滤
      if (containerConfig) {
        // 检查是否在豁免区域内
        if (containerConfig.disabledContainers.length > 0) {
          for (const disabledSelector of containerConfig.disabledContainers) {
            try {
              if (element.closest(disabledSelector)) {
                logDebug('L3', `元素在豁免区域内，跳过: ${disabledSelector}`, {
                  elementTagName: element.tagName,
                  elementText: (element.textContent || '').substring(0, 30) + '...',
                });
                return; // 跳过此元素
              }
            } catch (error) {
              logWarn('L3', `无效的豁免区域选择器: ${disabledSelector}`, error);
            }
          }
        }

        // 检查是否在生效范围内
        if (containerConfig.enabledContainers.length > 0) {
          let inEnabledContainer = false;
          for (const enabledSelector of containerConfig.enabledContainers) {
            try {
              if (element.closest(enabledSelector)) {
                inEnabledContainer = true;
                break;
              }
            } catch (error) {
              logWarn('L3', `无效的生效范围选择器: ${enabledSelector}`, error);
            }
          }

          if (!inEnabledContainer) {
            logDebug('L3', '元素不在指定的生效范围内，跳过', {
              elementTagName: element.tagName,
              elementText: (element.textContent || '').substring(0, 30) + '...',
              enabledContainers: containerConfig.enabledContainers,
            });
            return; // 跳过此元素
          }
        }
      }

      const similarity = calculateElementSimilarityLocal(element, anchor);

      // 🎯 新增：计算文本相似度（如果提供了期望文本）
      let textSimilarity = 0;
      if (expectedText) {
        const elementText = element.textContent || '';
        if (elementText.includes(expectedText.substring(0, 20))) {
          textSimilarity = 1.0; // 包含目标文本的开头部分，给予高分
        } else if (elementText.includes(expectedText.substring(0, 10))) {
          textSimilarity = 0.8; // 包含目标文本的前10个字符
        } else {
          // 计算文本相似度（简单的字符匹配）
          const expectedWords = expectedText.substring(0, 50).split('').filter((c: string) => c.trim());
          const elementWords = elementText.substring(0, 100).split('').filter((c: string) => c.trim());
          const matchingChars = expectedWords.filter(char => elementWords.includes(char));
          textSimilarity = expectedWords.length > 0 ? matchingChars.length / expectedWords.length : 0;
        }
      }

      candidates.push({
        element,
        similarity,
        textSimilarity,
      });
    });

    // 按综合分数排序：文本相似度权重更高
    candidates.sort((a, b) => {
      const scoreA = a.textSimilarity * 2 + a.similarity;
      const scoreB = b.textSimilarity * 2 + b.similarity;
      return scoreB - scoreA;
    });

    logDebug('L3', `找到 ${candidates.length} 个候选元素（容器过滤后）`, {
      selector,
      总元素数: elements.length,
      过滤后数量: candidates.length,
      前三名分数: candidates.slice(0, 3).map(c => ({
        tagName: c.element.tagName,
        similarity: c.similarity.toFixed(2),
        textSimilarity: c.textSimilarity.toFixed(2),
        综合分数: (c.textSimilarity * 2 + c.similarity).toFixed(2),
        elementPreview: (c.element.textContent || '').substring(0, 30) + '...',
      })),
    });

    return candidates;

  } catch (error) {
    logError('L3', 'L3查找元素时出错', {
      selector,
      error: (error as Error).message,
    });
    return [];
  }
}

/**
 * 尝试在一对元素中恢复选区
 */
function tryRestoreInElementPair(startElement: Element, endElement: Element, expectedText: string): Range | null {
  try {
    logDebug('L3', '🔍 尝试元素对恢复', {
      startTag: startElement.tagName,
      endTag: endElement.tagName,
      isSameElement: startElement === endElement,
      expectedTextPreview: expectedText.substring(0, 50) + '...',
    });

    // 如果是同一个元素，在其中查找文本
    if (startElement === endElement) {
      return findTextInElement(startElement, expectedText);
    }

    // 跨元素查找: 采用更智能的文本定位策略
    return findTextAcrossElements(startElement, endElement, expectedText);

  } catch (error) {
    logWarn('L3', 'tryRestoreInElementPair异常', {
      error: (error as Error).message,
      startTag: startElement.tagName,
      endTag: endElement.tagName,
    });
    return null;
  }
}

/**
 * 跨元素文本查找（严格完整匹配版本）
 */
function findTextAcrossElements(startElement: Element, endElement: Element, expectedText: string): Range | null {
  try {
    // 1. 查找共同父元素
    const commonParent = findCommonParent(startElement, endElement);
    if (!commonParent) {
      logDebug('L3', '❌ 无法找到共同父元素');
      return null;
    }

    // 2. 在共同父元素中查找完整文本
    const parentText = commonParent.textContent || '';
    const textIndex = intelligentTextMatch(parentText, expectedText);

    if (textIndex === -1) {
      logDebug('L3', '❌ 共同父元素中未找到目标文本', {
        parentTag: commonParent.tagName,
        parentTextLength: parentText.length,
        expectedTextPreview: expectedText.substring(0, 50) + '...',
        searchFailed: '完整文本匹配失败',
      });
      return null;
    }

    logDebug('L3', '✅ 在共同父元素中找到完整文本', {
      parentTag: commonParent.tagName,
      textIndex: textIndex,
      expectedLength: expectedText.length,
    });

    // 3. 创建Range对象
    return createRangeFromTextMatch(commonParent, textIndex, expectedText);

  } catch (error) {
    logError('L3', 'findTextAcrossElements异常', {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * 创建Range对象 - 修复版本
 */
function createRangeFromTextMatch(parentElement: Element, textIndex: number, matchedText: string): Range | null {
  try {
    const walker = document.createTreeWalker(
      parentElement,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let currentOffset = 0;
    let targetStartNode: Text | null = null;
    let targetStartOffset = 0;
    let targetEndNode: Text | null = null;
    let targetEndOffset = 0;

    logDebug('L3', '🔧 开始创建Range', {
      parentTag: parentElement.tagName,
      textIndex,
      matchedTextLength: matchedText.length,
      parentTextPreview: (parentElement.textContent || '').substring(0, 100) + '...',
    });

    // 第一遍：查找起始位置
    let textNode = walker.nextNode() as Text;
    while (textNode) {
      const nodeText = textNode.textContent || '';
      const nodeLength = nodeText.length;

      // 检查目标起始位置是否在当前节点内
      if (currentOffset <= textIndex && textIndex < currentOffset + nodeLength) {
        targetStartNode = textNode;
        targetStartOffset = textIndex - currentOffset;
        logDebug('L3', '✅ 找到起始文本节点', {
          nodeText: nodeText.substring(0, 30) + '...',
          nodeLength,
          currentOffset,
          targetStartOffset,
        });
        break;
      }

      currentOffset += nodeLength;
      textNode = walker.nextNode() as Text;
    }

    if (!targetStartNode) {
      logWarn('L3', '❌ 无法找到起始文本节点', {
        textIndex,
        totalTextLength: currentOffset,
      });
      return null;
    }

    // 第二遍：从头开始查找结束位置
    const endIndex = textIndex + matchedText.length;
    currentOffset = 0;

    // 重新开始遍历
    walker.currentNode = parentElement;
    textNode = walker.nextNode() as Text;

    while (textNode) {
      const nodeText = textNode.textContent || '';
      const nodeLength = nodeText.length;

      // 检查目标结束位置是否在当前节点内或刚好在节点末尾
      if (currentOffset < endIndex && endIndex <= currentOffset + nodeLength) {
        targetEndNode = textNode;
        targetEndOffset = endIndex - currentOffset;
        logDebug('L3', '✅ 找到结束文本节点', {
          nodeText: nodeText.substring(0, 30) + '...',
          nodeLength,
          currentOffset,
          targetEndOffset,
        });
        break;
      }

      currentOffset += nodeLength;
      textNode = walker.nextNode() as Text;
    }

    if (!targetEndNode) {
      logWarn('L3', '❌ 无法找到结束文本节点', {
        endIndex,
        totalTextLength: currentOffset,
      });
      return null;
    }

    // 创建Range
    const range = document.createRange();
    range.setStart(targetStartNode, targetStartOffset);
    range.setEnd(targetEndNode, targetEndOffset);

    // 验证Range的文本内容
    const rangeText = range.toString();

    logDebug('L3', '🧪 Range验证', {
      expectedLength: matchedText.length,
      actualLength: rangeText.length,
      expectedPreview: matchedText.substring(0, 50) + '...',
      actualPreview: rangeText.substring(0, 50) + '...',
      textMatches: rangeText === matchedText,
    });

    if (rangeText !== matchedText) {
      // 🎯 详细的不匹配分析
      logWarn('L3', '❌ Range文本不匹配 - 详细分析', {
        expected: matchedText,
        actual: rangeText,
        expectedHex: Array.from(matchedText).map(c => c.charCodeAt(0).toString(16)).join(' '),
        actualHex: Array.from(rangeText).map(c => c.charCodeAt(0).toString(16)).join(' '),
        startNodeText: targetStartNode.textContent,
        endNodeText: targetEndNode.textContent,
        startOffset: targetStartOffset,
        endOffset: targetEndOffset,
      });
      return null;
    }

    logDebug('L3', '✅ 成功创建Range', {
      startNodePreview: (targetStartNode.textContent || '').substring(0, 30) + '...',
      startOffset: targetStartOffset,
      endNodePreview: (targetEndNode.textContent || '').substring(0, 30) + '...',
      endOffset: targetEndOffset,
      rangeTextPreview: rangeText.substring(0, 50) + '...',
    });

    return range;

  } catch (error) {
    logError('L3', '❌ createRangeFromTextMatch异常', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    return null;
  }
}

/**
 * 查找两个元素的共同父元素
 */
function findCommonParent(element1: Element, element2: Element): Element | null {
  // 如果是同一个元素，返回其父元素
  if (element1 === element2) {
    return element1.parentElement;
  }

  // 获取element1的所有父元素
  const parents1 = [];
  let current = element1.parentElement;
  while (current) {
    parents1.push(current);
    current = current.parentElement;
  }

  // 从element2开始向上查找，找到第一个在parents1中的元素
  current = element2.parentElement;
  while (current) {
    if (parents1.includes(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * 在单个元素中查找文本
 */
function findTextInElement(element: Element, text: string): Range | null {
  const elementText = element.textContent || '';
  const textIndex = intelligentTextMatch(elementText, text);

  if (textIndex === -1) {
    return null;
  }

  return createRangeFromTextMatch(element, textIndex, text);
}
