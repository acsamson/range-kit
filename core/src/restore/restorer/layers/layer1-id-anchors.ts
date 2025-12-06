/**
 * ===================================================================
 * Layer 1: ID锚点恢复算法 (最高优先级，最精确恢复)
 * ===================================================================`
 */

import { SerializedSelection, ContainerConfig, LayerRestoreResult } from '../../types';
import { applySelectionWithStrictValidation } from '../utils';
import { logDebug, logWarn, logError, logSuccess } from '../../debug/logger';

export function restoreByIdAnchors(data: SerializedSelection, containerConfig?: ContainerConfig): LayerRestoreResult {
  const { restore, text } = data;
  const { anchors } = restore;

  // 记录容器配置状态
  if (containerConfig) {
    logDebug('L1', 'L1接收到容器配置', {
      enabledContainers: containerConfig.enabledContainers.length,
      disabledContainers: containerConfig.disabledContainers.length,
    });
  }

  // 关键信息：记录L1的所有诊断数据（用于问题定位）
  // 根节点限定: 如果指定了rootNodeId，只在该节点内查找
  const rootNode = containerConfig?.rootNodeId ? document.getElementById(containerConfig.rootNodeId) : null;
  if (containerConfig?.rootNodeId && !rootNode) {
    logWarn('L1', '指定的根节点不存在，降级到document查找', { rootNodeId: containerConfig.rootNodeId });
  }

  // 优先使用自定义ID: 例如 data-selection-id 之类
  const getElementByIdentifier = (id: string | null, customId: string | null | undefined, customAttribute?: string): Element | null => {
    // 优先使用自定义ID - 支持从选区数据中读取配置
    const effectiveCustomAttribute = customAttribute || anchors.customIdAttribute;

    if (customId && effectiveCustomAttribute) {
      const customElement = rootNode
        ? rootNode.querySelector(`[${effectiveCustomAttribute}="${customId}"]`) as Element | null
        : document.querySelector(`[${effectiveCustomAttribute}="${customId}"]`) as Element | null;

      if (customElement) {
        logDebug('L1', 'L1找到自定义ID元素', {
          customAttribute: effectiveCustomAttribute,
          customId,
          elementTag: customElement.tagName,
        });
        return customElement;
      }
    }

    // 回退到标准ID
    if (id) {
      const standardElement = rootNode
        ? rootNode.querySelector(`#${id}`) as Element | null
        : document.getElementById(id);

      if (standardElement) {
        logDebug('L1', 'L1找到标准ID元素', {
          id,
          elementTag: standardElement.tagName,
        });
        return standardElement;
      }
    }

    return null;
  };

  const startElement = getElementByIdentifier(
    anchors.startId,
    anchors.startCustomId,
    anchors.customIdAttribute,
  );
  const endElement = getElementByIdentifier(
    anchors.endId,
    anchors.endCustomId,
    anchors.customIdAttribute,
  );

  logDebug('L1', 'L1诊断开始', {
    // 基础数据
    selectionId: data.id,
    textLength: text.length,
    startId: anchors.startId,
    endId: anchors.endId,
    startCustomId: anchors.startCustomId,
    endCustomId: anchors.endCustomId,
    customIdAttribute: anchors.customIdAttribute,
    offsets: `${anchors.startOffset}-${anchors.endOffset}`,
    isSameElement: (anchors.startId === anchors.endId) || (anchors.startCustomId === anchors.endCustomId),

    // 元素状态
    startElementFound: !!startElement,
    endElementFound: !!endElement,
    startElementTextLength: startElement?.textContent?.length || 0,
    endElementTextLength: endElement?.textContent?.length || 0,

    // 偏移量分析
    startOffsetOverflow: anchors.startOffset > (startElement?.textContent?.length || 0),
    endOffsetOverflow: anchors.endOffset > (endElement?.textContent?.length || 0),

    // 快速失败条件
    missingAnchors: (!anchors.startId && !anchors.startCustomId) || (!anchors.endId && !anchors.endCustomId),
    missingElements: !startElement || !endElement,
  });

  if ((!anchors.startId && !anchors.startCustomId) || (!anchors.endId && !anchors.endCustomId) || !startElement || !endElement) {
    logWarn('L1', 'L1快速失败：缺少必要元素', {
      missingStartId: !anchors.startId && !anchors.startCustomId,
      missingEndId: !anchors.endId && !anchors.endCustomId,
      missingStartElement: !startElement,
      missingEndElement: !endElement,
    });
    return { success: false };
  }

  try {
    const range = document.createRange();

    // 文本节点查找函数
    const findTextNode = (element: Element, offset: number): { node: Node; offset: number } | null => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

      let currentOffset = 0;
      let lastValidNode: Node | null = null;
      let lastValidOffset = 0;
      let node: Node | null = walker.nextNode();

      while (node) {
        const nodeLength = (node.textContent || '').length;

        // 精确范围检查
        if (currentOffset <= offset && offset < currentOffset + nodeLength) {
          return { node, offset: offset - currentOffset };
        }

        if (nodeLength > 0) {
          lastValidNode = node;
          lastValidOffset = nodeLength;
        }

        currentOffset += nodeLength;
        node = walker.nextNode();
      }

      // 边界情况处理
      if (offset === currentOffset && lastValidNode) {
        return { node: lastValidNode, offset: lastValidOffset };
      }

      // 偏移量超出时的降级处理
      if (offset > currentOffset) {
        const firstWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        let firstNode = firstWalker.nextNode();
        while (firstNode && !firstNode.textContent?.trim()) {
          firstNode = firstWalker.nextNode();
        }

        if (firstNode) {
          return { node: firstNode, offset: 0 };
        }
      }

      return null;
    };

    // 同元素内选区处理 - 支持标准ID和自定义ID
    const isSameElement = (anchors.startId === anchors.endId && anchors.startId !== null) ||
                         (anchors.startCustomId === anchors.endCustomId && anchors.startCustomId !== null);

    if (isSameElement) {
      const startPos = findTextNode(startElement, anchors.startOffset);
      const endPos = findTextNode(startElement, anchors.endOffset);

      if (startPos && endPos) {
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);

        // 🔥 使用严格文本验证
        const result = applySelectionWithStrictValidation(range, text, 'L1-同元素');
        if (result.success) {
          return result;
        }
      } else {
        logWarn('L1', 'L1同元素文本节点查找失败', {
          startPos: !!startPos,
          endPos: !!endPos,
        });
      }
    } else {
      // 跨元素选区处理
      try {
        // 跨元素偏移量分析和修正
        let adjustedStartOffset = anchors.startOffset;
        let adjustedEndOffset = anchors.endOffset;

        const startElementLength = startElement.textContent?.length || 0;
        const endElementLength = endElement.textContent?.length || 0;

        if (anchors.startOffset > startElementLength || anchors.endOffset > endElementLength) {
          // 构建跨元素文本重新定位
          const combinedText = (startElement.textContent || '') + (endElement.textContent || '');
          const targetTextIndex = combinedText.indexOf(text);

          if (targetTextIndex !== -1) {
            const newStartOffset = targetTextIndex;
            const newEndOffset = targetTextIndex + text.length;

            if (newEndOffset <= startElementLength) {
              // 文本完全在起始元素内
              adjustedStartOffset = newStartOffset;
              adjustedEndOffset = newEndOffset;
            } else if (newStartOffset >= startElementLength) {
              // 文本完全在结束元素内
              adjustedStartOffset = newStartOffset - startElementLength;
              adjustedEndOffset = newEndOffset - startElementLength;
            } else {
              // 文本跨越两个元素
              adjustedStartOffset = newStartOffset;
              adjustedEndOffset = newEndOffset - startElementLength;
            }
          }
        }

        const startPos = findTextNode(startElement, adjustedStartOffset);
        const endPos = findTextNode(endElement, adjustedEndOffset);

        if (startPos && endPos) {
          range.setStart(startPos.node, startPos.offset);
          range.setEnd(endPos.node, endPos.offset);

          // 🔥 跨元素Range智能边界调整 - 创建精确的Range而不依赖Selection API
          let actualText = range.toString();

          // 找到两个元素的共同祖先进行精确处理
          let commonAncestor = startElement.parentElement;
          while (commonAncestor && !commonAncestor.contains(endElement)) {
            commonAncestor = commonAncestor.parentElement;
          }

          if (commonAncestor) {
            // 在共同祖先中搜索并创建精确Range
            const docRange = document.createRange();
            docRange.selectNodeContents(commonAncestor);
            const fullText = docRange.toString();
            const targetIndex = fullText.indexOf(text);

            if (targetIndex !== -1) {
              // 重新在共同祖先中定位
              const walker = document.createTreeWalker(commonAncestor, NodeFilter.SHOW_TEXT, null);
              let currentOffset = 0;
              let startNode = null, endNode = null;
              let startOffset = 0, endOffset = 0;

              let node: Node | null = walker.nextNode();
              while (node) {
                const nodeLength = (node.textContent || '').length;

                // 找到起始位置
                if (!startNode && currentOffset <= targetIndex && targetIndex < currentOffset + nodeLength) {
                  startNode = node;
                  startOffset = targetIndex - currentOffset;
                }

                // 找到结束位置
                if (!endNode && currentOffset <= targetIndex + text.length && targetIndex + text.length <= currentOffset + nodeLength) {
                  endNode = node;
                  endOffset = targetIndex + text.length - currentOffset;
                }

                currentOffset += nodeLength;
                node = walker.nextNode();
                if (startNode && endNode) break;
              }

              if (startNode && endNode) {
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);

                // 🔥 详细的预测试分析 - 直接验证Range而不使用Selection API
                const rangeText = range.toString();

                logDebug('L1', 'L1预测试分析', {
                  Range文本长度: rangeText.length,
                  期望文本长度: text.length,
                  长度差异: rangeText.length - text.length,
                  需要调整: rangeText.length !== text.length,
                  Range文本预览: `"${rangeText.substring(0, 50)}..."`,
                  期望文本预览: `"${text.substring(0, 50)}..."`,
                });

                // 如果Range文本长度不匹配，进行精确调整
                if (rangeText.length !== text.length) {
                  logDebug('L1', 'L1精确调整：移除多余字符', {
                    原始长度: text.length,
                    Range长度: rangeText.length,
                    需移除: rangeText.length - text.length,
                  });

                  // 🔥 修复：在完整的共同祖先中重新查找精确的结束位置
                  const adjustmentWalker = document.createTreeWalker(commonAncestor, NodeFilter.SHOW_TEXT, null);
                  let adjustmentOffset = 0;
                  let adjustmentAttempts = 0;

                  logDebug('L1', 'L1开始精确调整遍历', {
                    目标结束位置: targetIndex + text.length,
                  });

                  let adjustmentNode: Node | null = adjustmentWalker.nextNode();
                  while (adjustmentNode) {
                    const nodeLength = (adjustmentNode.textContent || '').length;
                    const nodeText = adjustmentNode.textContent || '';

                    logDebug('L1', 'L1调整检查节点', {
                      节点文本预览: `"${nodeText.substring(0, 20)}..."`,
                      长度: nodeLength,
                      偏移范围: `[${adjustmentOffset}-${adjustmentOffset + nodeLength}]`,
                    });

                    // 🔥 修复：检查目标结束位置是否在当前节点范围内
                    const targetEndPosition = targetIndex + text.length;

                    if (adjustmentOffset <= targetEndPosition && targetEndPosition <= adjustmentOffset + nodeLength) {
                      const relativeOffset = targetEndPosition - adjustmentOffset;
                      adjustmentAttempts++;

                      // 创建新的Range来测试
                      const testRange = document.createRange();
                      testRange.setStart(startNode, startOffset);
                      testRange.setEnd(adjustmentNode, relativeOffset);
                      const testText = testRange.toString();

                      logDebug('L1', `L1调整尝试${adjustmentAttempts}`, {
                        预期位置: targetEndPosition,
                        设置结束位置: `[${adjustmentOffset}+${relativeOffset}=${targetEndPosition}]`,
                        实际文本长度: testText.length,
                        期望文本长度: text.length,
                        文本匹配: testText === text,
                        文本预览: `"${testText.substring(0, 30)}..."`,
                      });

                      if (testText === text) {
                        range.setEnd(adjustmentNode, relativeOffset);
                        actualText = testText;
                        logSuccess('L1', 'L1精确调整成功');
                        break;
                      }

                      // 🔥 如果精确位置不匹配，尝试向前调整几个字符
                      for (let backtrack = 1; backtrack <= Math.min(5, relativeOffset); backtrack++) {
                        const backtrackOffset = relativeOffset - backtrack;
                        testRange.setEnd(adjustmentNode, backtrackOffset);
                        const backtrackText = testRange.toString();

                        if (backtrackText === text) {
                          range.setEnd(adjustmentNode, backtrackOffset);
                          actualText = backtrackText;
                          logSuccess('L1', 'L1精确调整成功（回退）', {
                            回退字符数: backtrack,
                          });
                          break;
                        }
                      }

                      if (actualText === text) break;
                    }

                    adjustmentOffset += nodeLength;
                    adjustmentNode = adjustmentWalker.nextNode();
                  }

                  if (adjustmentAttempts === 0) {
                    logWarn('L1', 'L1调整失败：未找到目标结束位置', {
                      目标位置: targetIndex + text.length,
                      遍历的总偏移: adjustmentOffset,
                      共同祖先: (commonAncestor as HTMLElement).tagName,
                    });
                  }
                }

                actualText = range.toString();
              }
            }
          }

          // 严格文本
          const crossResult = applySelectionWithStrictValidation(range, text, 'L1-跨元素');
          if (crossResult.success) {
            return crossResult;
          }
        }
      } catch (rangeError: any) {
        logError('L1', 'L1Range处理错误', {
          startElement: (startElement as HTMLElement)?.tagName,
          endElement: (endElement as HTMLElement)?.tagName,
          error: rangeError?.message,
        });
      }
    }
  } catch (error) {
    logError('L1', 'L1代码执行异常', {
      error: (error as Error)?.message,
    });
  }

  return { success: false };
}
