import type { Ref, ComputedRef } from 'vue'
import type {
  SerializedSelection,
  SerializedSelectionSimple,
  SelectionTypeConfig,
  SelectionRestoreAPI,
  OverlappedRange
} from 'range-kit'

/**
 * 选区动作类型
 */
export type SelectionActionType =
  | 'created'      // 用户划选了新文本
  | 'cleared'      // 用户清除了选区（点击空白处）
  | 'click'        // 点击已保存选区
  | 'hover'        // 悬停在已保存选区
  | 'dblclick'     // 双击已保存选区
  | 'contextmenu'  // 右键已保存选区

/**
 * 选区动作事件（统一事件类型）
 *
 * @description
 * 合并了 SelectionBehaviorEvent 和 SelectionInteractionEvent，
 * 提供统一的事件处理入口
 */
export interface SelectionActionEvent {
  /** 动作类型 */
  type: SelectionActionType
  /** 选中的文本内容 */
  text: string
  /** 位置信息（用于显示气泡等 UI） */
  position?: { x: number; y: number; width: number; height: number }
  /** 原始 DOM 事件 */
  originalEvent?: Event
  /** Range 对象（仅 created 时有效） */
  range?: Range | null
  /** 已保存的选区数据（仅交互已保存选区时有效） */
  savedSelection?: SerializedSelection
  /** 已保存选区的实例 ID（仅交互已保存选区时有效） */
  savedSelectionId?: string
  /** 重叠的已保存选区列表 */
  overlappedSelections?: OverlappedRange[]
  /** 事件时间戳 */
  timestamp: number
}

/**
 * 导航高亮项
 */
export interface NavigationHighlight {
  id: string
  text: string
  range: Range
}

/**
 * 高亮导航状态
 */
export interface HighlightNavigationState {
  /** 当前导航索引 */
  currentIndex: Ref<number>
  /** 高亮总数 */
  total: ComputedRef<number>
  /** 当前高亮项 */
  currentHighlight: ComputedRef<NavigationHighlight | null>
  /** 导航到下一个 */
  goToNext: () => void
  /** 导航到上一个 */
  goToPrev: () => void
  /** 导航到指定索引 */
  goToIndex: (index: number) => void
  /** 导航到指定 ID */
  goToId: (id: string) => void
  /** 重置导航 */
  reset: () => void
}

/**
 * useSelectionRestore hook 配置选项
 */
export interface UseSelectionRestoreOptions {
  /**
   * 容器根节点 ID - 选区生效范围
   *
   * 指定后，所有选区操作都限定在该节点内部：
   * - 选区序列化/恢复的路径计算以该节点为起点
   * - 选区行为监听只在该节点内触发
   */
  rootNodeId?: string

  /**
   * @deprecated 使用 rootNodeId 代替
   * 容器选择器数组 - 仅使用第一个元素，且必须是 ID 选择器（如 '#article'）
   */
  containers?: string[]
  /** 初始恢复的选区数据数组 */
  initialSelections?: SerializedSelection[]
  /** 选区样式配置数组 - 不传递则使用默认样式 */
  selectionStyles?: SelectionTypeConfig[]
  /**
   * 选区动作统一回调
   *
   * @description
   * 统一处理所有选区相关事件，通过 event.type 判断动作类型：
   * - created: 用户划选了新文本
   * - cleared: 用户清除了选区（点击空白处）
   * - click: 点击已保存选区
   * - hover: 悬停在已保存选区
   * - dblclick: 双击已保存选区
   * - contextmenu: 右键已保存选区
   *
   * @example
   * ```ts
   * onSelectionAction: (event) => {
   *   switch (event.type) {
   *     case 'created':
   *       // 显示保存气泡
   *       showSavePopover(event)
   *       break
   *     case 'click':
   *       // 显示删除气泡
   *       showRemovePopover(event)
   *       break
   *     case 'cleared':
   *       // 隐藏气泡
   *       hidePopover()
   *       break
   *   }
   * }
   * ```
   */
  onSelectionAction?: (event: SelectionActionEvent) => void
  /** 自定义选区保存回调 */
  onSelectionSaved?: (selection: SerializedSelection) => void
  /** 自定义选区删除回调 */
  onSelectionDeleted?: (selectionId: string) => void
}

/**
 * Hook 返回值接口
 */
export interface UseSelectionRestoreReturn {
  // 状态
  isInitialized: Ref<boolean>
  currentSelections: Ref<SerializedSelection[]>
  isLoading: Ref<boolean>
  error: Ref<string | null>

  // 配置
  config: {
    rootNodeId?: string
    selectionStyles: SelectionTypeConfig[]
  }

  // 选区类型相关
  availableTypes: SelectionTypeConfig[]
  getTypeConfig: (type: string) => SelectionTypeConfig | undefined

  // 核心方法
  /**
   * 保存当前选区
   * @param id - 选区ID（可选）
   * @param type - 选区类型，默认 'default'
   * @param autoHighlight - 保存后是否自动高亮（不清除其他高亮），默认 true
   * @param fromRange - 从指定 Range 保存选区（可选），如不传则使用当前浏览器选区
   */
  saveCurrentSelection: (id?: string, type?: string, autoHighlight?: boolean, fromRange?: Range) => Promise<SerializedSelection | null>
  restoreSelections: (selections: SerializedSelection[], enableAutoScroll?: boolean) => Promise<void>
  clearAllSelections: () => void
  deleteSelection: (selectionId: string) => Promise<void>
  clearAllSelectionsData: () => Promise<void>
  getCurrentSelectionsForSubmit: () => SerializedSelection[]
  getCurrentSelectionsSimple: (selections?: SerializedSelection[]) => SerializedSelectionSimple[]
  highlightCurrentSelection: (duration?: number) => void
  updateRootNode: (rootNodeId: string | undefined) => void
  /** @deprecated 使用 updateRootNode 代替 */
  updateContainers: (newContainers: string[]) => void
  loadCurrentSelections: () => Promise<void>

  // 导航功能
  navigation: HighlightNavigationState

  // 高级接口
  getInstance: () => SelectionRestoreAPI | null
}
