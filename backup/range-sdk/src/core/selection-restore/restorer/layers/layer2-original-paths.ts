/**
 * ===================================================================
 * Layer 2: DOM路径恢复算法
 * ===================================================================
 */

import { SerializedSelection, ContainerConfig } from '../../types';
import { applySelectionWithStrictValidation, intelligentTextMatch } from '../utils';
import { logDebug, logWarn, logError } from '../../debug/logger';

export function restoreByOriginalPaths(data: SerializedSelection, containerConfig?: ContainerConfig): boolean {
  const { paths, text } = data;

  // 记录容器配置状态
  if (containerConfig) {
    logDebug('L2', 'L2接收到容器配置', {
      enabledContainers: containerConfig.enabledContainers.length,
      disabledContainers: containerConfig.disabledContainers.length,
    });
  }

  logDebug('L2', '🚀 L2算法开始执行', {
    selectionId: data.id,
    textLength: text.length,
    textPreview: text.substring(0, 100) + '...',
    hasStartPath: !!paths.startPath,
    hasEndPath: !!paths.endPath,
    startPath: paths.startPath,
    endPath: paths.endPath,
  });

  if (!text || text.trim().length === 0) {
    logWarn('L2', '❌ L2快速失败：空文本内容', {
      textLength: text.length,
      textContent: text,
    });
    return false;
  }

  if (!paths.startPath || !paths.endPath) {
    logWarn('L2', '❌ L2快速失败：缺少路径信息', {
      startPath: paths.startPath,
      endPath: paths.endPath,
    });
    return false;
  }

  // 根节点限定: 如果指定了rootNodeId，只在该节点内查找
  let rootNode: Element | Document = document;
  if (containerConfig?.rootNodeId) {
    const foundNode = document.getElementById(containerConfig.rootNodeId);
    if (!foundNode) {
      logWarn('L2', '指定的根节点不存在，降级到document', { rootNodeId: containerConfig.rootNodeId });
    } else {
      rootNode = foundNode;
    }
  }

  logDebug('L2', '开始原始路径恢复', {
    startPath: paths.startPath,
    endPath: paths.endPath,
    startOffset: paths.startOffset,
    endOffset: paths.endOffset,
    textLength: text.length,
    rootNodeId: containerConfig?.rootNodeId,
    rootNodeFound: !!rootNode,
  });

  try {
    // 根据路径查找起始和结束节点 - 使用指定的根节点
    const startElement = findElementByPath(paths.startPath, rootNode);
    const endElement = findElementByPath(paths.endPath, rootNode);

    if (!startElement || !endElement) {
      logWarn('L2', '路径查找失败', {
        startElementFound: !!startElement,
        endElementFound: !!endElement,
      });
      return false;
    }

    // 检查是否是跨元素选择
    if (startElement !== endElement) {
      logDebug('L2', '检测到跨元素选择，使用跨元素恢复策略');
      return restoreCrossElementSelection(startElement, endElement, paths, text);
    }

    // 单元素内的选择 - 优先尝试原始偏移量，失败则使用智能文本匹配
    logDebug('L2', '单元素内选择：尝试原始偏移量方式');

    const startPos = findTextNodePosition(startElement, paths.startOffset);
    const endPos = findTextNodePosition(endElement, paths.endOffset);

    if (startPos && endPos) {
      const range = document.createRange();
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);

      // 先验证原始偏移量是否能恢复正确的文本
      if (applySelectionWithStrictValidation(range, text, 'L2')) {
        logDebug('L2', '✅ 原始偏移量恢复成功');
        return true;
      }

      logDebug('L2', '⚠️ 原始偏移量恢复失败，尝试智能文本匹配降级策略');
    } else {
      logDebug('L2', '⚠️ 文本位置查找失败，直接使用智能文本匹配策略');
    }

    // 降级策略：使用智能文本匹配（单元素版本）
    return attemptSingleElementTextMatching(startElement, text);
  } catch (error) {
    logError('L2', '原始路径恢复异常', error);
    return false;
  }
}

