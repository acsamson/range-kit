import { logInfo, logWarn } from '../debug/logger';

export interface ValidationOptions {
  enabledContainers: string[];
  disabledContainers: string[];
  rootNodeId?: string | undefined;
}

/**
 * 选区验证器 - 负责验证选区和Range是否在有效范围内
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

    // 检查是否在豁免区域内
    if (this.options.disabledContainers.length > 0) {
      for (const selector of this.options.disabledContainers) {
        try {
          if (startElement.closest(selector) || endElement.closest(selector)) {
            logInfo('validation', `选区在豁免区域内: ${selector}`);
            return false;
          }
        } catch (error) {
          logWarn('validation', `无效的豁免区域选择器: ${selector}`, error);
        }
      }
    }

    // 检查是否在生效范围内
    if (this.options.enabledContainers.length > 0) {
      let inEnabledContainer = false;
      for (const selector of this.options.enabledContainers) {
        try {
          if (startElement.closest(selector) && endElement.closest(selector)) {
            inEnabledContainer = true;
            break;
          }
        } catch (error) {
          logWarn('validation', `无效的生效范围选择器: ${selector}`, error);
        }
      }

      if (!inEnabledContainer) {
        logInfo('validation', '选区不在指定的生效范围内');
        return false;
      }
    }

    return true;
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
