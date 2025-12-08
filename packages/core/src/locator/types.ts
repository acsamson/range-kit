/**
 * Locator 模块类型定义
 *
 * 负责 Range <-> JSON 的转换
 * 纯计算模块，无副作用，不操作 DOM 样式
 */

/**
 * ID 锚点信息
 */
export interface AnchorInfo {
  /** 起始元素 ID */
  startId: string | null;
  /** 结束元素 ID */
  endId: string | null;
  /** 起始偏移量 */
  startOffset: number;
  /** 结束偏移量 */
  endOffset: number;
  /** 起始自定义 ID */
  startCustomId?: string | null;
  /** 结束自定义 ID */
  endCustomId?: string | null;
  /** 自定义 ID 属性名 */
  customIdAttribute?: string;
}

/**
 * DOM 路径信息
 */
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

/**
 * 元素锚点信息
 */
export interface ElementAnchor {
  /** 标签名 */
  tagName: string;
  /** 类名 */
  className: string;
  /** 元素 ID */
  id: string;
  /** 其他属性 */
  attributes: Record<string, string>;
}

/**
 * 多重锚点信息
 */
export interface MultipleAnchorInfo {
  /** 起始锚点 */
  startAnchors: ElementAnchor;
  /** 结束锚点 */
  endAnchors: ElementAnchor;
  /** 共同父元素路径 */
  commonParent: string | null;
  /** 兄弟节点信息 */
  siblingInfo: {
    index: number;
    total: number;
    tagPattern: string;
  } | null;
}

/**
 * 父元素链项
 */
export interface ParentChainItem {
  /** 标签名 */
  tagName: string;
  /** 类名 */
  className: string;
  /** 元素 ID */
  id: string;
}

/**
 * 兄弟节点模式
 */
export interface SiblingPattern {
  /** 当前位置 */
  position: number;
  /** 总数 */
  total: number;
  /** 之前的标签 */
  beforeTags: string[];
  /** 之后的标签 */
  afterTags: string[];
}

/**
 * 结构指纹信息
 */
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

/**
 * 文本位置信息
 */
export interface TextPosition {
  /** 起始位置 */
  start: number;
  /** 结束位置 */
  end: number;
  /** 总长度 */
  totalLength: number;
}

/**
 * 文本上下文信息
 */
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

/**
 * 恢复数据包
 */
export interface RestoreData {
  /** ID 锚点信息 */
  anchors: AnchorInfo;
  /** DOM 路径信息 */
  paths: PathInfo;
  /** 多重锚点信息 */
  multipleAnchors: MultipleAnchorInfo;
  /** 结构指纹信息 */
  fingerprint: StructuralFingerprint;
  /** 文本上下文信息 */
  context: TextContext;
}

/**
 * 序列化的选区数据
 */
export interface SerializedRange {
  /** 唯一标识符 */
  id: string;
  /** 选区文本 */
  text: string;
  /** 选区类型 */
  type?: string;
  /** 恢复数据 */
  restore: RestoreData;
  /** 时间戳 */
  timestamp?: number;
  /** 运行时数据（恢复成功后填充） */
  runtime?: {
    layer: number;
    restoreTime: number;
  };
}

/**
 * 恢复结果
 */
export interface RestoreResult {
  /** 是否成功 */
  success: boolean;
  /** 恢复层级 */
  layer: number;
  /** 层级名称 */
  layerName: string;
  /** 恢复耗时 */
  restoreTime: number;
  /** 恢复的 Range */
  range?: Range;
  /** 错误信息 */
  error?: string;
}

/**
 * Locator 配置选项
 */
export interface LocatorOptions {
  /** 根节点 ID */
  rootId?: string;
  /** 上下文长度 */
  contextLength?: number;
  /** 自定义 ID 属性 */
  customIdAttribute?: string;
}

/**
 * 容器配置
 */
export interface ContainerConfig {
  /** 根节点 ID */
  rootNodeId?: string;
}

/**
 * Locator 接口
 */
export interface ILocator {
  /**
   * 序列化当前选区
   * @param id - 可选的自定义 ID
   * @returns 序列化的选区数据，失败返回 null
   */
  serialize(id?: string): SerializedRange | null;

  /**
   * 从序列化数据恢复 Range
   * @param data - 序列化的选区数据
   * @returns 恢复结果
   */
  restore(data: SerializedRange): RestoreResult;

  /**
   * 设置配置
   * @param options - 配置选项
   */
  setOptions(options: Partial<LocatorOptions>): void;

  /**
   * 获取当前配置
   */
  getOptions(): LocatorOptions;
}
