/**
 * ===================================================================
 * Layer 2: DOM路径恢复算法
 * ===================================================================
 *
 * 职责：精确的 DOM 路径恢复
 * - 使用 CSS 选择器或 XPath 定位元素
 * - 使用原始偏移量恢复选区
 * - 失败时直接返回 { success: false }，由主流程下沉到 L3/L4
 *
 * 注意：L2 不进行文本匹配降级，文本匹配是 L3/L4 的职责
 */

import { SerializedSelection, ContainerConfig, LayerRestoreResult } from '../../types';
import { applySelectionWithStrictValidation } from '../utils';
import { logDebug, logWarn, logError } from '../../debug/logger';

export function restoreByOriginalPaths(data: SerializedSelection, containerConfig?: ContainerConfig): LayerRestoreResult {
  const { restore, text } = data;
  const { paths } = restore;

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
    return { success: false };
  }

  if (!paths.startPath || !paths.endPath) {
    logWarn('L2', '❌ L2快速失败：缺少路径信息', {
      startPath: paths.startPath,
      endPath: paths.endPath,
    });
    return { success: false };
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
      return { success: false };
    }

    // 检查是否是跨元素选择
    if (startElement !== endElement) {
      logDebug('L2', '检测到跨元素选择，使用跨元素恢复策略');
      return restoreCrossElementSelection(startElement, endElement, paths, text);
    }

    // 单元素内的选择 - 使用原始偏移量恢复
    logDebug('L2', '单元素内选择：尝试原始偏移量方式');

    const startPos = findTextNodePosition(startElement, paths.startOffset);
    const endPos = findTextNodePosition(endElement, paths.endOffset);

    if (startPos && endPos) {
      const range = document.createRange();
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);

      // 验证原始偏移量是否能恢复正确的文本
      const result = applySelectionWithStrictValidation(range, text, 'L2');
      if (result.success) {
        logDebug('L2', '✅ 原始偏移量恢复成功');
        return result;
      }

      logWarn('L2', '❌ L2失败：原始偏移量恢复未成功，下沉到L3/L4', {
        rangeText: range.toString().substring(0, 50) + '...',
        expectedText: text.substring(0, 50) + '...',
      });
    } else {
      logWarn('L2', '❌ L2失败：文本位置查找失败，下沉到L3/L4', {
        startOffset: paths.startOffset,
        endOffset: paths.endOffset,
      });
    }

    // L2 专注于精确路径恢复，不做文本匹配降级
    return { success: false };
  } catch (error) {
    logError('L2', '原始路径恢复异常', error);
    return { success: false };
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
 * L2 对跨元素选择只尝试基于原始偏移量的恢复，不做文本匹配
 */
function restoreCrossElementSelection(
  startElement: Element,
  endElement: Element,
  paths: any,
  expectedText: string,
): LayerRestoreResult {
  logDebug('L2', '开始跨元素选择恢复', {
    startElement: startElement.tagName,
    endElement: endElement.tagName,
    expectedText: expectedText.substring(0, 20) + '...',
  });

  try {
    // 尝试使用原始偏移量创建跨元素 Range
    const startPos = findTextNodePosition(startElement, paths.startTextOffset || paths.startOffset);
    const endPos = findTextNodePosition(endElement, paths.endTextOffset || paths.endOffset);

    if (startPos && endPos) {
      const range = document.createRange();
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);

      const result = applySelectionWithStrictValidation(range, expectedText, 'L2');
      if (result.success) {
        logDebug('L2', '✅ 跨元素原始偏移量恢复成功');
        return result;
      }

      logWarn('L2', '❌ L2失败：跨元素偏移量恢复未成功，下沉到L3/L4', {
        rangeText: range.toString().substring(0, 50) + '...',
        expectedText: expectedText.substring(0, 50) + '...',
      });
    } else {
      logWarn('L2', '❌ L2失败：跨元素文本位置查找失败，下沉到L3/L4');
    }

    // L2 专注于精确路径恢复，不做文本匹配降级
    return { success: false };
  } catch (error) {
    logError('L2', '跨元素选择恢复异常', error);
    return { success: false };
  }
}

/**
 * 在元素中查找指定偏移量的文本节点位置
 * 注意：使用 >= 来支持末尾位置（offset 等于文本长度时需要定位到最后一个字符之后）
 */
function findTextNodePosition(element: Element, offset: number): { node: Node; offset: number } | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let currentOffset = 0;
  let node: Node | null = walker.nextNode();

  while (node) {
    const nodeLength = (node.textContent || '').length;

    // 使用 >= 确保 offset 等于累积长度时也能正确定位（用于 Range 末尾位置）
    if (currentOffset + nodeLength >= offset) {
      return { node, offset: offset - currentOffset };
    }

    currentOffset += nodeLength;
    node = walker.nextNode();
  }

  return null;
}
