/**
 * ===================================================================
 * Layer 4: 结构指纹恢复算法 (结构匹配)
 * ===================================================================
 *
 * 本模块负责基于结构指纹的选区恢复，适用于DOM结构发生变化的场景。
 * 通过结构相似度匹配找到最可能的目标元素，然后进行精确文本匹配。
 *
 * 子模块：
 * - structure-matcher: 结构相似度计算与元素查找
 * - candidate-finder: 结束元素候选搜索策略
 * - cross-element-range: 跨元素选区Range创建与验证
 */

import { SerializedSelection, ContainerConfig, LayerRestoreResult } from '../../../types';
import { applySelectionWithStrictValidation } from '../utils';
import { logDebug, logWarn } from '../../../common/debug';
import { L4_SIMILARITY_THRESHOLDS, L4_CANDIDATE_LIMITS } from '../../../constants';

// 导入子模块
import {
  findElementsByStructure,
  cleanElementText,
  StructureCandidate,
} from './layer4/structure-matcher';
import {
  tryCreateCrossElementRange,
  findExactTextInElement,
} from './layer4/cross-element-range';

/**
 * L4主入口：结构指纹恢复
 */
export function restoreByStructuralFingerprint(
  data: SerializedSelection,
  containerConfig?: ContainerConfig,
): LayerRestoreResult {
  const { restore, text } = data;
  const { fingerprint: structuralFingerprint } = restore;

  // 记录容器配置状态
  if (containerConfig) {
    logDebug('L4', 'L4接收到容器配置', {
      rootNodeId: containerConfig.rootNodeId,
    });
  }

  if (!structuralFingerprint.tagName) {
    logWarn('L4', 'L4失败：结构指纹缺失tagName', {
      reason: '结构指纹必须包含tagName',
    });
    return { success: false };
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
    { minSimilarity: L4_SIMILARITY_THRESHOLDS.HIGH_PRECISION, name: '高精度结构匹配' },
    { minSimilarity: L4_SIMILARITY_THRESHOLDS.MEDIUM, name: '中等结构匹配' },
    { minSimilarity: L4_SIMILARITY_THRESHOLDS.LOOSE, name: '宽松结构匹配' },
    { minSimilarity: L4_SIMILARITY_THRESHOLDS.MINIMUM, name: '最低结构匹配' },
  ];

  for (const strategy of matchingStrategies) {
    logDebug('L4', `L4尝试${strategy.name}策略`, {
      minSimilarity: strategy.minSimilarity,
    });

    const candidates = findElementsByStructure(
      structuralFingerprint,
      strategy.minSimilarity,
      data,
      containerConfig,
    );

    if (candidates.length > 0) {
      logDebug('L4', `L4候选元素：找到${candidates.length}个匹配元素`);

      // 跨元素选区优先策略
      const prioritizedCandidates = prioritizeCrossElementCandidates(candidates, data);

      for (let i = 0; i < Math.min(prioritizedCandidates.length, L4_CANDIDATE_LIMITS.MAX_CANDIDATE_TESTS); i++) {
        const candidate = prioritizedCandidates[i];
        logDebug('L4', `L4测试候选元素 ${i + 1}/${prioritizedCandidates.length}`, {
          similarity: (candidate.similarity * 100).toFixed(1) + '%',
          elementTag: candidate.element.tagName,
          elementPreview: candidate.element.textContent?.substring(0, 50) + '...',
          strategy: strategy.name,
        });

        const result = tryStructuralTextMatching(candidate.element, text, data);
        if (result.success) {
          return result;
        }
      }
    }
  }

  logWarn('L4', 'L4失败：所有结构匹配策略都未成功', {
    reason: '尝试了所有结构相似度阈值',
    totalStrategies: matchingStrategies.length,
  });
  return { success: false };
}

/**
 * 跨元素选区优先策略：优先测试匹配的起始标签
 */
function prioritizeCrossElementCandidates(
  candidates: StructureCandidate[],
  data: SerializedSelection,
): StructureCandidate[] {
  const { multipleAnchors } = data.restore;
  if (!multipleAnchors?.startAnchors?.tagName || !multipleAnchors?.endAnchors?.tagName) {
    return candidates;
  }

  const startTag = multipleAnchors.startAnchors.tagName.toLowerCase();
  const crossElementCandidates = candidates.filter(
    c => c.element.tagName.toLowerCase() === startTag,
  );
  const otherCandidates = candidates.filter(
    c => c.element.tagName.toLowerCase() !== startTag,
  );

  if (crossElementCandidates.length > 0) {
    logDebug('L4', `L4跨元素优先：优先测试${crossElementCandidates.length}个${startTag}元素`, {
      startTag,
      crossElementCount: crossElementCandidates.length,
      otherCount: otherCandidates.length,
    });
    return [...crossElementCandidates, ...otherCandidates];
  }

  return candidates;
}

/**
 * 结构匹配后的精确文本匹配
 */
function tryStructuralTextMatching(
  element: Element,
  text: string,
  data: SerializedSelection,
): LayerRestoreResult {
  const { multipleAnchors, context: textContext } = data.restore;
  // 优先检查是否为跨元素选区
  if (multipleAnchors?.startAnchors && multipleAnchors?.endAnchors) {
    const startTag = multipleAnchors.startAnchors.tagName.toLowerCase();
    const endTag = multipleAnchors.endAnchors.tagName.toLowerCase();
    const elementTag = element.tagName.toLowerCase();

    // 如果当前元素是起始元素，且起始和结束标签不同，说明可能是跨元素选区
    if (elementTag === startTag && startTag !== endTag) {
      const elementText = cleanElementText(element);
      const trimmedText = text.trim();

      let textInElement = false;
      let matchReason = '';

      // 策略1: 检查textContext中的父文本匹配（最准确）
      if (textContext?.parentText) {
        const parentText = textContext.parentText.trim();
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
        parentText: textContext?.parentText,
        expectedStartTag: startTag,
        expectedEndTag: endTag,
      });

      // 只有当起始元素确实包含相关文本时，才尝试跨元素Range构建
      if (textInElement) {
        const crossElementRange = tryCreateCrossElementRange(element, text, data);
        if (crossElementRange) {
          const crossResult = applySelectionWithStrictValidation(
            crossElementRange,
            text,
            'L4-跨元素匹配',
          );
          if (crossResult.success) {
            return crossResult;
          }
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
  if (exactRange) {
    const exactResult = applySelectionWithStrictValidation(exactRange, text, 'L4-精确匹配');
    if (exactResult.success) {
      return exactResult;
    }
  }

  return { success: false };
}
