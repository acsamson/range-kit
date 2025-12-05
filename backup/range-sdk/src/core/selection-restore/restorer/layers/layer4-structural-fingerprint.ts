/**
 * ===================================================================
 * Layer 4: 结构指纹恢复算法 (结构匹配)
 * ===================================================================
 */

import { SerializedSelection, ContainerConfig } from '../../types';
import { applySelectionWithStrictValidation, intelligentTextMatch } from '../utils';
import { logDebug, logWarn } from '../../debug/logger';
import { getSemanticTags } from '../helpers/l4-helpers';

export function restoreByStructuralFingerprint(data: SerializedSelection, containerConfig?: ContainerConfig): boolean {
  const { structuralFingerprint, text } = data;

  // 记录容器配置状态
  if (containerConfig) {
    logDebug('L4', 'L4接收到容器配置', {
      enabledContainers: containerConfig.enabledContainers.length,
      disabledContainers: containerConfig.disabledContainers.length,
    });
  }

  if (!structuralFingerprint.tagName) {
    logWarn('L4', 'L4失败：结构指纹缺失tagName', {
      reason: '结构指纹必须包含tagName',
    });
    return false;
  }

  logDebug('L4', 'L4开始：结构指纹恢复', {
    selectionId: data.id,
    targetText: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    textLength: text.length,
    tagName: structuralFingerprint.tagName,
    className: structuralFingerprint.className,
    depth: structuralFingerprint.depth,
    childCount: structuralFingerprint.childCount,
  });

  // 结构匹配策略：从严格到宽松
  const matchingStrategies = [
    { minSimilarity: 0.8, name: '高精度结构匹配' },
    { minSimilarity: 0.6, name: '中等结构匹配' },
    { minSimilarity: 0.4, name: '宽松结构匹配' },
    { minSimilarity: 0.2, name: '最低结构匹配' },
  ];

  for (const strategy of matchingStrategies) {
    logDebug('L4', `L4尝试${strategy.name}策略`, {
      minSimilarity: strategy.minSimilarity,
    });

    const candidates = findElementsByStructure(structuralFingerprint, strategy.minSimilarity, data, containerConfig);

    if (candidates.length > 0) {
      logDebug('L4', `L4候选元素：找到${candidates.length}个匹配元素`);

      // 跨元素选区优先策略：如果是跨元素选区，优先测试匹配的起始标签
      let prioritizedCandidates = candidates;
      if (data.multipleAnchors && data.multipleAnchors.startAnchors && data.multipleAnchors.endAnchors) {
        const startTag = data.multipleAnchors.startAnchors.tagName.toLowerCase();
        const crossElementCandidates = candidates.filter(c => c.element.tagName.toLowerCase() === startTag);
        const otherCandidates = candidates.filter(c => c.element.tagName.toLowerCase() !== startTag);

        if (crossElementCandidates.length > 0) {
          prioritizedCandidates = [...crossElementCandidates, ...otherCandidates];
          logDebug('L4', `L4跨元素优先：优先测试${crossElementCandidates.length}个${startTag}元素`, {
            startTag,
            crossElementCount: crossElementCandidates.length,
            otherCount: otherCandidates.length,
          });
        }
      }

      for (let i = 0; i < Math.min(prioritizedCandidates.length, 15); i++) { // 限制最多测试15个候选
        const candidate = prioritizedCandidates[i];
        logDebug('L4', `L4测试候选元素 ${i + 1}/${prioritizedCandidates.length}`, {
          similarity: (candidate.similarity * 100).toFixed(1) + '%',
          elementTag: candidate.element.tagName,
          elementPreview: candidate.element.textContent?.substring(0, 50) + '...',
          strategy: strategy.name,
        });

        // 结构匹配后进行精确文本匹配
        if (tryStructuralTextMatching(candidate.element, text, data)) {
          return true;
        }
      }
    }
  }

  logWarn('L4', 'L4失败：所有结构匹配策略都未成功', {
    reason: '尝试了所有结构相似度阈值',
    totalStrategies: matchingStrategies.length,
  });
  return false;
}

/**
 * 结构匹配后的精确文本匹配
 */
