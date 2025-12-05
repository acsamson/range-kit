/**
 * 选区实例管理器模块导出
 *
 * 统一导出选区实例管理器及其相关类型和子模块
 */

// 主管理器 (重命名以避免与外层 SelectionManager 冲突)
export { SelectionInstanceManager } from './selection-instance-manager';

// 保留旧名称的别名，方便向后兼容
export { SelectionInstanceManager as SelectionManager } from './selection-instance-manager';

// 子模块（按需导出）
export { SelectionInstanceImpl } from './selection-instance';
export { RangeCacheManager } from './cache-manager';
export { InteractionDetector } from './interaction-detector';
export { RangeManager } from './range-manager';
export { ContentMonitor } from './content-monitor';
export { SelectionEventHandlers } from './event-handlers';

// 类型导出
export type {
  CachedRangeInfo,
  ActiveRangesChangeData,
  SelectionManagerContext,
  DetectedSelectionInfo,
} from './types';

export { PERFORMANCE_CONFIG } from './types';
