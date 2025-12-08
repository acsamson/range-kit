/**
 * 组件工厂
 *
 * 将 SelectionRestore 中的组件实例化逻辑提取到此处，
 * 让 SelectionRestore 只负责协调，不负责构建。
 */

import type { SelectionRestoreOptions, SelectionTypeConfig } from '../../types';
import { DEFAULT_OPTIONS, CORE_ALGORITHM_CONFIG, DEFAULT_HIGHLIGHT_STYLE } from '../../constants';

import {
  SelectionValidator,
  SelectionSerializerWrapper,
  SelectionRestorer,
  SelectionHighlighter,
  SelectionText,
} from '../wrappers';
import { SelectionSession } from '../../session';

/**
 * 核心组件集合
 */
export interface CoreComponents {
  validator: SelectionValidator;
  serializer: SelectionSerializerWrapper;
  restorer: SelectionRestorer;
  highlighter: SelectionHighlighter;
  textSearcher: SelectionText;
  selectionManager: SelectionSession;
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
    rootNodeId: options.rootNodeId,
  });

  // 2. 序列化器 - 使用核心算法配置中的 contextLength
  const serializer = new SelectionSerializerWrapper({
    contextLength: CORE_ALGORITHM_CONFIG.contextLength,
  });

  // 3. 恢复器
  const restorer = new SelectionRestorer({
    rootNodeId: options.rootNodeId,
  });

  // 4. 高亮器
  const highlighter = new SelectionHighlighter(DEFAULT_HIGHLIGHT_STYLE);

  // 5. 文本搜索器
  const textSearcher = new SelectionText();

  // 6. 选区会话管理器
  const selectionManager = new SelectionSession(
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
 * 合并 selectionStyles 配置
 *
 * 合并策略：
 * - 内置只有 'default' 类型作为兜底
 * - 用户传入的类型会添加到列表中
 * - 如果用户传入的类型中包含 'default'，会覆盖内置的默认样式
 *
 * @param userStyles - 用户传入的样式配置
 * @returns 合并后的样式配置
 */
function mergeSelectionStyles(userStyles?: SelectionTypeConfig[]): SelectionTypeConfig[] {
  const defaultStyles = DEFAULT_OPTIONS.selectionStyles;

  if (!userStyles || userStyles.length === 0) {
    return defaultStyles;
  }

  // 检查用户是否覆盖了 default 类型
  const userHasDefault = userStyles.some(s => s.type === 'default');

  if (userHasDefault) {
    // 用户定义了 default，直接使用用户的配置
    return userStyles;
  }

  // 用户没有定义 default，将内置 default 追加到末尾作为兜底
  return [...userStyles, ...defaultStyles];
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
    // 特殊处理 selectionStyles 的合并
    selectionStyles: mergeSelectionStyles(userOptions.selectionStyles),
    onSelectionInteraction: userOptions.onSelectionInteraction,
    onSelectionBehavior: userOptions.onSelectionBehavior,
    onActiveRangesChange: userOptions.onActiveRangesChange,
  } as Required<SelectionRestoreOptions>;
}
