/**
 * 配置选项类型定义
 *
 * 设计原则：
 * - 用户只需要配置「做什么」，不需要了解「怎么做」
 * - 核心算法参数硬编码在 constants 中，不暴露给用户
 * - 配置按职责分层：作用域 → 样式 → 事件
 */

import type {
  SelectionInteractionCallback,
  SelectionBehaviorCallback,
  ActiveRangesChangeCallback,
} from './events'

// 从 styles.ts 导入 HighlightStyle（用于本文件内部使用）
import type { HighlightStyle } from './styles'
// 同时重导出供外部使用
export type { HighlightStyle } from './styles'

// ========== 选区类型配置 ==========

/**
 * 选区类型注册信息
 */
export interface SelectionTypeConfig {
  /** 类型标识符 */
  type: string
  /** 显示名称 */
  label: string
  /** 类型样式 */
  style: HighlightStyle
  /** 类型描述 */
  description?: string
  /** 图标 */
  icon?: string
}

// ========== 高级配置 ==========

/**
 * 高级配置选项
 *
 * 大多数场景不需要这些配置，仅在特殊需求时使用。
 */
export interface AdvancedOptions {
  /**
   * 自定义ID属性名称（如 'data-paragraph-id'）
   *
   * 配置后，序列化/恢复时会优先使用该属性作为锚点：
   * - 序列化时：记录元素的 customIdAttribute 值
   * - 恢复时：优先通过该属性查找元素，找不到再回退到标准 id
   *
   * 适用场景：
   * - 富文本编辑器（每个段落有唯一标识）
   * - 动态内容（DOM 结构变化，但自定义 ID 保持稳定）
   */
  customIdAttribute?: string
}

// ========== 用户配置（面向场景） ==========

/**
 * 用户配置选项
 *
 * 这是用户应该使用的主要配置接口。
 * 只包含用户需要关心的配置，核心算法参数已内置最优默认值。
 */
export interface SelectionRestoreOptions {
  // -------- 作用域配置 --------

  /**
   * 容器作用域： 选区作用域的根节点ID
   *
   * 指定后，所有选区操作都限定在该节点内部：
   * - 选区序列化/恢复的路径计算以该节点为起点
   * - 选区行为监听只在该节点内触发
   *
   * 如需豁免子区域，使用 `data-range-exclude` 属性标记：
   * ```html
   * <div id="article">
   *   <p>可选区内容</p>
   *   <div data-range-exclude>这里不可选</div>
   * </div>
   * ```
   */
  rootNodeId?: string

  // -------- 样式配置 --------

  /**
   * 选区类型样式配置
   *
   * 配置自定义的选区类型和样式。
   * - 如果不传，使用内置的 'default' 类型样式
   * - 如果传入的类型中包含 'default'，会覆盖内置的默认样式
   * - selectionStyles[0] 作为默认类型（当选区未指定类型时使用）
   */
  selectionStyles?: SelectionTypeConfig[]

  // -------- 事件回调 --------

  /** 选区交互事件回调（点击、悬浮等） */
  onSelectionInteraction?: SelectionInteractionCallback
  /** 选区行为监听回调 - 监听容器内发生的选区行为 */
  onSelectionBehavior?: SelectionBehaviorCallback
  /** 活跃高亮数量变化回调 - 当 activeRanges 数量变化时触发 */
  onActiveRangesChange?: ActiveRangesChangeCallback

  // -------- 高级配置（可选） --------

  /**
   * 高级配置选项
   *
   * 大多数场景不需要，仅在特殊需求时使用。
   */
  advanced?: AdvancedOptions
}

// ========== 内部配置（不暴露给用户） ==========

/**
 * @internal
 * 核心算法配置 - 仅供内部使用
 * 这些值已经过优化和测试，不应该暴露给用户
 */
export interface CoreAlgorithmConfig {
  /** 最大重试次数 */
  maxRetries: number
  /** 模糊匹配阈值 (0-1) */
  fuzzyMatchThreshold: number
  /** 上下文长度 */
  contextLength: number
}

/**
 * @internal
 * 完整的内部配置 - 合并用户配置和核心配置
 */
export interface InternalOptions extends SelectionRestoreOptions {
  /** 核心算法配置（内部使用） */
  _core: CoreAlgorithmConfig
}
