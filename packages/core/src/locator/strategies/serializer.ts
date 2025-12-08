/**
 * 序列化策略
 *
 * 负责将 Range/Selection 转换为可序列化的 JSON 数据
 * 纯计算函数，无副作用
 */

import type {
  AnchorInfo,
  PathInfo,
  ElementAnchor,
  MultipleAnchorInfo,
  StructuralFingerprint,
  TextContext,
  TextPosition,
  ParentChainItem,
  SiblingPattern,
  SerializedRange,
  RestoreData,
} from '../types';

/**
 * 生成唯一 ID
 */
export function generateUniqueId(): string {
  return `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取元素的完整 CSS 路径
 */
export function getElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(cls => cls.length > 0);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }

    // 添加 nth-child 选择器以确保唯一性
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child =>
        child.tagName === current!.tagName,
      );

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * 获取文本节点在其容器元素中的偏移量
 */
export function getTextOffset(container: Node, offset: number): number {
  if (container.nodeType === Node.TEXT_NODE) {
    const parentElement = container.parentElement;
    if (!parentElement) return offset;

    const walker = document.createTreeWalker(
      parentElement,
      NodeFilter.SHOW_TEXT,
      null,
    );

    let textOffset = 0;
    let node: Node | null;

    while ((node = walker.nextNode())) {
      if (node === container) {
        return textOffset + offset;
      }
      textOffset += node.textContent?.length || 0;
    }

    return offset;
  }

  return offset;
}

// ID 过滤器类型定义
type IdFilterFunction = (element: Element, range: Range) => boolean;

// 模块级别配置
let idFilter: IdFilterFunction | null = null;
let customIdAttribute: string | null = null;

/**
 * 注册 ID 过滤器
 */
export function registerIdFilter(filter: IdFilterFunction): void {
  idFilter = filter;
}

/**
 * 清除 ID 过滤器
 */
export function clearIdFilter(): void {
  idFilter = null;
}

/**
 * 设置自定义 ID 属性配置
 */
export function setCustomIdConfig(attribute?: string): void {
  customIdAttribute = attribute || null;
}

/**
 * 获取元素标识符（标准 ID 或自定义 ID）
 */
function getElementIdentifier(element: Element): {
  id: string | null;
  customId: string | null;
  attribute?: string;
} {
  const customValue = customIdAttribute
    ? element.getAttribute(customIdAttribute)
    : null;

  return {
    id: element.id || null,
    customId: customValue,
    ...(customValue && customIdAttribute && { attribute: customIdAttribute }),
  };
}

/**
 * 提取 ID 锚点信息
 */
export function extractAnchorInfo(range: Range): AnchorInfo {
  const getElementWithId = (node: Node): {
    element: Element;
    id: string | null;
    customId: string | null;
    attribute?: string;
  } | null => {
    let current: Node | null = node;
    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as Element;
        const identifiers = getElementIdentifier(element);

        const hasStandardId = !!identifiers.id;
        const hasCustomId = !!identifiers.customId;

        if (hasStandardId || hasCustomId) {
          if (idFilter && idFilter(element, range)) {
            current = current.parentNode;
            continue;
          }

          const result: {
            element: Element;
            id: string | null;
            customId: string | null;
            attribute?: string;
          } = {
            element,
            id: identifiers.id,
            customId: identifiers.customId,
          };

          if (identifiers.attribute) {
            result.attribute = identifiers.attribute;
          }

          return result;
        }
      }
      current = current.parentNode;
    }
    return null;
  };

  const startResult = getElementWithId(range.startContainer);
  const endResult = getElementWithId(range.endContainer);

  const calculateTextOffsetInElement = (
    container: Node,
    offset: number,
    element: Element,
  ): number => {
    if (container.nodeType === Node.TEXT_NODE) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let textOffset = 0;
      let node: Node | null;

      while ((node = walker.nextNode())) {
        if (node === container) {
          return textOffset + offset;
        }
        textOffset += node.textContent?.length || 0;
      }
    } else if (container.nodeType === Node.ELEMENT_NODE) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let textOffset = 0;
      let nodeCount = 0;
      let node: Node | null;

      while ((node = walker.nextNode())) {
        if (nodeCount === offset) {
          return textOffset;
        }
        textOffset += node.textContent?.length || 0;
        nodeCount++;
      }
    }

    return offset;
  };

  const startOffset = startResult
    ? calculateTextOffsetInElement(range.startContainer, range.startOffset, startResult.element)
    : range.startOffset;

  const endOffset = endResult
    ? calculateTextOffsetInElement(range.endContainer, range.endOffset, endResult.element)
    : range.endOffset;

  const result: AnchorInfo = {
    startId: startResult?.id || null,
    endId: endResult?.id || null,
    startOffset,
    endOffset,
    startCustomId: startResult?.customId || null,
    endCustomId: endResult?.customId || null,
  };

  const customAttribute = startResult?.attribute || endResult?.attribute;
  if (customAttribute) {
    result.customIdAttribute = customAttribute;
  }

  return result;
}

/**
 * 提取路径信息
 */
export function extractPathInfo(range: Range): PathInfo {
  const getContainerElement = (node: Node): Element => {
    return node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement!;
  };

  const startElement = getContainerElement(range.startContainer);
  const endElement = getContainerElement(range.endContainer);

  return {
    startPath: getElementPath(startElement),
    endPath: getElementPath(endElement),
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    startTextOffset: getTextOffset(range.startContainer, range.startOffset),
    endTextOffset: getTextOffset(range.endContainer, range.endOffset),
  };
}

/**
 * 提取元素锚点信息
 */
export function extractElementAnchor(element: Element): ElementAnchor {
  const attributes: Record<string, string> = {};
  const importantAttrs = ['data-id', 'data-key', 'data-testid', 'role', 'type', 'name'];

  importantAttrs.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value) {
      attributes[attr] = value;
    }
  });

  return {
    tagName: element.tagName.toLowerCase(),
    className: typeof element.className === 'string' ? element.className : '',
    id: element.id,
    attributes,
  };
}

/**
 * 提取多重锚点信息
 */
export function extractMultipleAnchorInfo(range: Range): MultipleAnchorInfo {
  const getContainerElement = (node: Node): Element => {
    return node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement!;
  };

  const startElement = getContainerElement(range.startContainer);
  const endElement = getContainerElement(range.endContainer);

  let commonParent: Element | null = null;
  let current: Element | null = startElement;

  while (current) {
    if (current.contains(endElement)) {
      commonParent = current;
      break;
    }
    current = current.parentElement;
  }

  let siblingInfo: { index: number; total: number; tagPattern: string } | null = null;
  if (commonParent && startElement.parentElement === endElement.parentElement) {
    const parent = startElement.parentElement!;
    const siblings = Array.from(parent.children);
    const startIndex = siblings.indexOf(startElement);
    const endIndex = siblings.indexOf(endElement);

    if (startIndex !== -1 && endIndex !== -1) {
      const pattern = siblings
        .slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1)
        .map(el => el.tagName.toLowerCase())
        .join(',');

      siblingInfo = {
        index: startIndex,
        total: siblings.length,
        tagPattern: pattern,
      };
    }
  }

  return {
    startAnchors: extractElementAnchor(startElement),
    endAnchors: extractElementAnchor(endElement),
    commonParent: commonParent ? getElementPath(commonParent) : null,
    siblingInfo,
  };
}

/**
 * 提取父元素链
 */
export function extractParentChain(element: Element): ParentChainItem[] {
  const chain: ParentChainItem[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    chain.push({
      tagName: current.tagName.toLowerCase(),
      className: typeof current.className === 'string' ? current.className : '',
      id: current.id,
    });
    current = current.parentElement;
  }

  return chain;
}

/**
 * 提取兄弟节点模式
 */
export function extractSiblingPattern(element: Element): SiblingPattern | null {
  const parent = element.parentElement;
  if (!parent) return null;

  const siblings = Array.from(parent.children);
  const position = siblings.indexOf(element);

  if (position === -1) return null;

  const beforeTags = siblings
    .slice(Math.max(0, position - 2), position)
    .map(el => el.tagName.toLowerCase());

  const afterTags = siblings
    .slice(position + 1, Math.min(siblings.length, position + 3))
    .map(el => el.tagName.toLowerCase());

  return {
    position,
    total: siblings.length,
    beforeTags,
    afterTags,
  };
}

/**
 * 提取结构指纹信息
 */
export function extractStructuralFingerprint(range: Range): StructuralFingerprint {
  const getContainerElement = (node: Node): Element => {
    return node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement!;
  };

  const element = getContainerElement(range.startContainer);
  const attributes: Record<string, string> = {};

  const structuralAttrs = ['data-id', 'data-key', 'data-testid', 'role', 'itemtype', 'itemid'];
  structuralAttrs.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value) {
      attributes[attr] = value;
    }
  });

  let depth = 0;
  let current: Element | null = element;
  while (current && current !== document.documentElement) {
    depth++;
    current = current.parentElement;
  }

  return {
    tagName: element.tagName.toLowerCase(),
    className: typeof element.className === 'string' ? element.className : '',
    attributes,
    textLength: element.textContent?.length || 0,
    childCount: element.children.length,
    depth,
    parentChain: extractParentChain(element),
    siblingPattern: extractSiblingPattern(element),
  };
}

/**
 * 提取文本上下文信息
 */
export function extractTextContext(range: Range, contextLength: number = 50): TextContext {
  const selectedText = range.toString();
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  let precedingText = '';
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const fullText = startContainer.textContent || '';
    const beforeText = fullText.substring(0, range.startOffset);
    precedingText = beforeText.slice(-contextLength);
  }

  let followingText = '';
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const fullText = endContainer.textContent || '';
    const afterText = fullText.substring(range.endOffset);
    followingText = afterText.slice(0, contextLength);
  }

  const parentElement = startContainer.nodeType === Node.ELEMENT_NODE
    ? (startContainer as Element)
    : startContainer.parentElement!;
  const parentText = parentElement.textContent || '';

  const textPosition: TextPosition = {
    start: parentText.indexOf(selectedText),
    end: parentText.indexOf(selectedText) + selectedText.length,
    totalLength: parentText.length,
  };

  return {
    precedingText,
    followingText,
    parentText,
    textPosition,
  };
}

/**
 * 序列化 Range 为 JSON 数据
 */
export function serializeRange(range: Range, id?: string, contextLength: number = 50): SerializedRange | null {
  if (range.collapsed || !range.toString().trim()) {
    return null;
  }

  const selectionId = id || generateUniqueId();
  const text = range.toString();

  try {
    const anchors = extractAnchorInfo(range);
    const paths = extractPathInfo(range);
    const multipleAnchors = extractMultipleAnchorInfo(range);
    const fingerprint = extractStructuralFingerprint(range);
    const context = extractTextContext(range, contextLength);

    return {
      id: selectionId,
      text,
      restore: {
        anchors,
        paths,
        multipleAnchors,
        fingerprint,
        context,
      },
    };
  } catch {
    return null;
  }
}

/**
 * 序列化当前 Selection 为 JSON 数据
 */
export function serializeSelection(id?: string, contextLength: number = 50): SerializedRange | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  return serializeRange(range, id, contextLength);
}