function tryStructuralTextMatching(element: Element, text: string, data: SerializedSelection): boolean {
  // 优先检查是否为跨元素选区
  if (data.multipleAnchors && data.multipleAnchors.startAnchors && data.multipleAnchors.endAnchors) {
    const startTag = data.multipleAnchors.startAnchors.tagName.toLowerCase();
    const endTag = data.multipleAnchors.endAnchors.tagName.toLowerCase();
    const elementTag = element.tagName.toLowerCase();

    // 如果当前元素是起始元素，且起始和结束标签不同，说明可能是跨元素选区
    if (elementTag === startTag && startTag !== endTag) {
      // 检查起始元素是否包含期望的文本内容
      const elementText = cleanElementText(element);
      const trimmedText = text.trim();

      let textInElement = false;
      let matchReason = '';

      // 策略1: 检查textContext中的父文本匹配（最准确）
      if (data.textContext?.parentText) {
        const parentText = data.textContext.parentText.trim();
        if (parentText && elementText.includes(parentText)) {
          textInElement = true;
          matchReason = '父文本上下文精确匹配';
        }
      }

      // 策略2: 检查选区文本开头是否在元素中出现
      if (!textInElement && trimmedText) {
        const textStart = trimmedText.substring(0, Math.min(20, trimmedText.length));
        if (elementText.includes(textStart)) {
          textInElement = true;
          matchReason = '选区开头文本匹配';
        }
      }

      logDebug('L4', 'L4检查跨元素起始文本匹配', {
        elementTag: element.tagName,
        elementClass: element.className,
        elementText: elementText.substring(0, 50) + '...',
        selectionText: trimmedText.substring(0, 50) + '...',
        textInElement,
        matchReason,
        elementLength: elementText.length,
        expectedLength: text.length,
        parentText: data.textContext?.parentText,
        expectedStartTag: startTag,
        expectedEndTag: endTag,
      });

      // 只有当起始元素确实包含相关文本时，才尝试跨元素Range构建
      if (textInElement) {
        const crossElementRange = tryCreateCrossElementRange(element, text, data);
        if (crossElementRange && applySelectionWithStrictValidation(crossElementRange, text, 'L4-跨元素匹配')) {
          return true;
        }
      } else {
        logDebug('L4', 'L4跳过跨元素尝试：起始元素文本不匹配', {
          reason: '起始元素不包含期望的文本片段',
        });
      }
    }
  }

  // 精确文本匹配
  const exactRange = findExactTextInElement(element, text);
  if (exactRange && applySelectionWithStrictValidation(exactRange, text, 'L4-精确匹配')) {
    return true;
  }

  return false;
}

/**
 * 根据结构指纹查找相似元素
 * 支持根节点限定: 在指定的根节点内查找而不是整个document
 */
