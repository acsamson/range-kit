/**
 * Selection Restore TypeScript类型定义
 */

declare global {
  interface Window {
    __lastRestoredRange?: Range;
  }
}


// 序列化选区数据结构（完整版，包含所有信息）
export interface SerializedSelection {
  /** 唯一标识符 */
  id: string;
  /** 选中的文本 */
  text: string;
  /** ID锚点信息 */
  anchors: AnchorInfo;
  /** 路径信息 */
  paths: PathInfo;
  /** 多重锚点信息 */
  multipleAnchors: MultipleAnchorInfo;
  /** 结构指纹信息 */
  structuralFingerprint: StructuralFingerprint;
  /** 文本上下文信息 */
  textContext: TextContext;
  /** 创建时间戳 */
  timestamp?: number;
  /** 选区内容信息（包含多媒体） */
  selectionContent?: SelectionContent;
  /** 元数据信息 */
  metadata?: MetadataInfo;
  /** 恢复状态 */
  restoreStatus?: RestoreStatus;
  /** 成功恢复时命中的算法层级 (1-4) */
  successLayer?: number;
  /** 成功恢复时命中的算法层级名称 */
  successLayerName?: string;
  /** 所属应用名称 */
  appName?: string;
  /** 应用URL（页面URL） */
  appUrl?: string;
  /** 选区内容哈希（用于去重） */
  contentHash?: string;
  /** 选区类型 */
  type?: SelectionType;
  /** 最后更新时间戳 */
  lastUpdated?: number;
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
  /** 启用选区上下文变化监听 - 监听富文本编辑器等动态内容的变化 */
  enableContextChangeMonitoring?: boolean;
  /** 选区上下文变化监听回调 - 当选区所在上下文发生变化时触发 */
  onSelectionContextChange?: SelectionContextChangeCallback;
  /** 选区上下文变化处理策略 - 默认为 'notify-only' */
  contextChangeStrategy?: SelectionContextChangeStrategy;
  /** 上下文变化检测间隔（毫秒），默认500ms */
  contextChangeDetectionInterval?: number;
  /** 启用DOM变化监听 - 使用MutationObserver监听DOM结构变化 */
  enableDOMChangeMonitoring?: boolean;
  /** DOM变化检测的目标容器 - 如果不指定则监听整个document */
  domChangeTargetContainers?: string[];
  /** 活跃高亮数量变化回调 - 当 activeRanges 数量变化时触发 */
  onActiveRangesChange?: ActiveRangesChangeCallback;
}

/**
 * 活跃高亮变化事件
 */
export interface ActiveRangesChangeEvent {
  /** 当前活跃高亮数量 */
  count: number;
  /** 所有活跃高亮的 ID 列表 */
  ids: string[];
}

/**
 * 活跃高亮变化回调
 */
export type ActiveRangesChangeCallback = (event: ActiveRangesChangeEvent) => void;

// 选区类型为字符串类型，支持动态注册
export type SelectionType = string;

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

// 内置的默认类型
export const DEFAULT_SELECTION_TYPE = 'default';

// 选区变化信息
export interface SelectionChangeInfo {
  /** 变化前的选区数据 */
  before: SerializedSelection;
  /** 变化后的选区数据 */
  after: SerializedSelection;
  /** 变化类型 */
  changeType: 'content' | 'position' | 'structure';
  /** 变化详情 */
  details: string;
  /** 变化时间戳 */
  timestamp: number;
  /** 变化程度 (0-1) */
  changeMagnitude: number;
}

// 选区上下文变化监听事件
export interface SelectionContextChangeEvent {
  /** 选区ID */
  selectionId: string;
  /** 变化前的选区数据 */
  before: SerializedSelection;
  /** 变化后尝试恢复的结果 */
  after: {
    /** 恢复是否成功 */
    success: boolean;
    /** 恢复的Range对象（如果成功） */
    range?: Range;
    /** 新的文本内容 */
    text: string;
    /** 如果成功，新的序列化数据 */
    newSerializedData?: SerializedSelection;
    /** 如果失败，错误信息 */
    error?: string;
  };
  /** 变化类型 */
  changeType: 'dom-mutation' | 'content-change' | 'structure-change' | 'checking' | 'no-change' | 'fast-input';
  /** 变化详情 */
  details: string;
  /** 变化时间戳 */
  timestamp: number;
  /** 检测方式 */
  detectionMethod: 'mutation-observer' | 'content-monitor' | 'manual-trigger' | 'fast-detector';
}

