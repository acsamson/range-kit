import {
  Serializer,
  SerializedSelection,
  AnchorInfo,
  PathInfo,
  MultipleAnchorInfo,
  StructuralFingerprint,
  TextContext,
  ElementAnchor,
  ParentChainItem,
  SiblingPattern,
  TextPosition,
} from '../../types';

/**
 * 生成唯一ID
 */
export function generateUniqueId(): string {
  return `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取元素的完整路径
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

    if (current.className) {
      const classes = current.className.trim().split(/\s+/).filter(cls => cls.length > 0);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }

    // 添加nth-child选择器以确保唯一性
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
    // 找到包含该文本节点的元素
    const parentElement = container.parentElement;
    if (!parentElement) return offset;

    // 计算在该元素中的文本偏移量
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

// 全局ID过滤器函数，允许外部注册
type IdFilterFunction = (element: Element, range: Range) => boolean;
let globalIdFilter: IdFilterFunction | null = null;

// 全局自定义ID配置
let globalCustomIdAttribute: string | null = null;

/**
 * 注册全局ID过滤器（由demo项目调用）
 */
export function registerIdFilter(filter: IdFilterFunction): void {
  globalIdFilter = filter;
}

/**
 * 清除全局ID过滤器
 */
export function clearIdFilter(): void {
  globalIdFilter = null;
}

/**
 * 设置全局自定义ID配置
 */
export function setCustomIdConfig(customIdAttribute?: string): void {
  globalCustomIdAttribute = customIdAttribute || null;
}

/** 元素标识符结果类型 */
interface ElementIdentifier {
  id: string | null;
  customId: string | null;
  attribute?: string;
}

/**
 * 获取元素的标识符（自定义ID或标准ID）
 */
function getElementIdentifier(element: Element): ElementIdentifier {
  const customValue = globalCustomIdAttribute
    ? element.getAttribute(globalCustomIdAttribute)
    : null;

  return {
    id: element.id || null,
    customId: customValue,
    ...(customValue && globalCustomIdAttribute && { attribute: globalCustomIdAttribute }),
  };
}

/**
 * 提取ID锚点信息
 */
export function extractAnchorInfo(range: Range): AnchorInfo {
  const getElementWithId = (node: Node): { element: Element; id: string | null; customId: string | null; attribute?: string } | null => {
    let current: Node | null = node;
    while (current && current.nodeType !== Node.DOCUMENT_NODE) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as Element;
        const identifiers = getElementIdentifier(element);

        // 根据配置决定使用哪种ID
        const hasStandardId = !!identifiers.id;
        const hasCustomId = !!identifiers.customId;

        if (hasStandardId || hasCustomId) {
          // 通用ID过滤机制：允许外部注册过滤逻辑
          if (globalIdFilter && globalIdFilter(element, range)) {
            // 跳过当前ID，继续向上查找
            current = current.parentNode;
            continue;
          }

          const result: { element: Element; id: string | null; customId: string | null; attribute?: string } = {
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

  // 计算在ID元素内的文本偏移
  const calculateTextOffsetInElement = (container: Node, offset: number, element: Element): number => {
    if (container.nodeType === Node.TEXT_NODE) {
      // 从ID元素开始遍历所有文本节点，计算到当前文本节点的偏移
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
      // 如果是元素节点，需要计算到该元素开始位置的文本偏移
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

    return offset; // 回退值
  };

  const startOffset = startResult ?
    calculateTextOffsetInElement(range.startContainer, range.startOffset, startResult.element) :
    range.startOffset;

  const endOffset = endResult ?
    calculateTextOffsetInElement(range.endContainer, range.endOffset, endResult.element) :
    range.endOffset;

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
      ? node as Element
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

  // 收集重要属性
  const importantAttrs = ['data-id', 'data-key', 'data-testid', 'role', 'type', 'name'];
  importantAttrs.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value) {
      attributes[attr] = value;
    }
  });

  return {
    tagName: element.tagName.toLowerCase(),
    className: element.className,
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
      ? node as Element
      : node.parentElement!;
  };

  const startElement = getContainerElement(range.startContainer);
  const endElement = getContainerElement(range.endContainer);

  // 查找共同父元素
  let commonParent: Element | null = null;
  let current: Element | null = startElement;

  while (current) {
    if (current.contains(endElement)) {
      commonParent = current;
      break;
    }
    current = current.parentElement;
  }

  // 提取兄弟节点信息
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
      className: current.className,
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
      ? node as Element
      : node.parentElement!;
  };

  const element = getContainerElement(range.startContainer);
  const attributes: Record<string, string> = {};

  // 收集结构性属性
  const structuralAttrs = ['data-id', 'data-key', 'data-testid', 'role', 'itemtype', 'itemid'];
  structuralAttrs.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value) {
      attributes[attr] = value;
    }
  });

  // 计算嵌套深度
  let depth = 0;
  let current: Element | null = element;
  while (current && current !== document.documentElement) {
    depth++;
    current = current.parentElement;
  }

  return {
    tagName: element.tagName.toLowerCase(),
    className: element.className,
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

  // 获取选区前后的文本内容
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  // 获取前置文本
  let precedingText = '';
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const fullText = startContainer.textContent || '';
    const beforeText = fullText.substring(0, range.startOffset);
    precedingText = beforeText.slice(-contextLength);
  }

  // 获取后续文本
  let followingText = '';
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const fullText = endContainer.textContent || '';
    const afterText = fullText.substring(range.endOffset);
    followingText = afterText.slice(0, contextLength);
  }

  // 获取父元素文本
  const parentElement = startContainer.nodeType === Node.ELEMENT_NODE
    ? startContainer as Element
    : startContainer.parentElement!;
  const parentText = parentElement.textContent || '';

  // 计算文本位置
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
 * 选区序列化器实现
 */
export class SelectionSerializer implements Serializer {
  private contextLength: number;

  constructor(contextLength: number = 50) {
    this.contextLength = contextLength;
  }

  /**
   * 序列化当前选区
   */
  serialize(id?: string): SerializedSelection | null {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

    if (range.collapsed || !range.toString().trim()) {
      return null;
    }

    const selectionId = id || generateUniqueId();
    const timestamp = Date.now();
    const text = range.toString();

    try {
      const anchors = extractAnchorInfo(range);
      const paths = extractPathInfo(range);
      const multipleAnchors = extractMultipleAnchorInfo(range);
      const fingerprint = extractStructuralFingerprint(range);
      const context = extractTextContext(range, this.contextLength);

      return {
        id: selectionId,
        text,
        // 恢复算法数据包装到 restore 对象中
        restore: {
          anchors,
          paths,
          multipleAnchors,
          fingerprint,
          context,
        },
        // runtime 字段不在序列化时生成，恢复成功后由 API 层填充
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 设置上下文长度
   */
  setContextLength(length: number): void {
    this.contextLength = length;
  }

}

/**
 * 创建序列化器工厂函数
 */
export function createSerializer(contextLength?: number): SelectionSerializer {
  return new SelectionSerializer(contextLength);
}
