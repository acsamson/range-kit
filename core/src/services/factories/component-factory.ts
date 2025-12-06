/**
 * 组件工厂
 *
 * 将 SelectionRestore 中的组件实例化逻辑提取到此处，
 * 让 SelectionRestore 只负责协调，不负责构建。
 */

import type { SelectionRestoreOptions, HighlightStyle } from '../../types';
import { DEFAULT_OPTIONS } from '../../constants';

import {
  SelectionValidator,
  SelectionSerializerWrapper,
  SelectionRestorer,
  SelectionHighlighter,
  SelectionText,
} from '../wrappers';
import { SelectionInstanceManager } from '../../manager';

/**
 * 核心组件集合
 */
export interface CoreComponents {
  validator: SelectionValidator;
  serializer: SelectionSerializerWrapper;
  restorer: SelectionRestorer;
  highlighter: SelectionHighlighter;
  textSearcher: SelectionText;
  selectionManager: SelectionInstanceManager;
}

/**
 * 创建核心组件
 *
 * @param options - 配置选项
 * @returns 核心组件集合
 */
export function createCoreComponents(options: Required<SelectionRestoreOptions>): CoreComponents {
  // 1. 验证器
  const validator = new SelectionValidator({
    enabledContainers: options.enabledContainers,
    disabledContainers: options.disabledContainers,
    rootNodeId: options.rootNodeId,
  });

  // 2. 序列化器
  const serializer = new SelectionSerializerWrapper({
    contextLength: options.contextLength,
  });

  // 3. 恢复器
  const restorer = new SelectionRestorer({
    enabledContainers: options.enabledContainers,
    disabledContainers: options.disabledContainers,
    rootNodeId: options.rootNodeId,
  });

  // 4. 高亮器（支持依赖注入）
  let highlighter: SelectionHighlighter;
  if (options.highlighter) {
    highlighter = new SelectionHighlighter({
      highlighter: options.highlighter,
      defaultStyle: options.highlightStyle,
    });
  } else {
    highlighter = new SelectionHighlighter(options.highlightStyle);
  }

  // 5. 文本搜索器
  const textSearcher = new SelectionText();

  // 6. 选区实例管理器
  const selectionManager = new SelectionInstanceManager(
    highlighter.getHighlighter(),
    options,
  );

  return {
    validator,
    serializer,
    restorer,
    highlighter,
    textSearcher,
    selectionManager,
  };
}

/**
 * 合并用户选项与默认选项
 *
 * @param userOptions - 用户提供的选项
 * @returns 完整的选项对象
 */
export function mergeOptions(userOptions: SelectionRestoreOptions = {}): Required<SelectionRestoreOptions> {
  return {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    onSelectionChange: userOptions.onSelectionChange,
    onSelectionInteraction: userOptions.onSelectionInteraction,
    onSelectionComplete: userOptions.onSelectionComplete,
    onSelectionBehavior: userOptions.onSelectionBehavior,
  } as Required<SelectionRestoreOptions>;
}