// 选区上下文变化处理策略
export type SelectionContextChangeStrategy = 'auto-update' | 'auto-remove' | 'notify-only' | 'custom';

// 选区上下文变化回调
export type SelectionContextChangeCallback = (
  event: SelectionContextChangeEvent,
  instance: SelectionInstance,
  context: {
    /** 更新选区到新位置 */
    updateSelection: (newData?: Partial<SerializedSelection>) => Promise<void>;
    /** 删除当前选区 */
    removeSelection: () => Promise<void>;
    /** 重新序列化当前Range */
    reserializeFromRange: (range: Range) => Promise<SerializedSelection | null>;
    /** 获取SDK实例引用 */
    getSDKInstance: () => SelectionRestoreAPI;
  }
) => Promise<void> | void;

// 选区行为事件类型枚举
export enum SelectionBehaviorType {
  /** 创建新选区 */
  CREATED = 'created',
  /** 选择已有选区 */
  SELECTED = 'selected',
  /** 清除选区 */
  CLEARED = 'cleared',
}

// 重叠类型定义已移至 overlap-detector.ts 中统一管理
import type { OverlapType } from './helpers/overlap-detector';

// 重叠选区信息
export interface OverlappedRange {
  /** 重叠的选区ID */
  selectionId: string;
  /** 重叠的选区文本 */
  text: string;
  /** 重叠类型 */
  overlapType: OverlapType;
  /** 重叠的Range对象 */
  range: Range;
  /** 重叠区域的文本内容 */
  overlappedText: string;
  /** 重叠选区的序列化数据 */
  selectionData: SerializedSelection;
}

// 选区行为事件
export interface SelectionBehaviorEvent {
  /** 行为类型 */
  type: SelectionBehaviorType;
  /** 选中的文本内容 */
  text: string;
  /** 选区位置信息 */
  position?: { x: number; y: number; width: number; height: number };
  /** 事件发生的容器元素 */
  container?: Element;
  /** 当前选区对象（如果有） */
  selection?: Selection | null;
  /** 当前Range对象（如果有） */
  range?: Range | null;
  /** 事件时间戳 */
  timestamp?: number;
  /** 重叠的选区数组 */
  overlappedRanges?: OverlappedRange[];
}

// 选区行为监听回调
export type SelectionBehaviorCallback = (event: SelectionBehaviorEvent) => void;

// 选区交互事件
export interface SelectionInteractionEvent {
  /** 事件类型 */
  type: 'click' | 'hover' | 'contextmenu' | 'doubleclick';
  /** 原始DOM事件 */
  originalEvent: Event;
  /** 选区数据 */
  selection: SerializedSelection;
  /** 点击位置在选区中的偏移 */
  offsetInSelection?: number;
}

// 选区完成事件
export interface SelectionCompleteEvent {
  /** 选区范围 */
  range: Range;
  /** 选区数据 */
  selection: SerializedSelection;
  /** 默认类型 */
  defaultType: SelectionType;
}

// 选区实例接口
export interface SelectionInstance {
  /** 选区ID */
  id: string;
  /** 选区类型 */
  type: SelectionType;
  /** 选区数据 */
  data: SerializedSelection;
  /** 更新选区类型 */
  setType(type: SelectionType): void;
  /** 更新选区数据 */
  updateData(data: Partial<SerializedSelection>): void;
  /** 移除选区 */
  remove(): void;
  /** 获取当前Range */
  getRange(): Range | null;
  /** 重新高亮 */
  rehighlight(): void;
  /** 滚动到选区位置 */
  scrollTo(): void;
}

// 回调函数类型定义
export type SelectionChangeCallback = (changeInfo: SelectionChangeInfo, instance: SelectionInstance) => void;
export type SelectionInteractionCallback = (event: SelectionInteractionEvent, instance: SelectionInstance) => void;
export type SelectionCompleteCallback = (event: SelectionCompleteEvent, instance: SelectionInstance) => void;

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

// ID锚点信息
export interface AnchorInfo {
  /** 起始元素ID */
  startId: string | null;
  /** 结束元素ID */
  endId: string | null;
  /** 起始偏移量 */
  startOffset: number;
  /** 结束偏移量 */
  endOffset: number;
  /** 起始元素自定义标识属性 */
  startCustomId?: string | null;
  /** 结束元素自定义标识属性 */
  endCustomId?: string | null;
  /** 使用的自定义标识属性名 */
  customIdAttribute?: string;
}

