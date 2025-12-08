/**
 * 选区验证器
 * 负责验证选区和Range是否在有效范围内
 */

import { logInfo } from '../../common/debug';

export interface ValidationOptions {
  rootNodeId?: string | undefined;
}

/**
 * 选区验证器 - 负责验证选区和Range是否在有效范围内
 *
 * 简化设计：
 * - 通过 rootNodeId 限定作用域
 * - 通过 data-range-exclude 属性标记豁免区域
 */
export class SelectionValidator {
  private options: ValidationOptions;

  constructor(options: ValidationOptions) {
    this.options = options;
  }

  /**
   * 检查选区是否在有效范围内
   */
  isSelectionInValidRange(selection: Selection | null): boolean {
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    return this.isRangeInValidScope(range);
  }

  /**
   * 验证Range是否在有效范围内
   */
  isRangeInValidScope(range: Range): boolean {
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    // 获取包含选区的元素
    const startElement = startContainer.nodeType === Node.TEXT_NODE
      ? startContainer.parentElement
      : startContainer as Element;
    const endElement = endContainer.nodeType === Node.TEXT_NODE
      ? endContainer.parentElement
      : endContainer as Element;

    if (!startElement || !endElement) {
      return false;
    }

    // 检查是否在豁免区域内（使用 data-range-exclude 属性）
    if (this.isInExcludedContainer(startElement) || this.isInExcludedContainer(endElement)) {
      logInfo('validation', '选区在豁免区域内（data-range-exclude）');
      return false;
    }

    // 检查是否在根节点范围内
    if (this.options.rootNodeId) {
      const rootElement = document.getElementById(this.options.rootNodeId);
      if (!rootElement) {
        logInfo('validation', `根节点不存在: ${this.options.rootNodeId}`);
        return false;
      }

      if (!rootElement.contains(startElement) || !rootElement.contains(endElement)) {
        logInfo('validation', '选区不在根节点范围内');
        return false;
      }
    }

    return true;
  }

  /**
   * 检查元素是否在豁免容器内（带有 data-range-exclude 属性）
   */
  private isInExcludedContainer(element: Element): boolean {
    let current: Element | null = element;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-range-exclude')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  /**
   * 更新验证选项
   */
  updateOptions(options: Partial<ValidationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取当前验证选项
   */
  getOptions(): ValidationOptions {
    return { ...this.options };
  }
}
