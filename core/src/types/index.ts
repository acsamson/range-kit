// Range SDK 应用 ID 枚举
export enum RangeSdkAppId {
  COMMON = 0, // 通用应用
  PMS = 1,    // PMS应用
  RANGE_SDK = 1000, // range-sdk 自己的页面
}

// ========== SDK 错误类型定义 ==========

/**
 * SDK 基础错误类
 * 所有 SDK 错误都继承自此类
 */
export class RangeSDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RangeSDKError';
  }
}

/**
 * 选区无效错误
 * 当选区不在有效容器范围内或选区为空时抛出
 */
export class SelectionInvalidError extends RangeSDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SELECTION_INVALID', details);
    this.name = 'SelectionInvalidError';
  }
}

/**
 * 序列化错误
 * 当选区无法被序列化时抛出
 */
export class SerializationError extends RangeSDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SERIALIZATION_FAILED', details);
    this.name = 'SerializationError';
  }
}

/**
 * 恢复错误
 * 当选区无法被恢复时抛出
 */
export class RestoreError extends RangeSDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESTORE_FAILED', details);
    this.name = 'RestoreError';
  }
}

/**
 * 容器未找到错误
 * 当指定的容器元素不存在时抛出
 */
export class ContainerNotFoundError extends RangeSDKError {
  constructor(containerId: string) {
    super(
      `找不到 ID 为 "${containerId}" 的容器元素`,
      'CONTAINER_NOT_FOUND',
      { containerId }
    );
    this.name = 'ContainerNotFoundError';
  }
}

/**
 * 配置错误
 * 当 SDK 配置无效时抛出
 */
export class ConfigurationError extends RangeSDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

// 导出重叠检测相关类型
export { 
  OverlapType, 
  type CoreOverlapResult, 
  type BoundaryComparisons,
  type OverlappedRange as OverlapDetectorOverlappedRange
} from '../selection-restore/helpers/overlap-detector';

// 可序列化的矩形类型（替代 DOMRect）
export interface SerializableRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// 基础选区数据结构
export interface RangeData {
  id: string;
  startContainerPath: string; // DOM节点路径
  startOffset: number;
  endContainerPath: string;
  endOffset: number;
  selectedText: string;
  pageUrl: string;
  timestamp: number;
  rect?: SerializableRect; // 选区位置信息（可序列化）
  contextBefore?: string; // 前置上下文
  contextAfter?: string; // 后置上下文
  contextFingerprint?: any; // 上下文指纹信息，用于精确定位
  // ID锚点信息
  anchorInfo?: {
    id: string; // 锚点元素的ID
    startRelativePath: string; // 从锚点到起始节点的相对路径
    endRelativePath: string; // 从锚点到结束节点的相对路径
  };
  // 新增：多重锚点和结构指纹
  multiAnchorInfo?: {
    primaryAnchor?: AnchorCandidate; // 主锚点
    fallbackAnchors?: AnchorCandidate[]; // 备用锚点
    structuralFingerprint?: StructuralFingerprint; // 结构指纹
  };
  isExistingComment?: boolean; // 标记这是一个已存在的评论
  isNewCommentTrigger?: boolean; // 标记这是新选区触发的评论操作
  isNewlyCreated?: boolean; // 标记这是新创建的话题
}

// 锚点候选信息
export interface AnchorCandidate {
  id: string; // 锚点ID
  tagName: string; // 标签名
  depth: number; // 从选区到锚点的深度
  startRelativePath: string; // 相对路径
  endRelativePath: string;
  reliability: number; // 可靠性评分 (0-100)
  attributes?: Record<string, string>; // 锚点元素的关键属性
}

// 结构指纹信息
export interface StructuralFingerprint {
  // 层级特征
  hierarchyPattern: string[]; // 层级标签序列 ["article", "section", "p"]
  depthFromBody: number; // 距离body的深度

  // 兄弟节点特征
  siblingContext: {
    tagsBefore: string[]; // 前面兄弟节点的标签
    tagsAfter: string[]; // 后面兄弟节点的标签
    totalSiblings: number; // 总兄弟节点数
    positionInSiblings: number; // 在兄弟节点中的位置
  };

  // 内容特征
  contentSignature: {
    textLength: number; // 容器文本长度
    textHash: string; // 文本内容哈希（前100字符）
    hasImages: boolean; // 是否包含图片
    hasLinks: boolean; // 是否包含链接
    uniqueWords: string[]; // 容器中的独特词汇（用于匹配）
  };

  // 属性特征（排除class）
  attributeSignature: {
    hasId: boolean;
    hasDataAttributes: boolean;
    commonAttributes: string[]; // 常见属性名（如role, aria-label等）
  };
}

// 标记类型
export enum MarkType {
  COMMENT = 'comment',
  DICTIONARY = 'dictionary',
  HIGHLIGHT = 'highlight'
}