// 路径信息
export interface PathInfo {
  /** 起始元素路径 */
  startPath: string;
  /** 结束元素路径 */
  endPath: string;
  /** 起始偏移量 */
  startOffset: number;
  /** 结束偏移量 */
  endOffset: number;
  /** 起始文本偏移量 */
  startTextOffset: number;
  /** 结束文本偏移量 */
  endTextOffset: number;
}

// 元素锚点信息
export interface ElementAnchor {
  /** 标签名 */
  tagName: string;
  /** 类名 */
  className: string;
  /** ID */
  id: string;
  /** 相关属性 */
  attributes: Record<string, string>;
}

// 兄弟节点信息
export interface SiblingInfo {
  /** 索引位置 */
  index: number;
  /** 总数量 */
  total: number;
  /** 标签模式 */
  tagPattern: string;
}

// 多重锚点信息
export interface MultipleAnchorInfo {
  /** 起始锚点 */
  startAnchors: ElementAnchor;
  /** 结束锚点 */
  endAnchors: ElementAnchor;
  /** 共同父元素 */
  commonParent: string | null;
  /** 兄弟节点信息 */
  siblingInfo: SiblingInfo | null;
}

// 父元素链信息
export interface ParentChainItem {
  /** 标签名 */
  tagName: string;
  /** 类名 */
  className: string;
  /** ID */
  id: string;
}

// 兄弟节点模式
export interface SiblingPattern {
  /** 位置 */
  position: number;
  /** 总数 */
  total: number;
  /** 前面的标签 */
  beforeTags: string[];
  /** 后面的标签 */
  afterTags: string[];
}

// 结构指纹信息
export interface StructuralFingerprint {
  /** 标签名 */
  tagName: string;
  /** 类名 */
  className: string;
  /** 属性 */
  attributes: Record<string, string>;
  /** 文本长度 */
  textLength: number;
  /** 子元素数量 */
  childCount: number;
  /** 嵌套深度 */
  depth: number;
  /** 父元素链 */
  parentChain: ParentChainItem[];
  /** 兄弟节点模式 */
  siblingPattern: SiblingPattern | null;
}

// 文本位置信息
export interface TextPosition {
  /** 起始位置 */
  start: number;
  /** 结束位置 */
  end: number;
  /** 总长度 */
  totalLength: number;
}

// 文本上下文信息
export interface TextContext {
  /** 前置文本 */
  precedingText: string;
  /** 后续文本 */
  followingText: string;
  /** 父元素文本 */
  parentText: string;
  /** 文本位置 */
  textPosition: TextPosition;
}

// 多媒体元素信息
export interface MediaInfo {
  /** 媒体类型 */
  type: 'image' | 'video' | 'audio' | 'iframe' | 'video-source' | 'audio-source';
  /** 媒体源地址 */
  src: string;
  /** 替代文本（主要用于图片） */
  alt?: string;
  /** 媒体标题 */
  title?: string;
  /** 其他属性 */
  attributes?: Record<string, string>;
}

// 选区内容信息（包含文本和多媒体）
export interface SelectionContent {
  /** 文本内容 */
  text: string;
  /** 多媒体元素信息 */
  mediaElements: MediaInfo[];
  /** HTML结构摘要 */
  htmlStructure?: string;
}

// 视口信息
export interface ViewportInfo {
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

// 元数据信息
export interface MetadataInfo {
  /** 页面URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** 选区边界信息 */
  selectionBounds: DOMRect;
  /** 视口信息 */
  viewport: ViewportInfo;
  /** 用户代理 */
  userAgent: string;
}

// 恢复状态枚举
export enum RestoreStatus {
  /** 未尝试恢复 */
  PENDING = 'pending',
  /** 恢复成功 */
  SUCCESS = 'success',
  /** 恢复失败 */
  FAILED = 'failed',
  /** 部分恢复 */
  PARTIAL = 'partial'
}

// 恢复结果
export interface RestoreResult {
  /** 是否成功 */
  success: boolean;
  /** 使用的层级 */
  layer: number;
  /** 层级名称 */
  layerName: string;
  /** 错误信息 */
  error?: string;
  /** 恢复时间 */
  restoreTime: number;
  /** 恢复的Range对象（用于CSS Highlights API） */
  range?: Range;
}

// 统计信息
export interface SelectionStats {
  /** 总保存数量 */
  totalSaved: number;
  /** 成功恢复数量 */
  successfulRestores: number;
  /** 失败恢复数量 */
  failedRestores: number;
  /** 成功率 */
  successRate: number;
  /** 各层级统计 */
  layerStats: LayerStats[];
}

// 层级统计
export interface LayerStats {
  /** 层级编号 */
  layer: number;
  /** 层级名称 */
  name: string;
  /** 成功次数 */
  successes: number;
  /** 尝试次数 */
  attempts: number;
  /** 成功率 */
  successRate: number;
}

// 相似度候选元素
export interface SimilarityCandidate {
  /** DOM元素 */
  element: Element;
  /** 相似度评分 */
  similarity: number;
}

// 日志级别
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success'
}

