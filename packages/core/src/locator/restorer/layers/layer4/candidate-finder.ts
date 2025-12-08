/**
 * ===================================================================
 * Layer 4: 候选元素查找器 - 结束元素候选搜索策略
 * ===================================================================
 */

import { logDebug } from '../../../../common/debug';
import { getSemanticTags } from '../../helpers/l4-helpers';
import { L4_CANDIDATE_LIMITS } from '../../../../constants';
import { MultipleAnchorInfo } from '../../../../types';

/**
 * 查找结束元素候选
 */
export function findEndElementCandidates(startElement: Element, multipleAnchors: MultipleAnchorInfo): Element[] {
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
  findByCommonParent(candidates, startElement, multipleAnchors, searchTags, endTag, endClassName);

  // 策略2: 全文档范围搜索（如果commonParent策略失败）
  if (candidates.length === 0) {
    findByGlobalSearch(candidates, startElement, searchTags, endTag, endClassName);
  }

  // 策略3: 逐级向上搜索（兜底策略）
  if (candidates.length === 0) {
    findByLevelUp(candidates, startElement, searchTags, endTag, endClassName);
  }

  // 策略4: 如果有siblingInfo，使用它来定位（优先级较高）
  if (multipleAnchors.siblingInfo) {
    findBySiblingInfo(candidates, startElement, multipleAnchors, endTag);
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

  return uniqueCandidates.slice(0, L4_CANDIDATE_LIMITS.MAX_END_CANDIDATES);
}

/**
 * 策略1: 基于commonParent查找
 */
function findByCommonParent(
  candidates: Element[],
  startElement: Element,
  multipleAnchors: MultipleAnchorInfo,
  searchTags: string[],
  endTag: string,
  endClassName: string,
): void {
  if (!multipleAnchors.commonParent) return;

  try {
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

      for (const searchTag of searchTags) {
        const endElements = commonParentElement.querySelectorAll(searchTag);

        for (const endElement of Array.from(endElements)) {
          const isFollowing = startElement.compareDocumentPosition(endElement) & Node.DOCUMENT_POSITION_FOLLOWING;

          if (isFollowing) {
            if (endClassName) {
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

/**
 * 策略2: 全文档范围搜索
 */
function findByGlobalSearch(
  candidates: Element[],
  startElement: Element,
  searchTags: string[],
  endTag: string,
  endClassName: string,
): void {
  const globalCandidates: Element[] = [];

  for (const searchTag of searchTags) {
    const allEndElements = document.querySelectorAll(searchTag);

    for (const endElement of Array.from(allEndElements)) {
      if (startElement.compareDocumentPosition(endElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
        if (endClassName) {
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

    if (searchTag === endTag && globalCandidates.length > 0) {
      break;
    }
  }

  candidates.push(...globalCandidates);
}

/**
 * 策略3: 逐级向上搜索
 */
function findByLevelUp(
  candidates: Element[],
  startElement: Element,
  searchTags: string[],
  endTag: string,
  endClassName: string,
): void {
  let container = startElement.parentElement;
  let searchLevel = 0;

  while (container && searchLevel < L4_CANDIDATE_LIMITS.MAX_SEARCH_DEPTH) {
    const levelCandidates: Element[] = [];

    for (const searchTag of searchTags) {
      const endElements = container.querySelectorAll(searchTag);

      for (const endElement of Array.from(endElements)) {
        if (startElement.compareDocumentPosition(endElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
          if (endClassName) {
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

      if (searchTag === endTag && levelCandidates.length > 0) {
        break;
      }
    }

    candidates.push(...levelCandidates);

    if (levelCandidates.length > 0 && searchLevel >= 3) {
      break;
    }

    container = container.parentElement;
    searchLevel++;
  }
}

/**
 * 策略4: 基于siblingInfo定位
 */
function findBySiblingInfo(
  candidates: Element[],
  startElement: Element,
  multipleAnchors: MultipleAnchorInfo,
  endTag: string,
): void {
  const parent = startElement.parentElement;
  if (!parent || !multipleAnchors.siblingInfo) return;

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
          candidates.unshift(targetElement);
        }
      }
    }
  }
}
