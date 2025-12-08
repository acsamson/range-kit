import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SelectionRestore,
  SelectionBehaviorType,
  type SerializedSelection,
  type SerializedSelectionSimple,
  type SelectionTypeConfig,
  type SelectionRestoreOptions,
  type SelectionBehaviorEvent,
  type SelectionInteractionEvent,
  type SelectionInstance,
  type SelectionHighlightStyle as HighlightStyle,
  type OverlappedRange,
  convertToSimple
} from 'range-kit';
import { useNavigation, type NavigationReturn } from '../use-navigation';

export type SelectionActionType =
  | 'created'
  | 'cleared'
  | 'click'
  | 'hover'
  | 'dblclick'
  | 'contextmenu';

export interface SelectionActionEvent {
  type: SelectionActionType;
  text: string;
  position?: { x: number; y: number; width: number; height: number };
  originalEvent?: Event;
  range?: Range | null;
  savedSelection?: SerializedSelection;
  savedSelectionId?: string;
  overlappedSelections?: OverlappedRange[];
  timestamp: number;
}

export interface UseSelectionRestoreOptions {
  /**
   * 容器根节点 ID - 选区生效范围
   * 指定后，所有选区操作都限定在该节点内部
   */
  rootNodeId?: string;
  /**
   * @deprecated 使用 rootNodeId 代替
   * 容器选择器数组 - 仅使用第一个元素
   */
  containers?: string[];
  initialSelections?: SerializedSelection[];
  selectionStyles?: SelectionTypeConfig[];
  onSelectionAction?: (event: SelectionActionEvent) => void;
  onSelectionSaved?: (selection: SerializedSelectionSimple) => void;
  onSelectionDeleted?: (selectionId: string) => void;
}

export interface UseSelectionRestoreReturn {
  // 状态
  isInitialized: boolean;
  currentSelections: SerializedSelection[];
  isLoading: boolean;
  error: string | null;
  // 配置
  config: {
    rootNodeId: string | undefined;
    selectionStyles: SelectionTypeConfig[];
  };
  // 选区类型
  availableTypes: SelectionTypeConfig[];
  getTypeConfig: (type: string) => SelectionTypeConfig | undefined;
  // 核心方法
  saveCurrentSelection: (id?: string, type?: string, autoHighlight?: boolean, fromRange?: Range) => Promise<SerializedSelection | null>;
  restoreSelections: (selections: SerializedSelection[], enableAutoScroll?: boolean) => Promise<void>;
  clearAllSelections: () => void;
  deleteSelection: (selectionId: string) => Promise<void>;
  clearAllSelectionsData: () => Promise<void>;
  getCurrentSelectionsForSubmit: () => SerializedSelection[];
  getCurrentSelectionsSimple: (selections?: SerializedSelection[]) => SerializedSelectionSimple[];
  highlightCurrentSelection: (duration?: number) => void;
  updateRootNode: (rootNodeId: string | undefined) => void;
  /** @deprecated 使用 updateRootNode 代替 */
  updateContainers: (newContainers: string[]) => void;
  loadCurrentSelections: () => Promise<void>;
  // 导航功能
  navigation: NavigationReturn;
  // 高级接口
  getInstance: () => SelectionRestore | null;
}

export const DEFAULT_SELECTION_STYLE: HighlightStyle = {
  backgroundColor: '#fff3cd',
  textDecoration: 'underline',
  textDecorationColor: '#f1c40f',
  textDecorationThickness: '2px',
  textUnderlineOffset: '2px'
};

export const DEFAULT_SELECTION_TYPES: SelectionTypeConfig[] = [
  {
    type: 'default',
    label: '默认高亮',
    style: DEFAULT_SELECTION_STYLE,
    description: '默认的选区高亮样式'
  }
];