// 日志条目
export interface LogEntry {
  /** 时间戳 */
  timestamp: number;
  /** 日志级别 */
  level: LogLevel;
  /** 消息内容 */
  message: string;
  /** 额外数据 */
  data?: any;
}

// 容器配置
export interface ContainerConfig {
  /** 选区生效范围容器选择器数组 */
  enabledContainers: string[];
  /** 选区豁免区域选择器数组 */
  disabledContainers: string[];
  /** 算法检测的根节点ID - 如果指定，所有路径检测都从该节点开始而不是document */
  rootNodeId?: string;
}

// 恢复层级函数类型
export type RestoreLayerFunction = (data: SerializedSelection, containerConfig?: ContainerConfig) => Promise<boolean> | boolean;

// 序列化器接口
export interface Serializer {
  /** 序列化选区 */
  serialize(id?: string): SerializedSelection | null;
}

// 恢复器接口
export interface Restorer {
  /** 恢复选区 */
  restore(data: SerializedSelection | string): Promise<RestoreResult>;
}

// 存储接口
export interface Storage {
  /** 保存数据 */
  save(key: string, data: SerializedSelection): Promise<void>;
  /** 获取数据 */
  get(key: string): Promise<SerializedSelection | null>;
  /** 获取所有数据 */
  getAll(): Promise<SerializedSelection[]>;
  /** 删除数据 */
  delete(key: string): Promise<void>;
  /** 清空所有数据 */
  clear(): Promise<void>;
  /** 获取统计信息 */
  getStats(): Promise<SelectionStats>;
  /** 更新恢复状态 */
  updateRestoreStatus?(key: string, status: RestoreStatus): Promise<void>;
  /** 根据URL获取选区 */
  getByUrl?(url: string): Promise<SerializedSelection[]>;
  /** 根据内容哈希获取选区 */
  getByContentHash?(contentHash: string): Promise<SerializedSelection[]>;
  /** 获取当前页面统计 */
  getCurrentPageStats?(): Promise<SelectionStats>;
  /** 清理旧数据 */
  cleanupOldData?(maxAgeInDays: number): Promise<number>;
  /** 导出数据 */
  exportData?(): Promise<string>;
  /** 导入数据 */
  importData?(jsonData: string): Promise<number>;
  /** 关闭存储连接 */
  close?(): void;
}

// 高亮器接口
export interface Highlighter {
  /** 高亮选区，返回高亮ID */
  highlight(range: Range, style?: HighlightStyle): string;
  /** 支持类型和滚动控制的高亮选区方法 */
  highlightWithType?(range: Range, type: string, autoScroll?: boolean): string;
  /** 清除所有高亮 */
  clearHighlight(): void;
  /** 清除指定高亮 */
  clearHighlightById?(highlightId: string): void;
  /** 创建高亮样式 */
  createHighlightStyle(style: HighlightStyle): string;
  /** 滚动到指定范围位置 */
  scrollToRange?(range: Range): void;
}

// 主要API接口
export interface DebugLogEntry {
  id: string;
  timestamp: number;
  level: string;
  category: string;
  message: string;
  data?: any;
  duration?: number;
  stackTrace?: string;
}

