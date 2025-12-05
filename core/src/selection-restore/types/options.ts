/**
 * 配置选项类型定义
 */

import type { SelectionType, RestoreStatus, SelectionStats, SerializedSelection } from './core';
import type {
  SelectionChangeCallback,
  SelectionInteractionCallback,
  SelectionCompleteCallback,
  SelectionBehaviorCallback,
  ActiveRangesChangeCallback,
} from './events';

// 选区高亮样式配置
export interface HighlightStyle {
  /** 背景颜色 */
  backgroundColor?: string;
  /** 文字颜色 */
  color?: string;
  /** 文本装饰 */
  textDecoration?: string;
  /** 文本装饰样式 */
  textDecorationStyle?: string;
  /** 文本装饰颜色 */
  textDecorationColor?: string;
  /** 文本装饰粗细 */
  textDecorationThickness?: string;
  /** 文本下划线偏移 */
  textUnderlineOffset?: string;
  /** 文本阴影 */
  textShadow?: string;
  /** 字体粗细 */
  fontWeight?: string;
  /** 边框样式 (CSS Highlights API不支持，仅用于降级方案) */
  border?: string;
  /** 左侧边框 (CSS Highlights API不支持，仅用于降级方案) */
  borderLeft?: string;
  /** 底部边框 (CSS Highlights API不支持，仅用于降级方案) */
  borderBottom?: string;
  /** 边框圆角 (CSS Highlights API不支持，仅用于降级方案) */
  borderRadius?: string;
  /** 内边距 (CSS Highlights API不支持，仅用于降级方案) */
  padding?: string;
  /** 透明度 */
  opacity?: number;
  /** 动画效果 (CSS Highlights API不支持，仅用于降级方案) */
  transition?: string;
  /** 阴影效果 (CSS Highlights API不支持，仅用于降级方案) */
  boxShadow?: string;
  /** 轮廓 (CSS Highlights API不支持，仅用于降级方案) */
  outline?: string;
  /** 鼠标光标样式 (CSS Highlights API不支持，仅用于降级方案) */
  cursor?: string;
  /** 自定义CSS类名 */
  className?: string;
}

// 选区类型注册信息
export interface SelectionTypeConfig {
  /** 类型标识符 */
  type: string;
  /** 显示名称 */
  label: string;
  /** 类型样式 */
  style: HighlightStyle;
  /** 类型描述 */
  description?: string;
  /** 图标 */
  icon?: string;
}

// 存储模式
export type StorageMode = 'api' | 'memory';

// API存储回调接口
export interface APIStorageHandlers {
  /** 保存选区到服务端 */
  save?: (key: string, data: SerializedSelection) => Promise<void>;
  /** 从服务端获取选区 */
  get?: (key: string) => Promise<SerializedSelection | null>;
  /** 从服务端获取所有选区 */
  getAll?: () => Promise<SerializedSelection[]>;
  /** 从服务端删除选区 */
  delete?: (key: string) => Promise<void>;
  /** 清空服务端所有选区 */
  clear?: () => Promise<void>;
  /** 获取服务端统计信息 */
  getStats?: () => Promise<SelectionStats>;
  /** 更新选区恢复状态 */
  updateRestoreStatus?: (key: string, status: RestoreStatus) => Promise<void>;
  /** 根据URL获取选区 */
  getByUrl?: (url: string) => Promise<SerializedSelection[]>;
  /** 根据内容哈希获取选区 */
  getByContentHash?: (contentHash: string) => Promise<SerializedSelection[]>;
  /** 获取当前页面统计 */
  getCurrentPageStats?: () => Promise<SelectionStats>;
  /** 清理旧数据 */
  cleanupOldData?: (maxAgeInDays: number) => Promise<number>;
  /** 导出数据 */
  exportData?: () => Promise<string>;
  /** 导入数据 */
  importData?: (jsonData: string) => Promise<number>;
}

// 存储配置
export interface StorageConfig {
  /** 存储模式 */
  mode: StorageMode;
  /** API存储处理器（当mode为api时使用） */
  apiHandlers?: APIStorageHandlers;
}

// 存储工厂配置
export interface StorageFactoryConfig {
  /** 存储类型：api（服务端存储）或 memory（内存存储，默认） */
  type: 'api' | 'memory';
  /** API存储处理器（当type为api时使用） */
  apiHandlers?: APIStorageHandlers;
}

// 基础配置选项
export interface SelectionRestoreOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 模糊匹配阈值 (0-1) */
  fuzzyMatchThreshold?: number;
  /** 上下文长度 */
  contextLength?: number;
  /** 启用日志 */
  enableLogging?: boolean;
  /** 自定义选区样式 */
  highlightStyle?: HighlightStyle;
  /** 存储配置 */
  storage?: StorageConfig | StorageFactoryConfig;
  /** 选区生效范围容器选择器数组 - 只有在这些容器内的选区才会被处理 */
  enabledContainers?: string[];
  /** 选区豁免区域选择器数组 - 这些区域内的选区不会被处理 */
  disabledContainers?: string[];
  /** 算法检测的根节点ID - 如果指定，所有路径检测都从该节点开始而不是document */
  rootNodeId?: string;
  /** 默认选区类型 */
  defaultSelectionType?: SelectionType;
  /** 注册的选区类型配置 */
  registeredTypes?: SelectionTypeConfig[];
  /** 选区内容变化监控回调 */
  onSelectionChange?: SelectionChangeCallback;
  /** 选区交互事件回调 */
  onSelectionInteraction?: SelectionInteractionCallback;
  /** 选区完成回调 */
  onSelectionComplete?: SelectionCompleteCallback;
  /** 选区行为监听回调 - 监听容器内发生的选区行为 */
  onSelectionBehavior?: SelectionBehaviorCallback;
  /** 启用选区监控 */
  enableSelectionMonitoring?: boolean;
  /** 监控间隔（毫秒） */
  monitoringInterval?: number;
  /** 自定义ID属性名称（如 'data-selection-id'），用于替代标准ID进行锚点定位 */
  customIdAttribute?: string;
  /** 是否优先使用自定义ID属性而非标准ID */
  preferCustomId?: boolean;
  /** 活跃高亮数量变化回调 - 当 activeRanges 数量变化时触发 */
  onActiveRangesChange?: ActiveRangesChangeCallback;
}