/**
 * 通过路径查找元素（支持CSS选择器和XPath）
 * 支持根节点限定: 在指定的根节点内查找而不是整个document
 */
function findElementByPath(path: string, rootNode: Element | Document = document): Element | null {
  try {
    // 尝试CSS选择器
    if (!path.startsWith('/') && !path.startsWith('.//')) {
      return rootNode.querySelector(path);
    }

    // 尝试XPath - 需要使用rootNode作为上下文: 只是作为降级兼容, 不要也可以
    const contextNode = rootNode === document ? document : rootNode;
    const result = document.evaluate(path, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue as Element;
  } catch {
    return null;
  }
}

/**
 * 跨元素选择恢复策略
 */
function restoreCrossElementSelection(
  startElement: Element,
  endElement: Element,
  _paths: any,
  expectedText: string,
): boolean {
  logDebug('L2', '开始跨元素选择恢复', {
    startElement: startElement.tagName,
    endElement: endElement.tagName,
    expectedText: expectedText.substring(0, 20) + '...',
  });

  try {
    // 对于跨元素选择，直接使用智能文本匹配
    // 因为单个元素的offset在跨元素场景下没有意义
    logDebug('L2', '跨元素选择：使用智能文本匹配策略');
    return attemptCrossElementTextMatching(startElement, endElement, expectedText);
  } catch (error) {
    logError('L2', '跨元素选择恢复异常', error);
    return false;
  }
}

/**
 * 单元素文本智能匹配
 */
function attemptSingleElementTextMatching(element: Element, expectedText: string): boolean {
  logDebug('L2', '🔍 单元素智能文本匹配开始', {
    element: element.tagName,
    expectedTextPreview: expectedText.substring(0, 50) + (expectedText.length > 50 ? '...' : ''),
  });

  try {
    const elementText = element.textContent || '';

    // 使用智能文本匹配
    const textIndex = intelligentTextMatch(elementText, expectedText);

    logDebug('L2', '单元素智能匹配结果', {
      textIndex,
      elementTextPreview: elementText.substring(0, 100) + (elementText.length > 100 ? '...' : ''),
      expectedTextPreview: expectedText.substring(0, 50) + (expectedText.length > 50 ? '...' : ''),
      elementTextLength: elementText.length,
      expectedTextLength: expectedText.length,
    });

    if (textIndex === -1) {
      logWarn('L2', '在目标元素中未找到目标文本', {
        elementTextPreview: elementText.substring(0, 100) + '...',
        expectedTextPreview: expectedText.substring(0, 50) + '...',
      });
      return false;
    }

    logDebug('L2', '✅ 找到目标文本位置', { textIndex });

    // 使用TreeWalker在元素中定位精确位置
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let currentOffset = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;
    let node: Node | null = walker.nextNode();
    while (node) {
      const nodeLength = (node.textContent || '').length;

      // 找到起始位置
      if (!startNode && currentOffset <= textIndex && textIndex < currentOffset + nodeLength) {
        startNode = node;
        startOffset = textIndex - currentOffset;
      }

      // 找到结束位置
      const textEndIndex = textIndex + expectedText.length;
      if (!endNode && currentOffset < textEndIndex && textEndIndex <= currentOffset + nodeLength) {
        endNode = node;
        endOffset = textEndIndex - currentOffset;
      }

      currentOffset += nodeLength;
      node = walker.nextNode();

      if (startNode && endNode) break;
    }

    if (!startNode || !endNode) {
      logWarn('L2', '单元素文本匹配：无法定位起始或结束节点');
      return false;
    }

    // 创建Range并验证
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    logDebug('L2', '🎯 单元素智能匹配创建Range', {
      startNodeText: startNode.textContent?.substring(0, 20) + '...',
      startOffset,
      endNodeText: endNode.textContent?.substring(0, 20) + '...',
      endOffset,
    });

    return applySelectionWithStrictValidation(range, expectedText, 'L2');
  } catch (error) {
    logError('L2', '单元素文本匹配异常', error);
    return false;
  }
}

/**
 * 跨元素文本智能匹配
 */
function attemptCrossElementTextMatching(
  startElement: Element,
  endElement: Element,
  expectedText: string,
): boolean {
  logDebug('L2', '尝试跨元素文本智能匹配');

  try {
    // 找到共同父元素
    const commonParent = findCommonParent(startElement, endElement);
    if (!commonParent) {
      logWarn('L2', '无法找到共同父元素');
      return false;
    }

    // 在共同父元素中查找目标文本
    const parentText = commonParent.textContent || '';

    // 使用智能文本匹配
    const textIndex = intelligentTextMatch(parentText, expectedText);

    logDebug('L2', '智能文本匹配结果', {
      textIndex,
      parentTextPreview: parentText.substring(0, 100) + (parentText.length > 100 ? '...' : ''),
      expectedTextPreview: expectedText.substring(0, 50) + (expectedText.length > 50 ? '...' : ''),
      parentTextLength: parentText.length,
      expectedTextLength: expectedText.length,
    });

    if (textIndex === -1) {
      logWarn('L2', '在共同父元素中未找到目标文本', {
        parentTextPreview: parentText.substring(0, 100) + '...',
        expectedTextPreview: expectedText.substring(0, 50) + '...',
      });
      return false;
    }

    logDebug('L2', '找到目标文本位置', { textIndex });

    // 使用TreeWalker在共同父元素中定位精确位置
    const walker = document.createTreeWalker(commonParent, NodeFilter.SHOW_TEXT, null);
    let currentOffset = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;
    let node: Node | null = walker.nextNode();
    while (node) {
      const nodeLength = (node.textContent || '').length;

      // 找到起始位置
      if (!startNode && currentOffset <= textIndex && textIndex < currentOffset + nodeLength) {
        startNode = node;
        startOffset = textIndex - currentOffset;
      }

      // 找到结束位置
      const textEndIndex = textIndex + expectedText.length;
      if (!endNode && currentOffset < textEndIndex && textEndIndex <= currentOffset + nodeLength) {
        endNode = node;
        endOffset = textEndIndex - currentOffset;
      }

      currentOffset += nodeLength;
      node = walker.nextNode();

      if (startNode && endNode) break;
    }

    if (!startNode || !endNode) {
      logWarn('L2', '跨元素文本匹配：无法定位起始或结束节点');
      return false;
    }

    // 创建Range并验证
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    return applySelectionWithStrictValidation(range, expectedText, 'L2');
  } catch (error) {
    logError('L2', '跨元素文本匹配异常', error);
    return false;
  }
}

/**
 * 查找两个元素的最近共同父元素
 */
function findCommonParent(element1: Element, element2: Element): Element | null {
  const parents1 = getParentChain(element1);
  const parents2 = getParentChain(element2);

  for (const parent1 of parents1) {
    if (parents2.includes(parent1)) {
      return parent1;
    }
  }

  return null;
}

/**
 * 获取元素的父级链
 */
function getParentChain(element: Element): Element[] {
  const parents: Element[] = [];
  let current: Element | null = element.parentElement;

  while (current) {
    parents.push(current);
    current = current.parentElement;
  }

  return parents;
}

/**
 * 在元素中查找指定偏移量的文本节点位置
 */
function findTextNodePosition(element: Element, offset: number): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let currentOffset = 0;
  let node: Node | null = walker.nextNode();

  while (node) {
    const nodeLength = (node.textContent || '').length;

    if (currentOffset + nodeLength > offset) {
      return { node, offset: offset - currentOffset };
    }

    currentOffset += nodeLength;
    node = walker.nextNode();
  }

  return null;
}