function findElementsByStructure(fingerprint: any, minSimilarity: number, data?: SerializedSelection, containerConfig?: ContainerConfig) {
  const candidates: { element: Element; similarity: number }[] = [];

  // 根节点限定: 如果指定了rootNodeId，只在该节点内查找
  let rootNode: Element | Document = document;
  if (containerConfig?.rootNodeId) {
    const foundNode = document.getElementById(containerConfig.rootNodeId);
    if (!foundNode) {
      logWarn('L4', '指定的根节点不存在，降级到document', { rootNodeId: containerConfig.rootNodeId });
    } else {
      rootNode = foundNode;
    }
  }

  // 智能标签查找：优先原始标签，然后尝试语义相关标签
  const targetTag = fingerprint.tagName.toLowerCase();
  let elements = rootNode.querySelectorAll(targetTag);

  // 如果原始标签找不到足够的候选元素，尝试语义相关的标签
  let searchTags = [targetTag];
  if (elements.length === 0) {
    const semanticTags = getSemanticTags(targetTag);
    searchTags = [targetTag, ...semanticTags];

    // 重新查找所有语义相关的元素
    const allElements: Element[] = [];
    searchTags.forEach(tag => {
      const tagElements = Array.from(rootNode.querySelectorAll(tag));
      allElements.push(...tagElements);
    });
    elements = allElements as any; // 临时类型转换

    logDebug('L4', `L4标签降级：原始${targetTag}元素不足，扩展搜索`, {
      originalTag: targetTag,
      semanticTags,
      totalElements: elements.length,
    });
  }

  logDebug('L4', `L4结构扫描：检查${elements.length}个元素`, {
    searchTags,
    minSimilarity,
  });

  elements.forEach(element => {
    let similarity = calculateStructuralSimilarity(element, fingerprint);

    // 🔥 跨元素选区特殊加分：如果元素包含textContext中的父文本，给予额外分数
    const elementText = cleanElementText(element);
    if (data?.textContext?.parentText) {
      const parentText = data.textContext.parentText.trim();
      if (parentText && elementText.includes(parentText)) {
        similarity += 0.3; // 给予30%的额外分数
      }
    }

    // 📝 语义标签降级调整：如果是跨标签匹配，略微降低相似度但仍保持可行性
    const elementTag = element.tagName.toLowerCase();
    const targetTag = fingerprint.tagName.toLowerCase();
    if (elementTag !== targetTag) {
      const semanticTags = getSemanticTags(targetTag);
      if (semanticTags.includes(elementTag)) {
        // 语义相关的标签，降低10%相似度但仍可接受
        similarity *= 0.9;
        logDebug('L4', `L4语义标签匹配：${targetTag} → ${elementTag}`, {
          originalSimilarity: (similarity / 0.9).toFixed(3),
          adjustedSimilarity: similarity.toFixed(3),
        });
      }
    }

    if (similarity >= minSimilarity) {
      candidates.push({ element, similarity });
    }
  });

  // 按相似度排序
  return candidates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * 纯粹的结构相似度计算
 */
function calculateStructuralSimilarity(element: Element, fingerprint: any): number {
  let score = 0;
  let maxScore = 0;

  // 标签匹配 (权重: 2)
  maxScore += 2;
  const elementTag = element.tagName.toLowerCase();
  const targetTag = fingerprint.tagName.toLowerCase();

  if (elementTag === targetTag) {
    score += 2; // 精确匹配
  }

  // 类名匹配 (权重: 1)
  maxScore += 1;
  const elementClass = element.className || '';
  const targetClass = fingerprint.className || '';

  if (elementClass === targetClass) {
    score += 1;
  } else if (elementClass && targetClass) {
    // 部分类名匹配
    const elementClasses = new Set(elementClass.split(/\s+/));
    const targetClasses = new Set(targetClass.split(/\s+/));
    const intersection = new Set([...elementClasses].filter(x => targetClasses.has(x)));
    score += (intersection.size / Math.max(elementClasses.size, targetClasses.size));
  }

  // 文本长度相似度 (权重: 3)
  maxScore += 3;
  const elementTextLength = cleanElementText(element).length;
  const targetTextLength = fingerprint.textLength || 0;

  if (elementTextLength > 0 && targetTextLength > 0) {
    const lengthRatio = Math.min(elementTextLength, targetTextLength) / Math.max(elementTextLength, targetTextLength);
    score += lengthRatio * 3;
  }

  // DOM深度匹配 (权重: 1)
  maxScore += 1;
  const elementDepth = getElementDepth(element);
  const targetDepth = fingerprint.depth || 0;

  if (targetDepth > 0) {
    const depthDiff = Math.abs(elementDepth - targetDepth);
    const depthScore = Math.max(0, 1 - depthDiff / 10); // 深度差异越小分数越高
    score += depthScore;
  }

  // 子元素数量匹配 (权重: 1)
  maxScore += 1;
  const elementChildCount = element.children.length;
  const targetChildCount = fingerprint.childCount || 0;

  if (elementChildCount === targetChildCount) {
    score += 1;
  } else {
    const childCountDiff = Math.abs(elementChildCount - targetChildCount);
    score += Math.max(0, 1 - childCountDiff / 5);
  }

  // 父链相似度 (权重: 2)
  maxScore += 2;
  if (fingerprint.parentChain && fingerprint.parentChain.length > 0) {
    const parentChainSimilarity = calculateParentChainSimilarity(element, fingerprint.parentChain);
    score += parentChainSimilarity * 2;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * 计算元素深度
 */
function getElementDepth(element: Element): number {
  let depth = 0;
  let current = element.parentElement;
  while (current) {
    depth++;
    current = current.parentElement;
  }
  return depth;
}

/**
 * 父链相似度计算
 */
function calculateParentChainSimilarity(element: Element, targetParentChain: any[]): number {
  const elementParentChain: { tag: string; className: string }[] = [];
  let current = element.parentElement;

  // 构建元素的父链
  while (current && elementParentChain.length < Math.max(targetParentChain.length, 8)) {
    elementParentChain.push({
      tag: current.tagName.toLowerCase(),
      className: current.className || '',
    });
    current = current.parentElement;
  }

  if (elementParentChain.length === 0 || targetParentChain.length === 0) return 0;

  let totalScore = 0;
  let maxPossibleScore = 0;

  // 对比每一层父元素
  const maxDepth = Math.max(elementParentChain.length, targetParentChain.length);
  for (let i = 0; i < maxDepth; i++) {
    maxPossibleScore += 1;

    if (i < elementParentChain.length && i < targetParentChain.length) {
      const elementParent = elementParentChain[i];
      const targetParent = targetParentChain[i];

      let layerScore = 0;

      // 标签匹配
      if (elementParent.tag === targetParent.tagName?.toLowerCase()) {
        layerScore += 0.7;
      }

      // 类名匹配
      if (elementParent.className && targetParent.className) {
        if (elementParent.className === targetParent.className) {
          layerScore += 0.3;
        } else {
          const elementClasses = new Set(elementParent.className.split(/\s+/));
          const targetClasses = new Set(targetParent.className.split(/\s+/));
          const intersection = new Set([...elementClasses].filter(x => targetClasses.has(x)));
          layerScore += (intersection.size / Math.max(elementClasses.size, targetClasses.size)) * 0.3;
        }
      }

      totalScore += Math.min(layerScore, 1); // 每层最多1分
    }
  }

  return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
}

/**
 * 清理元素文本，移除调试信息污染
 */
function cleanElementText(element: Element): string {
  const rawText = element.textContent || '';

  // 纯结构匹配：只做基本的文本规范化，不做任何特化处理
  return rawText
    .replace(/\s+/g, ' ')     // 规范化空白字符
    .trim();
}

/**
 * 在元素中查找精确文本
 */
function findExactTextInElement(element: Element, text: string): Range | null {
  const elementText = element.textContent || '';
  const index = intelligentTextMatch(elementText, text);

  if (index === -1) return null;

  return createRangeFromTextPosition(element, index, text.length);
}

/**
 * 创建Range从文本位置
 */
function createRangeFromTextPosition(element: Element, startIndex: number, length: number): Range | null {
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

        // 如果文本跨越多个节点，需要找到结束节点
        if (startOffset + length <= nodeLength) {
          range.setEnd(node, endOffset);
        } else {
          // 跨节点情况，继续查找结束位置
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
 * 尝试创建跨元素Range
 */
function tryCreateCrossElementRange(startElement: Element, text: string, data: SerializedSelection): Range | null {
  const multipleAnchors = data.multipleAnchors;
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

    // 查找结束元素：在同一个commonParent下查找匹配的结束标签
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
 * 查找结束元素候选
 */
function findEndElementCandidates(startElement: Element, multipleAnchors: any): Element[] {
  const candidates: Element[] = [];
  const endTag = multipleAnchors.endAnchors.tagName.toLowerCase();
  const endClassName = multipleAnchors.endAnchors.className || '';

  logDebug('L4', 'L4开始查找结束元素候选', {
    endTag,
    endClassName,
    startElementTag: startElement.tagName,
    startElementText: startElement.textContent?.substring(0, 50) + '...',
  });

  const searchTags = getSemanticTags(endTag);

  // 策略1: 基于commonParent查找（最优）
  if (multipleAnchors.commonParent) {
    try {
      // 尝试通过commonParent路径定位共同父元素
      const commonParentPath = multipleAnchors.commonParent;
      let commonParentElement: Element | null = null;

      // 如果commonParent包含ID选择器
      if (commonParentPath.includes('#')) {
        const idMatch = commonParentPath.match(/#([^>\s]+)/);
        if (idMatch) {
          commonParentElement = document.getElementById(idMatch[1]);
        }
      }

      // 如果没有找到，尝试通过CSS选择器定位
      if (!commonParentElement) {
        try {
          commonParentElement = document.querySelector(commonParentPath);
        } catch (e) {
          // CSS选择器无效，继续其他策略
        }
      }

      if (commonParentElement) {
        const commonParentCandidates: Element[] = [];

        // 按优先级搜索不同的语义标签
        for (const searchTag of searchTags) {
          const endElements = commonParentElement.querySelectorAll(searchTag);

          for (const endElement of Array.from(endElements)) {
            const isFollowing = startElement.compareDocumentPosition(endElement) & Node.DOCUMENT_POSITION_FOLLOWING;

            // 确保结束元素在起始元素之后
            if (isFollowing) {
              // 类名匹配检查（支持部分匹配）
              if (endClassName) {
                // 支持类名包含匹配：endClassName在元素的类名列表中
                const elementClasses = endElement.className.split(/\s+/);
                const hasMatchingClass = elementClasses.includes(endClassName);

                if (hasMatchingClass) {
                  commonParentCandidates.push(endElement);
                }
              } else {
                commonParentCandidates.push(endElement);
              }
            }
          }

          // 如果找到原始标签的候选，优先使用
          if (searchTag === endTag && commonParentCandidates.length > 0) {
            break;
          }
        }

        candidates.push(...commonParentCandidates);
      }
    } catch (error) {
      // 忽略CSS选择器错误，继续其他策略
    }
  }

  // 策略2: 全文档范围搜索（如果commonParent策略失败）
  if (candidates.length === 0) {

    const globalCandidates: Element[] = [];

    // 按优先级搜索不同的语义标签
    for (const searchTag of searchTags) {
      const allEndElements = document.querySelectorAll(searchTag);

      for (const endElement of Array.from(allEndElements)) {
        // 确保结束元素在起始元素之后
        if (startElement.compareDocumentPosition(endElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
          // 类名匹配检查（支持部分匹配）
          if (endClassName) {
            // 支持类名包含匹配：endClassName在元素的类名列表中
            const elementClasses = endElement.className.split(/\s+/);
            const hasMatchingClass = elementClasses.includes(endClassName);

            if (hasMatchingClass) {
              globalCandidates.push(endElement);
            }
          } else {
            globalCandidates.push(endElement);
          }
        }
      }

      // 如果找到原始标签的候选，优先使用
      if (searchTag === endTag && globalCandidates.length > 0) {
        break;
      }
    }

    candidates.push(...globalCandidates);
  }

  // 策略3: 逐级向上搜索（兜底策略）
  if (candidates.length === 0) {
    let container = startElement.parentElement;
    let searchLevel = 0;

    while (container && searchLevel < 6) { // 限制搜索深度
      const levelCandidates: Element[] = [];

      // 按优先级搜索不同的语义标签
      for (const searchTag of searchTags) {
        const endElements = container.querySelectorAll(searchTag);

        for (const endElement of Array.from(endElements)) {
          // 确保结束元素在起始元素之后
          if (startElement.compareDocumentPosition(endElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
            // 类名匹配检查（支持部分匹配）
            if (endClassName) {
              // 支持类名包含匹配：endClassName在元素的类名列表中
              const elementClasses = endElement.className.split(/\s+/);
              const hasMatchingClass = elementClasses.includes(endClassName);

              if (hasMatchingClass) {
                levelCandidates.push(endElement);
              }
            } else {
              levelCandidates.push(endElement);
            }
          }
        }

        // 如果找到原始标签的候选，优先使用
        if (searchTag === endTag && levelCandidates.length > 0) {
          break;
        }
      }

      candidates.push(...levelCandidates);

      // 如果在当前层找到候选元素，继续向上搜索以获得更多选择
      if (levelCandidates.length > 0 && searchLevel >= 3) {
        break;
      }

      container = container.parentElement;
      searchLevel++;
    }
  }

  // 策略4: 如果有siblingInfo，使用它来定位（优先级较高）
  if (multipleAnchors.siblingInfo) {
    const parent = startElement.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const startIndex = siblings.indexOf(startElement);

      if (startIndex !== -1) {
        const tagPattern = multipleAnchors.siblingInfo.tagPattern.split(',');
        const endTagIndex = tagPattern.lastIndexOf(endTag);

        if (endTagIndex !== -1 && endTagIndex > 0) {
          const targetIndex = startIndex + endTagIndex;
          if (targetIndex < siblings.length) {
            const targetElement = siblings[targetIndex];
            if (targetElement.tagName.toLowerCase() === endTag) {
              // siblingInfo找到的元素优先级最高
              candidates.unshift(targetElement);

            }
          }
        }
      }
    }
  }

  // 去重处理
  const uniqueCandidates = Array.from(new Set(candidates));

  logDebug('L4', `L4找到${uniqueCandidates.length}个结束元素候选`, {
    endTag,
    endClassName,
    candidatesPreview: uniqueCandidates.slice(0, 5).map(el =>
      `${el.tagName}.${el.className}:${el.textContent?.substring(0, 20)}...`,
    ).join(' | '),
  });

  return uniqueCandidates.slice(0, 15); // 增加候选数量限制
}

/**
 * 创建跨元素Range
 */
function createCrossElementRange(startElement: Element, endElement: Element, expectedText: string): Range | null {
  try {
    // 使用更智能的跨元素Range构建策略
    // 基于共同祖先元素进行精确文本匹配

    // 1. 找到共同祖先元素
    const commonAncestor = findCommonAncestor(startElement, endElement);
    if (!commonAncestor) {
      logDebug('L4', 'L4跨元素Range构建失败：无共同祖先');
      return null;
    }

    // 2. 在共同祖先中进行精确文本搜索
    const commonAncestorText = commonAncestor.textContent || '';
    const normalizedExpectedText = normalizeTextForComparison(expectedText);
    const normalizedAncestorText = normalizeTextForComparison(commonAncestorText);

    // 尝试找到期望文本在共同祖先中的位置
    let textIndex = normalizedAncestorText.indexOf(normalizedExpectedText);

    // 如果精确匹配失败，尝试更灵活的匹配策略
    if (textIndex === -1) {
      // 策略1: 尝试匹配期望文本的前半部分和后半部分
      const midPoint = Math.floor(expectedText.length / 2);
      const firstHalf = normalizeTextForComparison(expectedText.substring(0, midPoint));
      const secondHalf = normalizeTextForComparison(expectedText.substring(midPoint));

      const firstIndex = normalizedAncestorText.indexOf(firstHalf);
      if (firstIndex !== -1) {
        const secondIndex = normalizedAncestorText.indexOf(secondHalf, firstIndex);
        if (secondIndex !== -1) {
          textIndex = firstIndex;
          // 重新计算实际的预期长度
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

    // 3. 创建Range基于共同祖先中的文本位置
    const range = createRangeFromTextPosition(commonAncestor, textIndex, expectedText.length);
    if (!range) {
      logDebug('L4', 'L4跨元素Range构建失败：无法创建Range');
      return null;
    }

    // 4. 验证Range的文本内容是否匹配预期
    const rangeText = range.toString();
    const normalizedRangeText = normalizeTextForComparison(rangeText);
    const normalizedExpectedTextForComparison = normalizeTextForComparison(expectedText);

    // 检查基本匹配度
    const similarity = calculateTextSimilarity(normalizedRangeText, normalizedExpectedTextForComparison);

    logDebug('L4', 'L4跨元素Range文本比较', {
      expectedLength: expectedText.length,
      actualLength: rangeText.length,
      similarity: (similarity * 100).toFixed(1) + '%',
      expectedStart: expectedText.substring(0, 30) + '...',
      actualStart: rangeText.substring(0, 30) + '...',
    });

    // 结构匹配模式：降低相似度要求，专注结构正确性
    if (similarity >= 0.3) {
      // 30%以上相似度即可接受，因为我们主要依赖结构匹配
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
 * 标准化文本用于比较
 */
function normalizeTextForComparison(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
}

/**
 * 查找两个元素的共同祖先
 */
function findCommonAncestor(element1: Element, element2: Element): Element | null {
  // 如果是同一个元素，返回其父元素
  if (element1 === element2) {
    return element1.parentElement;
  }

  // 获取element1的所有祖先元素
  const ancestors = new Set<Element>();
  let current: Element | null = element1;

  while (current) {
    ancestors.add(current);
    current = current.parentElement;
  }

  // 在element2的祖先链中查找第一个共同祖先
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
function calculateTextSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1.0;

  const minLength = Math.min(text1.length, text2.length);
  const maxLength = Math.max(text1.length, text2.length);

  if (maxLength === 0) return 0;

  // 计算最长公共前缀
  let commonPrefix = 0;
  for (let i = 0; i < minLength; i++) {
    if (text1[i] === text2[i]) {
      commonPrefix++;
    } else {
      break;
    }
  }

  // 基础相似度（前缀匹配）
  const prefixSimilarity = commonPrefix / maxLength;

  // 长度相似度
  const lengthSimilarity = minLength / maxLength;

  // 包含关系检查
  const containsSimilarity = Math.max(
    text1.includes(text2) ? 0.8 : 0,
    text2.includes(text1) ? 0.8 : 0,
  );

  return Math.max(prefixSimilarity, lengthSimilarity * 0.7, containsSimilarity);
}
