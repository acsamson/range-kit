/**
 * ===================================================================
 * Layer 4: 结构匹配器 - 结构相似度计算与元素查找
 * ===================================================================
 */

import { SerializedSelection, ContainerConfig, StructuralFingerprint, ParentChainItem } from '../../../../types';
import { logDebug, logWarn } from '../../../../common/debug';
import { getSemanticTags } from '../../helpers/l4-helpers';
import {
  L4_WEIGHT_ADJUSTMENTS,
  L4_SIMILARITY_WEIGHTS,
  L4_CANDIDATE_LIMITS,
} from '../../../../constants';

/**
 * 结构匹配候选结果
 */
export interface StructureCandidate {
  element: Element;
  similarity: number;
}

/**
 * 根据结构指纹查找相似元素
 * 支持根节点限定: 在指定的根节点内查找而不是整个document
 */
export function findElementsByStructure(
  fingerprint: StructuralFingerprint,
  minSimilarity: number,
  data?: SerializedSelection,
  containerConfig?: ContainerConfig,
): StructureCandidate[] {
  const candidates: StructureCandidate[] = [];

  // 根节点限定: 优先使用指定的 rootNodeId，否则回退到 document（带警告）
  let rootNode: Element | Document = document;
  if (containerConfig?.rootNodeId) {
    const foundNode = document.getElementById(containerConfig.rootNodeId);
    if (!foundNode) {
      logWarn('L4', 'L4警告：指定的根节点不存在，将搜索整个文档', { rootNodeId: containerConfig.rootNodeId });
    } else {
      rootNode = foundNode;
    }
  } else {
    // 仅在开发环境记录警告，生产环境静默
    logDebug('L4', 'L4注意：未指定 rootNodeId，将在整个文档中搜索');
  }

  // 智能标签查找：优先原始标签，然后尝试语义相关标签
  const targetTag = fingerprint.tagName.toLowerCase();
  let elements: Element[] = Array.from(rootNode.querySelectorAll(targetTag));

  // 如果原始标签找不到足够的候选元素，尝试语义相关的标签
  let searchTags = [targetTag];
  if (elements.length === 0) {
    const semanticTags = getSemanticTags(targetTag);
    searchTags = [targetTag, ...semanticTags];

    // 重新查找所有语义相关的元素
    elements = [];
    searchTags.forEach(tag => {
      const tagElements = Array.from(rootNode.querySelectorAll(tag));
      elements.push(...tagElements);
    });

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

    // 跨元素选区特殊加分：如果元素包含textContext中的父文本，给予额外分数
    const elementText = cleanElementText(element);
    if (data?.restore?.context?.parentText) {
      const parentText = data.restore.context.parentText.trim();
      if (parentText && elementText.includes(parentText)) {
        similarity += L4_WEIGHT_ADJUSTMENTS.CROSS_ELEMENT_BONUS;
      }
    }

    // 语义标签降级调整：如果是跨标签匹配，略微降低相似度但仍保持可行性
    const elementTag = element.tagName.toLowerCase();
    if (elementTag !== targetTag) {
      const semanticTags = getSemanticTags(targetTag);
      if (semanticTags.includes(elementTag)) {
        similarity *= L4_WEIGHT_ADJUSTMENTS.SEMANTIC_TAG_PENALTY;
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
export function calculateStructuralSimilarity(element: Element, fingerprint: StructuralFingerprint): number {
  let score = 0;
  let maxScore = 0;

  // 标签匹配 (权重: 2)
  maxScore += 2;
  const elementTag = element.tagName.toLowerCase();
  const targetTag = fingerprint.tagName.toLowerCase();

  if (elementTag === targetTag) {
    score += 2;
  }

  // 类名匹配 (权重: 1)
  maxScore += 1;
  const elementClass = element.className || '';
  const targetClass = fingerprint.className || '';

  if (elementClass === targetClass) {
    score += 1;
  } else if (elementClass && targetClass) {
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
    const depthScore = Math.max(0, 1 - depthDiff / 10);
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
export function getElementDepth(element: Element): number {
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
export function calculateParentChainSimilarity(element: Element, targetParentChain: ParentChainItem[]): number {
  const elementParentChain: { tag: string; className: string }[] = [];
  let current = element.parentElement;

  while (current && elementParentChain.length < Math.max(targetParentChain.length, L4_CANDIDATE_LIMITS.MAX_PARENT_CHAIN_DEPTH)) {
    elementParentChain.push({
      tag: current.tagName.toLowerCase(),
      className: current.className || '',
    });
    current = current.parentElement;
  }

  if (elementParentChain.length === 0 || targetParentChain.length === 0) return 0;

  let totalScore = 0;
  let maxPossibleScore = 0;

  const maxDepth = Math.max(elementParentChain.length, targetParentChain.length);
  for (let i = 0; i < maxDepth; i++) {
    maxPossibleScore += 1;

    if (i < elementParentChain.length && i < targetParentChain.length) {
      const elementParent = elementParentChain[i];
      const targetParent = targetParentChain[i];

      let layerScore = 0;

      if (elementParent.tag === targetParent.tagName?.toLowerCase()) {
        layerScore += 0.7;
      }

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

      totalScore += Math.min(layerScore, 1);
    }
  }

  return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
}

/**
 * 清理元素文本，移除调试信息污染
 */
export function cleanElementText(element: Element): string {
  const rawText = element.textContent || '';
  return rawText
    .replace(/\s+/g, ' ')
    .trim();
}
