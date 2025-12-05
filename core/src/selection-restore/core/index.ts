// 核心模块导出
// 注意：SelectionStorage 已移除，SDK 采用无状态设计
export { SelectionValidator, type ValidationOptions } from './selection-validator';
export { SelectionSerializerWrapper, type SerializerOptions } from './selection-serializer';
export { SelectionRestorer, type RestorerOptions } from './selection-restorer';

// ========== Highlighter 模块（可独立使用） ==========
// SelectionHighlighter 是高亮器的包装类，提供统一接口
// createHighlighter 是工厂函数，支持依赖注入
export {
  SelectionHighlighter,
  createHighlighter,
  type HighlighterOptions,
} from './selection-highlighter';

// ========== TextSearch 模块（可独立使用） ==========
// SelectionText 是文本搜索的核心类
// 可以独立于 SelectionRestore 使用
export {
  SelectionText,
  type TextSearchOptions,
} from './selection-text';
