/**
 * 选区管理器模块导出
 *
 * 统一导出选区管理器及其相关类型和子模块
 */

// 主管理器
export { SelectionManager } from './selection-manager';

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
