/**
 * 高亮文本交互事件处理器
 * 处理鼠标悬浮、点击等事件
 */

import { logDebug, logWarn, logInfo } from '../../common/debug';
import { SpatialIndex } from './spatial-index';
// 从共享类型文件导入并重导出（保持向后兼容）
import type { HighlightedRange, HighlightInteractionEvent, HighlightEventHandlerOptions } from './types';
export type { HighlightedRange, HighlightInteractionEvent, HighlightEventHandlerOptions };

// 全局点击防抖计时器
let globalLastClickTime = 0;
const GLOBAL_CLICK_DEBOUNCE_DELAY = 300; // 300ms 内的重复点击会被忽略

/**
 * 设置高亮文本的交互事件处理器
 */
export function setupHighlightInteractionHandlers(
  containers: string[],
  highlightedRanges: HighlightedRange[],
  type: string,
  onInteraction: (event: HighlightInteractionEvent, instance: unknown) => void,
  instance: unknown,
  // eslint-disable-next-line no-unused-vars
  _clearHighlightFn: () => void,
  searchedTexts?: string[], // 原始搜索的文本数组
  registeredTypes?: Map<string, { style?: { cursor?: string } }>, // 注册的类型配置
): () => void {
  // 存储事件监听器的引用，以便后续清理
  const eventListeners = new Map<Element, Map<string, EventListener>>();

  // 创建空间索引以优化性能
  const spatialIndex = new SpatialIndex({
    gridSize: 50, // 50px 网格大小
    enableDebug: false,
  });

  // 批量添加高亮到空间索引
  const startTime = performance.now();
  spatialIndex.addHighlights(highlightedRanges);
  const indexingTime = performance.now() - startTime;

  logInfo('event-handler', '空间索引构建完成', {
    highlightCount: highlightedRanges.length,
    indexingTime: `${indexingTime.toFixed(2)}ms`,
    stats: spatialIndex.getStats(),
  });

  // 为每个容器添加事件委托
  containers.forEach(containerSelector => {
    const containerElements = document.querySelectorAll(containerSelector);
    containerElements.forEach(container => {
      if (!eventListeners.has(container)) {
        eventListeners.set(container, new Map());
      }

      const listeners = eventListeners.get(container)!;

      // 辅助函数：获取重叠的高亮文本（检测所有可能的子串组合）
      const getOverlappingHighlights = (x: number, y: number, currentText: string): string[] => {
        // 获取点击位置的caret range
        // @ts-ignore
        const caretRange = document.caretRangeFromPoint?.(x, y);
        if (!caretRange) {
          return [currentText];
        }

        // 1. 首先找到点击位置的所有Range
        const rangesAtPoint: { range: Range; text: string }[] = [];
        for (const { range, text } of highlightedRanges) {
          try {
            if (range.isPointInRange(caretRange.startContainer, caretRange.startOffset)) {
              rangesAtPoint.push({ range, text });
            }
          } catch (e) {
            // 忽略错误
          }
        }

        // 如果没有找到任何Range，返回当前文本
        if (rangesAtPoint.length === 0) {
          return [currentText];
        }

        // 2. 找到所有相邻的Range，构建完整的连续文本区域
        // 首先找到点击位置Range的边界
        let minStartOffset = Infinity;
        let maxEndOffset = -Infinity;
        let commonContainer: Node | null = null;

        // 找出点击位置所有Range的最小起始和最大结束位置
        for (const { range } of rangesAtPoint) {
          if (range.startContainer === range.endContainer) {
            commonContainer = range.startContainer;
            minStartOffset = Math.min(minStartOffset, range.startOffset);
            maxEndOffset = Math.max(maxEndOffset, range.endOffset);
          }
        }

        // 如果找到了共同容器，扩展到包含所有相邻的Range
        if (commonContainer) {
          // 检查所有高亮Range，找出相邻或重叠的
          for (const { range } of highlightedRanges) {
            if (range.startContainer === commonContainer &&
                range.endContainer === commonContainer) {
              // 检查是否相邻或重叠
              if ((range.startOffset <= maxEndOffset && range.endOffset >= minStartOffset) ||
                  (range.endOffset === minStartOffset) || // 左相邻
                  (range.startOffset === maxEndOffset)) {  // 右相邻
                // 扩展边界
                minStartOffset = Math.min(minStartOffset, range.startOffset);
                maxEndOffset = Math.max(maxEndOffset, range.endOffset);
              }
            }
          }

          // 再次迭代，确保包含所有新发现的相邻Range
          let changed = true;
          while (changed) {
            changed = false;
            for (const { range } of highlightedRanges) {
              if (range.startContainer === commonContainer &&
                  range.endContainer === commonContainer) {
                if ((range.startOffset <= maxEndOffset && range.endOffset >= minStartOffset) ||
                    (range.endOffset === minStartOffset) ||
                    (range.startOffset === maxEndOffset)) {
                  const newMin = Math.min(minStartOffset, range.startOffset);
                  const newMax = Math.max(maxEndOffset, range.endOffset);
                  if (newMin < minStartOffset || newMax > maxEndOffset) {
                    minStartOffset = newMin;
                    maxEndOffset = newMax;
                    changed = true;
                  }
                }
              }
            }
          }
        }

        // 3. 获取完整的连续文本内容
        let fullText = '';
        if (commonContainer && commonContainer.nodeType === Node.TEXT_NODE) {
          const textContent = commonContainer.textContent || '';
          fullText = textContent.substring(minStartOffset, maxEndOffset);
        }

        // 如果没有获取到完整文本，使用点击Range的最大文本
        if (!fullText) {
          let maxRange: Range | null = null;
          let maxRangeText = '';
          for (const { range, text } of rangesAtPoint) {
            if (!maxRange || text.length > maxRangeText.length) {
              maxRange = range;
              maxRangeText = text;
            }
          }
          fullText = maxRangeText;
        }

        // 4. 收集所有匹配的搜索文本
        const overlappingTexts = new Set<string>();

        // 如果有搜索文本列表，找出所有是fullText子串的搜索词
        if (searchedTexts && searchedTexts.length > 0) {
          for (const searchText of searchedTexts) {
            if (fullText.includes(searchText)) {
              overlappingTexts.add(searchText);
            }
          }
        }

        // 同时添加点击位置的所有Range文本
        for (const { text } of rangesAtPoint) {
          overlappingTexts.add(text);
        }

        // 如果没有找到任何重叠文本，至少返回当前点击的文本
        if (overlappingTexts.size === 0) {
          overlappingTexts.add(currentText);
        }

        // 转换为数组并按长度排序（从长到短）
        const result = Array.from(overlappingTexts);
        result.sort((a, b) => b.length - a.length);

        logDebug('event-handler', '重叠检测结果', {
          clickedText: currentText,
          fullText: fullText,
          overlappingTexts: result,
          minOffset: minStartOffset,
          maxOffset: maxEndOffset
        });

        return result;
      };

      // 检查鼠标位置是否在高亮的Range内
      const isPointInHighlightedRangeRaw = (x: number, y: number): { highlightId: string; text: string } | null => {
        // 使用 caretRangeFromPoint 获取鼠标位置的精确Range
        // @ts-ignore - caretRangeFromPoint 在某些浏览器中可能不存在
        const caretRange = document.caretRangeFromPoint?.(x, y);

        // 浏览器兼容性处理
        if (!caretRange) {
          // @ts-ignore - Safari/WebKit 备用方案
          const caretPosition = document.caretPositionFromPoint?.(x, y);
          if (!caretPosition) {
            return null;
          }
          // 创建一个 Range 对象来模拟 caretRange
          const range = document.createRange();
          try {
            range.setStart(caretPosition.offsetNode, caretPosition.offset);
            range.setEnd(caretPosition.offsetNode, caretPosition.offset);
            return isPointInHighlightedRangeRaw(x, y); // 递归调用
          } catch {
            return null;
          }
        }

        // 收集所有匹配的候选项，处理重叠高亮的情况
        const candidates: Array<{ highlightId: string; text: string; precision: number }> = [];

        // 不使用空间索引，因为它不能处理滚动容器
        // 直接检查所有高亮（对于滚动容器，这是更可靠的方法）
        const highlightsToCheck = highlightedRanges;

        logDebug('event-handler', '检查高亮', {
          totalHighlights: highlightedRanges.length,
          actuallyChecking: highlightsToCheck.length,
        });

        for (const { highlightId, range, text } of highlightsToCheck) {
          try {
            // 检查 Range 是否仍然有效
            if (range.collapsed || !range.commonAncestorContainer.isConnected) {
              logWarn('event-handler', 'Range已失效，跳过检测', { highlightId });
              continue;
            }

            // 方法1：使用 isPointInRange 直接检查（最准确）
            if (range.isPointInRange(caretRange.startContainer, caretRange.startOffset)) {
              // 使用 getClientRects() 获取更精确的文本边界
              // getClientRects() 返回每一行文本的精确矩形，而不是整体的边界框
              const rects = range.getClientRects();
              let isInTextBounds = false;

              // 获取容器的边界
              const containerRect = container.getBoundingClientRect();

              // 检查鼠标是否在任何一个文本矩形内
              for (let i = 0; i < rects.length; i++) {
                const rect = rects[i];
                // 添加一个小的容差值（2px）来处理边缘情况
                const tolerance = 2;

                // 检查矩形是否在容器可视区域内
                if (rect.top >= containerRect.top - tolerance &&
                    rect.bottom <= containerRect.bottom + tolerance &&
                    rect.left >= containerRect.left - tolerance &&
                    rect.right <= containerRect.right + tolerance) {
                  // 矩形在容器可视区域内，检查鼠标位置
                  if (x >= rect.left - tolerance && x <= rect.right + tolerance &&
                      y >= rect.top - tolerance && y <= rect.bottom + tolerance) {
                    isInTextBounds = true;
                    break;
                  }
                }
              }

              if (isInTextBounds) {
                // 计算精确度（基于鼠标位置到文本中心的距离）
                let minDistance = Infinity;
                for (let i = 0; i < rects.length; i++) {
                  const rect = rects[i];
                  const centerX = (rect.left + rect.right) / 2;
                  const centerY = (rect.top + rect.bottom) / 2;
                  const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                  minDistance = Math.min(minDistance, distance);
                }

                candidates.push({
                  highlightId,
                  text,
                  precision: 1000 - minDistance, // 距离越近，精确度越高
                });

                logDebug('event-handler', '找到匹配的高亮', {
                  text: text.substring(0, 20) + '...',
                  x,
                  y,
                  highlightId,
                  rectsCount: rects.length,
                  precision: 1000 - minDistance,
                });
              }
            }

            // 备用方案：对于单个文本节点的情况
            if (caretRange.startContainer === range.startContainer &&
                caretRange.startContainer.nodeType === Node.TEXT_NODE) {
              const offset = caretRange.startOffset;
              if (offset >= range.startOffset && offset <= range.endOffset) {
                // 同样使用 getClientRects() 进行精确验证
                const rects = range.getClientRects();
                const containerRect = container.getBoundingClientRect();

                for (let i = 0; i < rects.length; i++) {
                  const rect = rects[i];
                  const tolerance = 2;

                  // 检查矩形是否在容器可视区域内
                  if (rect.top >= containerRect.top - tolerance &&
                      rect.bottom <= containerRect.bottom + tolerance &&
                      rect.left >= containerRect.left - tolerance &&
                      rect.right <= containerRect.right + tolerance &&
                      x >= rect.left - tolerance && x <= rect.right + tolerance &&
                      y >= rect.top - tolerance && y <= rect.bottom + tolerance) {
                    logDebug('event-handler', '通过偏移量匹配找到高亮', {
                      text: text.substring(0, 20) + '...',
                      offset,
                      rangeStart: range.startOffset,
                      rangeEnd: range.endOffset,
                    });
                    candidates.push({
                      highlightId,
                      text,
                      precision: 800, // 备用方案的精确度较低
                    });
                  }
                }
              }
            }
          } catch (error) {
            // Range可能已经失效，忽略错误
            logWarn('event-handler', '检查Range时出错', { error: (error as Error).message });
          }
        }

        // 返回精确度最高的匹配（处理重叠高亮的情况）
        if (candidates.length > 0) {
          const best = candidates.sort((a, b) => b.precision - a.precision)[0];
          return {
            highlightId: best.highlightId,
            text: best.text,
          };
        }

        return null;
      };

      // 直接使用检测函数
      const isPointInHighlightedRange = isPointInHighlightedRangeRaw;

      // 鼠标悬浮事件 - 使用节流和防抖避免频繁触发
      let lastHoveredId: string | null = null;
      let lastCheckTime = 0;
      const THROTTLE_DELAY = 30; // 30ms 节流，更快的响应

      // 获取需要应用的鼠标样式
      const getCursorStyle = (): string => {
        // 使用传入的 registeredTypes 参数
        const typeConfig = registeredTypes?.get(type);

        if (typeConfig?.style?.cursor) {
          return typeConfig.style.cursor;
        }

        // 默认鼠标样式
        return 'pointer';
      };

      const cursorStyle = getCursorStyle();

      const handleMouseMove = (e: MouseEvent) => {
        const now = Date.now();

        // 节流：限制检查频率
        if (now - lastCheckTime < THROTTLE_DELAY) {
          return;
        }
        lastCheckTime = now;

        const highlightInfo = isPointInHighlightedRange(e.clientX, e.clientY);

        // 只在进入新的高亮区域时触发
        if (highlightInfo && highlightInfo.highlightId !== lastHoveredId) {
          lastHoveredId = highlightInfo.highlightId;

          // 更新鼠标样式
          if (container instanceof HTMLElement) {
            container.style.cursor = cursorStyle;
          }

          // 使用辅助函数获取重叠的高亮（包括包含关系）
          const overlappingHighlights = getOverlappingHighlights(e.clientX, e.clientY, highlightInfo.text);

          onInteraction({
            type: 'hover',
            selection: {
              text: highlightInfo.text, // 当前hover的文本
              overlappedTexts: overlappingHighlights, // 始终返回重叠文本数组，即使只有一个
            },
            originalEvent: e,
          }, instance);
        } else if (!highlightInfo && lastHoveredId !== null) {
          // 离开高亮区域时重置
          lastHoveredId = null;

          // 恢复默认鼠标样式
          if (container instanceof HTMLElement) {
            container.style.cursor = '';
          }

          logDebug('event-handler', '离开高亮区域');
        }
      };

      // 点击事件
      const handleClick = (e: MouseEvent) => {
        const now = Date.now();
        // 使用全局防抖：如果距离上次点击时间太短，忽略此次点击
        if (now - globalLastClickTime < GLOBAL_CLICK_DEBOUNCE_DELAY) {
          logDebug('event-handler', '点击事件被全局防抖忽略', {
            timeSinceLastClick: now - globalLastClickTime,
            threshold: GLOBAL_CLICK_DEBOUNCE_DELAY,
          });
          return;
        }
        globalLastClickTime = now;

        const highlightInfo = isPointInHighlightedRange(e.clientX, e.clientY);
        if (highlightInfo) {
          // 查找所有重叠或包含关系的高亮
          const overlappingHighlights: string[] = [];
          const uniqueTexts = new Set<string>();

          // 先找到当前点击的高亮Range
          let currentHighlightRange: Range | null = null;
          for (const { range, text } of highlightedRanges) {
            if (text === highlightInfo.text) {
              try {
                // @ts-ignore
                const caretRange = document.caretRangeFromPoint?.(e.clientX, e.clientY);
                if (caretRange && range.isPointInRange(caretRange.startContainer, caretRange.startOffset)) {
                  currentHighlightRange = range;
                  break;
                }
              } catch (error) {
                // 忽略错误
              }
            }
          }

          // 检查所有高亮的包含关系
          for (const { range, text } of highlightedRanges) {
            try {
              let shouldInclude = false;

              // 1. 检查是否在点击位置
              // @ts-ignore
              const caretRange = document.caretRangeFromPoint?.(e.clientX, e.clientY);
              if (caretRange && range.isPointInRange(caretRange.startContainer, caretRange.startOffset)) {
                shouldInclude = true;
              }

              // 2. 如果有当前高亮Range，检查包含关系
              if (!shouldInclude && currentHighlightRange) {
                try {
                  // 检查是否在同一个容器中
                  const sameContainer = range.commonAncestorContainer === currentHighlightRange.commonAncestorContainer ||
                    range.commonAncestorContainer.contains(currentHighlightRange.commonAncestorContainer) ||
                    currentHighlightRange.commonAncestorContainer.contains(range.commonAncestorContainer);

                  if (sameContainer) {
                    // 检查当前选区是否包含这个选区（父包含子）
                    const currentContainsOther =
                      currentHighlightRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0 &&
                      currentHighlightRange.compareBoundaryPoints(Range.END_TO_END, range) >= 0;

                    // 检查这个选区是否包含当前选区（子包含父）
                    const otherContainsCurrent =
                      range.compareBoundaryPoints(Range.START_TO_START, currentHighlightRange) <= 0 &&
                      range.compareBoundaryPoints(Range.END_TO_END, currentHighlightRange) >= 0;

                    shouldInclude = currentContainsOther || otherContainsCurrent;
                  }
                } catch (e) {
                  // Range不在同一个容器中，忽略
                }
              }

              if (shouldInclude && !uniqueTexts.has(text)) {
                overlappingHighlights.push(text);
                uniqueTexts.add(text);
              }
            } catch (error) {
              // 忽略错误
            }
          }

          logDebug('event-handler', '检测到重叠高亮', {
            clickedText: highlightInfo.text,
            overlappingHighlights,
            count: overlappingHighlights.length,
          });

          // 使用getOverlappingHighlights函数获取重叠文本
          const actualOverlappingHighlights = getOverlappingHighlights(e.clientX, e.clientY, highlightInfo.text);

          onInteraction({
            type: 'click',
            selection: {
              text: highlightInfo.text, // 当前点击的文本
              overlappedTexts: actualOverlappingHighlights, // 始终返回重叠文本数组，即使只有一个
            },
            originalEvent: e,
          }, instance);
        }
      };

      // 双击事件
      const handleDblClick = (e: MouseEvent) => {
        const highlightInfo = isPointInHighlightedRange(e.clientX, e.clientY);
        if (highlightInfo) {
          // 使用辅助函数获取重叠的高亮（包括包含关系）
          const overlappingHighlights = getOverlappingHighlights(e.clientX, e.clientY, highlightInfo.text);

          onInteraction({
            type: 'doubleclick',
            selection: {
              text: highlightInfo.text, // 当前双击的文本
              overlappedTexts: overlappingHighlights, // 始终返回重叠文本数组，即使只有一个
            },
            originalEvent: e,
          }, instance);
        }
      };

      // 右键事件
      const handleContextMenu = (e: MouseEvent) => {
        const highlightInfo = isPointInHighlightedRange(e.clientX, e.clientY);
        if (highlightInfo) {
          // 使用辅助函数获取重叠的高亮（包括包含关系）
          const overlappingHighlights = getOverlappingHighlights(e.clientX, e.clientY, highlightInfo.text);

          onInteraction({
            type: 'contextmenu',
            selection: {
              text: highlightInfo.text, // 当前右键点击的文本
              overlappedTexts: overlappingHighlights, // 始终返回重叠文本数组，即使只有一个
            },
            originalEvent: e,
          }, instance);
        }
      };

      // 添加事件监听器
      container.addEventListener('mousemove', handleMouseMove as EventListener, true);
      container.addEventListener('click', handleClick as EventListener, true);
      container.addEventListener('dblclick', handleDblClick as EventListener, true);
      container.addEventListener('contextmenu', handleContextMenu as EventListener, true);

      // 保存监听器引用
      listeners.set('mousemove', handleMouseMove as EventListener);
      listeners.set('click', handleClick as EventListener);
      listeners.set('dblclick', handleDblClick as EventListener);
      listeners.set('contextmenu', handleContextMenu as EventListener);
    });
  });

  // 返回清理函数
  return () => {
    // 清理所有事件监听器
    eventListeners.forEach((listeners, container) => {
      listeners.forEach((listener, eventType) => {
        container.removeEventListener(eventType, listener, true);
      });

      // 恢复默认鼠标样式
      if (container instanceof HTMLElement) {
        container.style.cursor = '';
      }
    });
    eventListeners.clear();
  };
}