export interface SelectionRestoreAPI {
  /** 序列化当前选区 */
  serialize(id?: string): Promise<SerializedSelection | null>;
  /** 恢复选区 */
  restore(data: SerializedSelection | string, clearPrevious?: boolean, autoScroll?: boolean): Promise<RestoreResult>;
  /** 恢复选区但不清除之前的高亮 */
  restoreWithoutClear(data: SerializedSelection | string, autoScroll?: boolean): Promise<RestoreResult>;
  /** 获取所有保存的选区 */
  getAllSelections(): Promise<SerializedSelection[]>;
  /** 删除选区 */
  deleteSelection(id: string): Promise<void>;
  /** 更新选区数据 */
  updateSelection(id: string, updates: Partial<SerializedSelection>): Promise<void>;
  /** 导入选区数据到 storage */
  importSelections(selections: SerializedSelection[]): Promise<{
    success: number;
    total: number;
    errors: string[];
  }>;
  /** 清空所有选区 */
  clearAllSelections(): Promise<void>;
  /** 获取统计信息 */
  getStats(): Promise<SelectionStats>;
  /** 设置高亮样式 */
  setHighlightStyle(style: HighlightStyle): void;
  /** 高亮当前选区 */
  highlightSelection(duration?: number): void;
  /** 批量高亮传入的选区数据（使用SDK范围验证） */
  highlightSelections(selections: SerializedSelection[], scrollToIndex?: number): Promise<{
    success: number;
    total: number;
    errors: string[];
    results: Array<{ id: string; success: boolean; layer?: number; layerName?: string; error?: string; }>
  }>;
  /** 批量高亮所有已保存的选区（使用SDK范围验证） */
  highlightAllSelections(scrollToIndex?: number): Promise<{ success: number; total: number; errors: string[] }>;
  /** 清除所有高亮 */
  clearHighlight(): void;
  /** 设置选区生效范围 */
  setEnabledContainers(containers: string[]): void;
  /** 设置选区豁免区域 */
  setDisabledContainers(containers: string[]): void;
  /** 添加生效容器 */
  addEnabledContainer(container: string): void;
  /** 移除生效容器 */
  removeEnabledContainer(container: string): void;
  /** 添加豁免容器 */
  addDisabledContainer(container: string): void;
  /** 移除豁免容器 */
  removeDisabledContainer(container: string): void;
  /** 设置算法检测的根节点ID */
  setRootNodeId(rootNodeId: string | null): void;
  /** 获取当前设置的根节点ID */
  getRootNodeId(): string | undefined;
  /** 启用上下文变化监听 */
  enableContextChangeMonitoring(callback?: SelectionContextChangeCallback): void;
  /** 禁用上下文变化监听 */
  disableContextChangeMonitoring(): void;
  /** 更新上下文变化监听配置 */
  updateContextChangeMonitoringConfig(config: {
    callback?: SelectionContextChangeCallback;
    strategy?: SelectionContextChangeStrategy;
    detectionInterval?: number;
  }): void;
  /** 手动触发选区上下文检查 */
  triggerContextCheck(selectionId?: string): Promise<void>;
  /** 获取上下文变化监听状态 */
  getContextChangeMonitoringStatus(): {
    enabled: boolean;
    activeSelections: string[];
    totalMonitored: number;
    strategy: SelectionContextChangeStrategy;
    detectionInterval: number;
    enableDOMMonitoring: boolean;
  } | null;
  /** 为特定选区启动上下文变化监听 */
  startMonitoringSelection(selectionId: string, selectionData?: SerializedSelection): Promise<void>;
  /** 停止特定选区的上下文变化监听 */
  stopMonitoringSelection(selectionId: string): void;
  /** 批量启动多个选区的上下文变化监听 */
  startMonitoringMultipleSelections(selections: SerializedSelection[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ selectionId: string; error: string; }>;
  }>;
  /** 启用智能防抖队列更新模式 */
  enableSmartDebounce?(): void;
  /** 禁用智能防抖队列更新模式 */
  disableSmartDebounce?(): void;
  /** 获取调试日志 */
  getDebugLogs(): DebugLogEntry[];
  /** 根据分类获取调试日志 */
  getDebugLogsByCategory(category: string): DebugLogEntry[];
  /** 清空调试日志 */
  clearDebugLogs(): void;
  /** 订阅调试日志更新 */
  subscribeToDebugLogs(callback: (entry: DebugLogEntry) => void): () => void;
  /** 导出调试日志 */
  exportDebugLogs(): string;
  /** 根据文本高亮指定容器中的所有匹配文本 */
  highlightTextInContainers(
    text: string | string[],
    type: string,
    containers: string[],
    options?: {
      onInteraction?: (event: SelectionInteractionEvent, instance: any) => void;
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxMatches?: number;
      /** 自定义过滤函数，可用于过滤掉与已有选区重叠的匹配项 */
      filterMatches?: (items: any[], keyword: string) => any[];
    }
  ): Promise<{
    success: number;
    total: number;
    highlightIds: string[];
    errors: string[];
  }>;
  /** 清除指定容器中特定文本的高亮 */
  clearTextHighlights(text?: string, containers?: string[]): void;
  /** 获取当前选区信息 */
  getCurrentSelection(): {
    selection: Selection | null;
    range: Range | null;
    text: string;
    isValid: boolean;
    isEmpty: boolean;
  };
  /** 检查当前是否有有效选区 */
  hasValidSelection(): boolean;
  /** 获取当前选区的文本内容 */
  getCurrentSelectionText(): string;
  /** 获取当前选区的Range对象 */
  getCurrentSelectionRange(): Range | null;
  /** 获取高亮器实例（用于多选区高亮） */
  getHighlighter(): import('./highlighter/css-highlighter').CSSBasedHighlighter;
  /** 检测指定坐标点的所有选区 */
  detectAllSelectionsAtPoint(x: number, y: number): Array<{
    selectionId: string;
    text: string;
    selectionData: SerializedSelection | null;
  }>;
  /** 获取所有保存的选区（精简版本） */
  getAllSelectionsSimple(): Promise<SerializedSelectionSimple[]>;
  /** 注册新的选区类型 */
  registerSelectionType(config: SelectionTypeConfig): void;
  /** 获取已注册的选区类型配置 */
  getRegisteredType(type: string): SelectionTypeConfig | undefined;
  /** 获取所有注册的选区类型配置 */
  getAllRegisteredTypes(): SelectionTypeConfig[];
  /** 仅恢复 Range（不应用高亮） */
  restoreRangeOnly(data: SerializedSelection): Promise<RestoreResult>;
  /** 获取已注册的活跃 Range */
  getActiveRange(selectionId: string): Range | undefined;
  /** 获取所有活跃选区的 ID 列表 */
  getAllActiveSelectionIds(): string[];
  /** 批量高亮所有选区（不滚动） */
  highlightAllSelectionsWithoutScroll(): Promise<{ success: number; total: number; errors: string[] }>;
  /** 批量高亮所有选区（滚动到最后一个） */
  highlightAllSelectionsScrollToLast(): Promise<{ success: number; total: number; errors: string[] }>;
  /** 批量高亮所有选区（滚动到中间） */
  highlightAllSelectionsScrollToMiddle(): Promise<{ success: number; total: number; errors: string[] }>;
  /** 获取当前页面统计信息 */
  getCurrentPageStats(): Promise<SelectionStats>;
  /** 导出所有选区数据为 JSON 字符串 */
  exportData(): Promise<string>;
  /** 从 JSON 字符串导入选区数据 */
  importData(jsonData: string): Promise<number>;
  /** 清理指定天数前的旧数据 */
  cleanupOldData(maxAgeInDays?: number): Promise<number>;
  /** 设置配置选项 */
  setOptions(options: Partial<SelectionRestoreOptions>): void;
  /** 获取当前配置选项 */
  getOptions(): Required<SelectionRestoreOptions>;
  /** 销毁实例 */
  destroy(): void;
}

// 工具函数类型
export type ElementPathGenerator = (element: Element) => string;
export type TextSimilarityCalculator = (text1: string, text2: string) => number;
export type StructuralSimilarityCalculator = (element: Element, fingerprint: StructuralFingerprint) => number;
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

export interface StorageConfig {
  /** 存储模式 */
  mode: StorageMode;
  /** API存储处理器（当mode为api时使用） */
  apiHandlers?: APIStorageHandlers;
}

export interface StorageFactoryConfig {
  /** 存储类型：api（服务端存储）或 memory（内存存储，默认） */
  type: 'api' | 'memory';
  /** API存储处理器（当type为api时使用） */
  apiHandlers?: APIStorageHandlers;
}

// 精简选区数据结构（用于后端保存）- 只包含恢复算法需要的核心字段
export type SerializedSelectionSimple = Pick<SerializedSelection,
  | 'id'
  | 'text'
  | 'type'
  | 'anchors'
  | 'paths'
  | 'multipleAnchors'
  | 'structuralFingerprint'
  | 'textContext'
>
