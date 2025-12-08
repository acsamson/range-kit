// ========== 选区类型默认值 ==========

/** 内置的默认选区类型 */
export const DEFAULT_SELECTION_TYPE = 'default';

// ========== L3 多锚点恢复常量 ==========

/** L3 候选元素测试限制 */
export const L3_CANDIDATE_LIMITS = {
  /** 最多尝试的起始元素候选数量 */
  MAX_START_CANDIDATE_ATTEMPTS: 10,
} as const;

/** L3 文本匹配配置 */
export const L3_TEXT_MATCHING = {
  /** 精确匹配前缀长度（高置信度） */
  HIGH_CONFIDENCE_PREFIX_LENGTH: 20,
  /** 中等匹配前缀长度 */
  MEDIUM_CONFIDENCE_PREFIX_LENGTH: 10,
  /** 期望文本字符匹配范围 */
  EXPECTED_TEXT_CHAR_RANGE: 50,
  /** 元素文本字符匹配范围 */
  ELEMENT_TEXT_CHAR_RANGE: 100,
} as const;

/** L3 相似度权重配置 */
export const L3_SIMILARITY_WEIGHTS = {
  /** 文本相似度权重（相对于结构相似度的倍数） */
  TEXT_SIMILARITY_MULTIPLIER: 2,
} as const;

/** L3 类名相似度计算配置 */
export const L3_CLASS_SIMILARITY = {
  /** BEM block 匹配权重 */
  BEM_BLOCK_WEIGHT: 3,
  /** BEM element 匹配权重 */
  BEM_ELEMENT_WEIGHT: 2,
  /** BEM modifier 匹配权重 */
  BEM_MODIFIER_WEIGHT: 1,
  /** 普通类名匹配权重 */
  NORMAL_CLASS_WEIGHT: 1,
  /** 低优先级前缀（这些前缀的类名权重降低） */
  LOW_PRIORITY_PREFIXES: ['js-', 'is-', 'has-', 'u-', 'qa-', 'test-', 'data-'],
  /** 低优先级类名权重系数 */
  LOW_PRIORITY_WEIGHT_FACTOR: 0.3,
} as const;

// ========== L4 结构指纹恢复常量 ==========

/**
 * L4 相似度阈值配置
 * 用于结构匹配时的降级策略，从严格到宽松
 */
export const L4_SIMILARITY_THRESHOLDS = {
  /** 高精度结构匹配 */
  HIGH_PRECISION: 0.8,
  /** 中等结构匹配 */
  MEDIUM: 0.6,
  /** 宽松结构匹配 */
  LOOSE: 0.4,
  /** 最低结构匹配 */
  MINIMUM: 0.2,
} as const;

/**
 * L4 候选元素限制
 * 控制搜索范围以平衡准确性和性能
 */
export const L4_CANDIDATE_LIMITS = {
  /** 最多测试的候选元素数量 */
  MAX_CANDIDATE_TESTS: 15,
  /** 最多返回的结束元素候选数量 */
  MAX_END_CANDIDATES: 15,
  /** 父链搜索最大深度 */
  MAX_SEARCH_DEPTH: 6,
  /** 父链相似度计算最大深度 */
  MAX_PARENT_CHAIN_DEPTH: 8,
} as const;

/**
 * L4 权重调整配置
 * 用于特殊场景下的相似度修正
 */
export const L4_WEIGHT_ADJUSTMENTS = {
  /** 跨元素选区匹配加分（当元素包含 textContext.parentText 时） */
  CROSS_ELEMENT_BONUS: 0.3,
  /** 语义标签降级系数（当使用语义相关但非原始标签时） */
  SEMANTIC_TAG_PENALTY: 0.9,
  /** 跨元素最低相似度阈值（用于跨元素 Range 验证） */
  CROSS_ELEMENT_MIN_SIMILARITY: 0.3,
} as const;

/**
 * L4 结构相似度计算权重
 * 用于 calculateStructuralSimilarity 函数
 */
export const L4_SIMILARITY_WEIGHTS = {
  /** 标签匹配权重 */
  TAG_MATCH: 2,
  /** 类名匹配权重 */
  CLASS_MATCH: 1,
  /** 文本长度相似度权重 */
  TEXT_LENGTH: 3,
  /** DOM 深度匹配权重 */
  DEPTH: 1,
  /** 子元素数量匹配权重 */
  CHILD_COUNT: 1,
  /** 父链相似度权重 */
  PARENT_CHAIN: 2,
} as const;

// ========== 性能相关常量 ==========

/** 重叠检测时最多检查的选区数量 */
export const MAX_SELECTIONS_TO_CHECK = 10;

/** 滚动边距（像素），用于判断选区是否需要居中显示 */
export const SCROLL_MARGIN = 100;

/** 选区行为监听的防抖延迟（毫秒） */
export const SELECTION_BEHAVIOR_DEBOUNCE_MS = 10;

// ========== 核心算法配置（内部使用，不暴露给用户） ==========

/**
 * @internal
 * 核心算法配置 - 经过优化和测试的默认值
 * 用户不应该修改这些值，除非有特殊需求
 */
export const CORE_ALGORITHM_CONFIG = {
  /** 最大重试次数 - L1-L4 四层级联恢复 */
  maxRetries: 1,
  /** 模糊匹配阈值 - 用于 L4 结构指纹恢复 */
  fuzzyMatchThreshold: 0.8,
  /** 上下文长度 - 提取选区前后文本的字符数 */
  contextLength: 50,
} as const

// ========== 用户默认配置 ==========

/**
 * 内置默认样式配置
 *
 * 只提供一个 'default' 类型作为兜底样式。
 * 用户可以通过 selectionStyles 配置自定义类型，
 * 如果用户传入的类型中包含 'default'，则会覆盖内置的默认样式。
 */
export const DEFAULT_OPTIONS = {
  selectionStyles: [
    {
      type: 'default',
      label: '默认',
      style: {
        backgroundColor: '#ffeaa7',
        border: '1px solid #fdcb6e',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 1px 3px rgba(253, 203, 110, 0.3)',
        transition: 'all 0.2s ease',
      },
    },
  ],
}


/**
 * 默认高亮样式
 */
export const DEFAULT_HIGHLIGHT_STYLE = DEFAULT_OPTIONS.selectionStyles[0].style
