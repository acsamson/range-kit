/**
 * 核心数据结构类型定义
 */

/**
 * 重叠类型枚举（定义在 types 层，供 common/overlap-detector 使用）
 * 定义了两个Range之间可能的重叠关系
 */
export enum OverlapType {
  /** 无重叠 */
  NO_OVERLAP = 'NO_OVERLAP',
  /** 已存在的选区包含当前选区 */
  EXISTING_CONTAINS_CURRENT = 'EXISTING_CONTAINS_CURRENT',
  /** 当前选区包含已存在的选区 */
  CURRENT_CONTAINS_EXISTING = 'CURRENT_CONTAINS_EXISTING',
  /** 部分重叠 */
  PARTIAL_OVERLAP = 'PARTIAL_OVERLAP'
}

/**
 * 单层恢复算法的返回结果
 * 用于替代全局变量 window.__lastRestoredRange 传递 Range 对象
 */
export interface LayerRestoreResult {
  /** 恢复是否成功 */
  success: boolean;
  /** 恢复的 Range 对象（成功时存在） */
  range?: Range;
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

// ========== 新的分层结构 ==========

/**
 * 恢复算法数据
 * 包含 L1-L4 所有恢复算法需要的核心数据
 */
export interface RestoreData {
  /** L1: ID锚点信息 */
  anchors: AnchorInfo;
  /** L2: 路径信息 */
  paths: PathInfo;
  /** L3: 多重锚点信息 */
  multipleAnchors: MultipleAnchorInfo;
  /** L4: 结构指纹信息 */
  fingerprint: StructuralFingerprint;
  /** L4辅助: 文本上下文信息 */
  context: TextContext;
}

/**
 * 运行时状态数据
 * 前端使用，不需要存储到后端
 */
export interface RuntimeData {
  /** 恢复状态 */
  restoreStatus: RestoreStatus;
  /** 成功恢复时命中的算法层级 (1-4) */
  successLayer: number;
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

// 选区类型为字符串类型，支持动态注册
export type SelectionType = string;

// 内置的默认类型（从 constants 重新导出）
export { DEFAULT_SELECTION_TYPE } from '../constants';

/**
 * 序列化选区数据结构
 * 采用分层设计，清晰区分业务标识、恢复数据和运行时状态
 */
export interface SerializedSelection {
  /** 唯一标识符 */
  id: string;
  /** 选中的文本 */
  text: string;
  /** 选区类型 */
  type?: SelectionType;
  /** 恢复算法数据 */
  restore: RestoreData;
  /** 运行时状态（前端用，不存后端） */
  runtime?: RuntimeData;
}

/**
 * 精简选区数据结构（用于后端保存）
 * 只包含恢复算法需要的核心字段
 */
export type SerializedSelectionSimple = Pick<SerializedSelection, 'id' | 'text' | 'type' | 'restore'>

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

// 容器配置
export interface ContainerConfig {
  /** 算法检测的根节点ID - 如果指定，所有路径检测都从该节点开始而不是document */
  rootNodeId?: string;
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
  data?: unknown;
}

// 调试日志条目
export interface DebugLogEntry {
  id: string;
  timestamp: number;
  level: string;
  category: string;
  message: string;
  data?: unknown;
  duration?: number;
  stackTrace?: string;
}

// 工具函数类型
export type ElementPathGenerator = (element: Element) => string;
export type TextSimilarityCalculator = (text1: string, text2: string) => number;
export type StructuralSimilarityCalculator = (element: Element, fingerprint: StructuralFingerprint) => number;