// 标记数据结构
export interface MarkData extends RangeData {
  type: MarkType;
  userId?: string;
  isPublic: boolean;
  isResolved?: boolean; // 标记是否已解决
  metadata?: Record<string, any>;
  overlappedTexts?: string[]; // 重叠的选区文本列表，用于埋点上报
  isExistingComment?: boolean; // 标记这是已存在的评论
}

// 评论数据结构
export interface CommentData {
  id: string;
  markId: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: number; // 最后修改时间
  createdAt: number; // 创建时间
  parentId?: string; // 回复功能
  isResolved: boolean;
  isPinned: boolean;
  isEdited?: boolean; // 是否已编辑
  reactions?: { [emoji: string]: string[] }; // 表情回应
}

// 自定义按钮
export interface CustomButton {
  label: string;
  icon?: string;
  handler: (rangeData: RangeData) => void;
}

// 悬浮窗配置
export interface PopoverConfig {
  showCopy?: boolean;
  showComment?: boolean;
  showDictionary?: boolean;
  showMore?: boolean;
  showAI?: boolean;
  showTranslate?: boolean;
  showSummary?: boolean;
  showTTS?: boolean;
  customButtons?: CustomButton[];
}

// 组件配置
export interface RangeSDKConfig {
  userId?: string;
  userName?: string;
  enablePersistence: boolean;
  popoverConfig: PopoverConfig;
  permissions: {
    canCreateComment: boolean;
    canEditComment: boolean;
    canDeleteComment: boolean;
    canViewPrivateMarks: boolean;
  };
}

// 高亮样式接口
export interface HighlightStyle {
  backgroundColor?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  opacity?: number;
  boxShadow?: string;
  outline?: string; // 新增：使用outline避免影响布局
  textDecoration?: string; // 新增：使用下划线等文本装饰
  textShadow?: string; // 新增：文本阴影效果
  filter?: string; // 新增：滤镜效果
}

// 基于Range API的高亮器接口
export interface RangeHighlighter {
  /**
   * 高亮选区 - 基于Range API，不修改DOM结构
   * @param range 要高亮的选区
   * @param style 高亮样式
   * @param duration 高亮持续时间（毫秒），0表示持久高亮
   */
  highlightRange(range: Range, style?: HighlightStyle, duration?: number): HighlightInstance;

  /**
   * 清除指定高亮
   * @param instance 高亮实例
   */
  clearHighlight(instance: HighlightInstance): void;

  /**
   * 清除所有高亮
   */
  clearAllHighlights(): void;

  /**
   * 获取当前所有高亮实例
   */
  getAllHighlights(): HighlightInstance[];

  /**
   * 临时高亮选区（带动画效果）
   * @param range 要高亮的选区
   * @param style 高亮样式
   * @param duration 动画持续时间
   */
  flashHighlight(range: Range, style?: HighlightStyle, duration?: number): void;
}

// 高亮实例接口
export interface HighlightInstance {
  id: string; // 高亮实例唯一ID
  range: Range; // 原始选区
  style: HighlightStyle; // 应用的样式
  createdAt: number; // 创建时间
  isPersistent: boolean; // 是否为持久高亮
  metadata?: Record<string, any>; // 额外元数据
}

// 高亮策略枚举
export enum HighlightStrategy {
  // CSS样式策略 - 不修改DOM，仅通过CSS实现
  CSS_OUTLINE = 'css-outline', // 使用outline属性
  CSS_BACKGROUND = 'css-background', // 使用background-image渐变
  CSS_TEXT_SHADOW = 'css-text-shadow', // 使用text-shadow
  CSS_FILTER = 'css-filter', // 使用filter滤镜

  // DOM策略 - 轻量级DOM修改
  MINIMAL_SPAN = 'minimal-span', // 最小化span包装
  RANGE_OVERLAY = 'range-overlay', // 悬浮层覆盖

  // 传统策略 - 完整DOM包装（兼容模式）
  FULL_WRAP = 'full-wrap' // 完整span包装（原有方式）
}

// 高亮配置接口
export interface HighlightConfig {
  strategy: HighlightStrategy; // 高亮策略
  defaultStyle: HighlightStyle; // 默认样式
  maxHighlights: number; // 最大高亮数量
  autoCleanup: boolean; // 自动清理过期高亮
  cleanupInterval: number; // 清理间隔（毫秒）
  zIndex: number; // z-index层级
}

// 事件类型
export interface RangeSDKEvents {
  'range-selected': (data: RangeData) => void;
  'mark-created': (data: MarkData) => void;
  'mark-clicked': (data: MarkData) => void;
  'comment-created': (data: CommentData) => void;
  'comment-updated': (data: CommentData) => void;
  'highlight-created': (instance: HighlightInstance) => void;
  'highlight-removed': (instance: HighlightInstance) => void;
  'selection-behavior': (event: import('../selection-restore').SelectionBehaviorEvent) => void;
}
