/**
 * 选区实例管理器模块导出
 *
 * 统一导出选区实例管理器及其相关类型和子模块
 */

// 主管理器 - 内部选区实例管理
// 注意：不再导出 SelectionManager 别名，避免与外层 SelectionManager 冲突
export { SelectionInstanceManager } from './selection-instance-manager';

// 核心注册表和协调器
export { SelectionRegistry } from './selection-registry';
export { StyleRegistry } from './style-registry';
export { SelectionCoordinator } from './selection-coordinator';

// 子模块（按需导出）
export { SelectionInstanceImpl } from './selection-instance';
export { RangeCacheManager } from './cache-manager';
export { InteractionDetector } from './interaction-detector';
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