export function useSelectionRestore(options: UseSelectionRestoreOptions): UseSelectionRestoreReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<SerializedSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHighlightCount, setActiveHighlightCount] = useState(0);
  const [navigationIndex, setNavigationIndex] = useState(-1);

  const instanceRef = useRef<SelectionRestore | null>(null);
  const optionsRef = useRef(options);
  const configRef = useRef({
    rootNodeId: options.rootNodeId || options.containers?.[0]?.replace(/^[#.]/, '') || undefined,
    selectionStyles: [...DEFAULT_SELECTION_TYPES, ...(options.selectionStyles || [])]
  });
  const currentSelectionsRef = useRef<SerializedSelection[]>([]);
  const initializedRef = useRef(false);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Keep currentSelections ref updated
  useEffect(() => {
    currentSelectionsRef.current = currentSelections;
  }, [currentSelections]);

  // 导航功能
  const { navigation, onActiveRangesChange, cleanup: cleanupNavigation } = useNavigation({
    getInstance: () => instanceRef.current,
    activeHighlightCount,
    navigationIndex,
    setNavigationIndex
  });

  // 使用 ref 存储 onActiveRangesChange 避免依赖循环
  const onActiveRangesChangeRef = useRef(onActiveRangesChange);
  useEffect(() => {
    onActiveRangesChangeRef.current = onActiveRangesChange;
  }, [onActiveRangesChange]);

  const convertBehaviorToAction = useCallback((event: SelectionBehaviorEvent): SelectionActionEvent => {
    let actionType: SelectionActionType;
    switch (event.type) {
      case SelectionBehaviorType.CREATED:
        actionType = 'created';
        break;
      case SelectionBehaviorType.CLEARED:
        actionType = 'cleared';
        break;
      default:
        actionType = 'created';
    }

    return {
      type: actionType,
      text: event.text,
      position: event.position,
      range: event.range,
      overlappedSelections: event.overlappedRanges,
      timestamp: event.timestamp ?? Date.now()
    };
  }, []);

  const convertInteractionToAction = useCallback((
    event: SelectionInteractionEvent,
    instance: SelectionInstance
  ): SelectionActionEvent => {
    const actionEvent: SelectionActionEvent = {
      type: event.type as SelectionActionType,
      text: event.selection.text,
      originalEvent: event.originalEvent,
      savedSelection: event.selection,
      savedSelectionId: instance.id,
      timestamp: Date.now()
    };

    if (event.originalEvent instanceof MouseEvent) {
      actionEvent.position = {
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY,
        width: 0,
        height: 0
      };
    }

    return actionEvent;
  }, []);

  const loadCurrentSelections = useCallback(async () => {
    // Kit 是无状态的，选区数据由本地 currentSelections 管理
    // 此方法保留是为了 API 兼容性
  }, []);

  // 初始化 - 只执行一次
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const rootNodeId = configRef.current.rootNodeId;

        const restoreOptions: SelectionRestoreOptions = {
          rootNodeId,
          selectionStyles: configRef.current.selectionStyles,
          onSelectionBehavior: (event: SelectionBehaviorEvent) => {
            optionsRef.current.onSelectionAction?.(convertBehaviorToAction(event));
          },
          onSelectionInteraction: (event: SelectionInteractionEvent, selectionInstance: SelectionInstance) => {
            optionsRef.current.onSelectionAction?.(convertInteractionToAction(event, selectionInstance));
          },
          onActiveRangesChange: (event) => {
            setActiveHighlightCount(event.count);
            onActiveRangesChangeRef.current();
          }
        };

        const newInstance = new SelectionRestore(restoreOptions);
        instanceRef.current = newInstance;

        configRef.current.selectionStyles.forEach((typeConfig) => {
          newInstance.registerSelectionType(typeConfig);
        });

        if (optionsRef.current.initialSelections?.length) {
          // 将初始选区保存到本地状态
          setCurrentSelections(optionsRef.current.initialSelections);
          await newInstance.highlightSelections(optionsRef.current.initialSelections, -1);
        }

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      cleanupNavigation();
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
      // 重置初始化标记，以便 Strict Mode 或组件重新挂载时能正确初始化
      initializedRef.current = false;
      setIsInitialized(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCurrentSelection = useCallback(async (
    id?: string,
    type: string = 'default',
    autoHighlight: boolean = true,
    fromRange?: Range
  ): Promise<SerializedSelection | null> => {
    if (!instanceRef.current) throw new Error('Not initialized');

    try {
      if (fromRange) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(fromRange);
        }
      }

      const serialized = await instanceRef.current.serialize(id);
      if (!serialized) return null;

      // 设置选区类型
      serialized.type = type;

      // 将选区添加到本地状态管理
      setCurrentSelections(prev => {
        const existingIndex = prev.findIndex(s => s.id === serialized.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = serialized;
          return updated;
        } else {
          return [...prev, serialized];
        }
      });

      if (autoHighlight) {
        await instanceRef.current.restoreWithoutClear(serialized, false);
      }

      optionsRef.current.onSelectionSaved?.(convertToSimple(serialized));
      return serialized;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save selection';
      setError(msg);
      throw err;
    }
  }, []);

  const restoreSelections = useCallback(async (
    selections: SerializedSelection[],
    enableAutoScroll: boolean = false
  ) => {
    if (!instanceRef.current) throw new Error('Not initialized');

    try {
      setIsLoading(true);
      // 将选区数据保存到本地状态
      setCurrentSelections(prev => {
        const updated = [...prev];
        selections.forEach(selection => {
          const existingIndex = updated.findIndex(s => s.id === selection.id);
          if (existingIndex >= 0) {
            updated[existingIndex] = selection;
          } else {
            updated.push(selection);
          }
        });
        return updated;
      });
      const scrollIndex = enableAutoScroll ? 0 : -1;
      await instanceRef.current.highlightSelections(selections, scrollIndex);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to restore selections';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAllSelections = useCallback(() => {
    instanceRef.current?.clearHighlight();
    navigation.reset();
  }, [navigation]);

  const deleteSelection = useCallback(async (selectionId: string) => {
    if (!instanceRef.current) throw new Error('Not initialized');
    try {
      // 从本地状态中移除
      setCurrentSelections(prev => prev.filter(s => s.id !== selectionId));
      // 从 Kit 内存中移除选区实例
      instanceRef.current.removeSelection(selectionId);
      // 清除高亮并重新高亮剩余选区
      instanceRef.current.clearHighlight();
      // 注意：需要在状态更新后重新高亮
      setTimeout(async () => {
        const remaining = currentSelectionsRef.current.filter(s => s.id !== selectionId);
        if (remaining.length > 0 && instanceRef.current) {
          await instanceRef.current.highlightSelections(remaining, -1);
        }
      }, 0);
      optionsRef.current.onSelectionDeleted?.(selectionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete selection';
      setError(msg);
      throw err;
    }
  }, []);

  /**
   * 清空所有选区数据
   */
  const clearAllSelectionsData = useCallback(async () => {
    if (!instanceRef.current) throw new Error('Not initialized');

    try {
      instanceRef.current.clearHighlight();
      setCurrentSelections([]);
      navigation.reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to clear selections';
      setError(msg);
      throw err;
    }
  }, [navigation]);

  /**
   * 获取当前选区数组
   */
  const getCurrentSelectionsForSubmit = useCallback((): SerializedSelection[] => {
    return [...currentSelectionsRef.current];
  }, []);

  /**
   * 获取精简选区数据
   */
  const getCurrentSelectionsSimple = useCallback((
    selections?: SerializedSelection[]
  ): SerializedSelectionSimple[] => {
    return (selections || currentSelectionsRef.current).map(convertToSimple);
  }, []);

  /**
   * 高亮当前选中文本
   */
  const highlightCurrentSelection = useCallback((duration: number = 0) => {
    instanceRef.current?.highlightSelection(duration);
  }, []);

  /**
   * 更新根节点配置
   * @param rootNodeId - 新的根节点 ID
   */
  const updateRootNode = useCallback((rootNodeId: string | undefined) => {
    configRef.current.rootNodeId = rootNodeId;
    instanceRef.current?.setRootNodeId(rootNodeId || null);
  }, []);

  /**
   * @deprecated 使用 updateRootNode 代替
   * 更新容器配置（兼容旧 API）
   */
  const updateContainers = useCallback((newContainers: string[]) => {
    const rootNodeId = newContainers[0]?.replace(/^[#.]/, '') || undefined;
    updateRootNode(rootNodeId);
  }, [updateRootNode]);

  /**
   * 获取类型配置
   */
  const getTypeConfig = useCallback((type: string) => {
    return configRef.current.selectionStyles.find(t => t.type === type);
  }, []);

  return {
    // 状态
    isInitialized,
    currentSelections,
    isLoading,
    error,
    // 配置
    config: configRef.current,
    // 选区类型
    availableTypes: configRef.current.selectionStyles,
    getTypeConfig,
    // 核心方法
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    clearAllSelectionsData,
    getCurrentSelectionsForSubmit,
    getCurrentSelectionsSimple,
    highlightCurrentSelection,
    updateRootNode,
    updateContainers, // deprecated
    loadCurrentSelections,
    // 导航功能
    navigation,
    // 高级接口
    getInstance: () => instanceRef.current
  };
}
