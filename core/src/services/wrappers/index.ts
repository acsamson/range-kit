/**
 * 包装器模块导出
 * 提供对底层功能的高层封装
 */

// 验证器
export { SelectionValidator, type ValidationOptions } from './selection-validator';

// 序列化器包装
export { SelectionSerializerWrapper, type SerializerOptions } from './selection-serializer';

// 恢复器包装
export { SelectionRestorer, type RestorerOptions } from './selection-restorer';

// 高亮器包装
export {
  SelectionHighlighter,
  createHighlighter,
  type HighlighterOptions,
} from './selection-highlighter';

// 文本搜索
export {
  SelectionText,
  type TextSearchOptions,
} from './selection-text';
