import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SelectionRestore,
  SelectionBehaviorType,
  type SerializedSelection,
  type SelectionTypeConfig,
  type SelectionRestoreOptions,
  type SelectionBehaviorEvent,
  type SelectionInteractionEvent,
  type SelectionInstance,
  type SelectionHighlightStyle as HighlightStyle,
  type OverlappedRange
} from '@l2c/range-kit-core';

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
  appId: string;
  containers?: string[];
  initialSelections?: SerializedSelection[];
  selectionStyles?: SelectionTypeConfig[];
  onSelectionAction?: (event: SelectionActionEvent) => void;
  onSelectionSaved?: (selection: SerializedSelection) => void;
  onSelectionDeleted?: (selectionId: string) => void;
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

export function useSelectionRestore(options: UseSelectionRestoreOptions) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSelections, setCurrentSelections] = useState<SerializedSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sdkInstanceRef = useRef<SelectionRestore | null>(null);
  const optionsRef = useRef(options);
  
  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const convertBehaviorToAction = (event: SelectionBehaviorEvent): SelectionActionEvent => {
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
  };

  const convertInteractionToAction = (
    event: SelectionInteractionEvent,
    instance: SelectionInstance
  ): SelectionActionEvent => {
    return {
      type: event.type as SelectionActionType,
      text: event.selection.text,
      originalEvent: event.originalEvent,
      savedSelection: event.selection,
      savedSelectionId: instance.id,
      timestamp: Date.now()
    };
  };

  const loadCurrentSelections = useCallback(async () => {
    // SDK 是无状态的，选区数据由本地 currentSelections 管理
    // 此方法保留是为了 API 兼容性
  }, []);

  const initSDK = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const config = {
        appId: optionsRef.current.appId,
        containers: optionsRef.current.containers || [],
        selectionStyles: [...DEFAULT_SELECTION_TYPES, ...(optionsRef.current.selectionStyles || [])]
      };

      const sdkOptions: SelectionRestoreOptions = {
        enabledContainers: config.containers,
        registeredTypes: config.selectionStyles,
        highlightStyle: DEFAULT_SELECTION_STYLE,
        enableLogging: false,
        // SDK 是无状态设计，不需要 storage 配置
        onSelectionBehavior: (event: SelectionBehaviorEvent) => {
          optionsRef.current.onSelectionAction?.(convertBehaviorToAction(event));
        },
        onSelectionInteraction: (event: SelectionInteractionEvent, instance: SelectionInstance) => {
          optionsRef.current.onSelectionAction?.(convertInteractionToAction(event, instance));
        }
      };

      const instance = new SelectionRestore(sdkOptions);
      sdkInstanceRef.current = instance;

      config.selectionStyles.forEach((typeConfig) => {
        instance.registerSelectionType(typeConfig);
      });

      if (optionsRef.current.initialSelections?.length) {
        // 将初始选区保存到本地状态
        setCurrentSelections(optionsRef.current.initialSelections);
        await instance.highlightSelections(optionsRef.current.initialSelections, -1);
      }

      await loadCurrentSelections();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setIsLoading(false);
    }
  }, [loadCurrentSelections]);

  useEffect(() => {
    initSDK();
    return () => {
      if (sdkInstanceRef.current) {
        sdkInstanceRef.current.destroy();
        sdkInstanceRef.current = null;
      }
    };
  }, [initSDK]);

  const saveCurrentSelection = useCallback(async (
    id?: string,
    type: string = 'default',
    autoHighlight: boolean = true,
    fromRange?: Range
  ) => {
    if (!sdkInstanceRef.current) throw new Error('SDK not initialized');

    try {
      if (fromRange) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(fromRange);
        }
      }

      const serialized = await sdkInstanceRef.current.serialize(id);
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
        await sdkInstanceRef.current.restoreWithoutClear(serialized, false);
      }

      optionsRef.current.onSelectionSaved?.(serialized);
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
    if (!sdkInstanceRef.current) throw new Error('SDK not initialized');

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
      await sdkInstanceRef.current.highlightSelections(selections, scrollIndex);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to restore selections';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAllSelections = useCallback(() => {
    sdkInstanceRef.current?.clearHighlight();
  }, []);

  const deleteSelection = useCallback(async (selectionId: string) => {
    if (!sdkInstanceRef.current) throw new Error('SDK not initialized');
    try {
      // 从本地状态中移除
      setCurrentSelections(prev => prev.filter(s => s.id !== selectionId));
      // 清除高亮并重新高亮剩余选区
      sdkInstanceRef.current.clearHighlight();
      // 注意：需要在状态更新后重新高亮，这里使用 setTimeout 确保状态已更新
      setTimeout(async () => {
        const remaining = currentSelections.filter(s => s.id !== selectionId);
        if (remaining.length > 0 && sdkInstanceRef.current) {
          await sdkInstanceRef.current.highlightSelections(remaining, -1);
        }
      }, 0);
      optionsRef.current.onSelectionDeleted?.(selectionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete selection';
      setError(msg);
      throw err;
    }
  }, [currentSelections]);

  return {
    isInitialized,
    currentSelections,
    isLoading,
    error,
    saveCurrentSelection,
    restoreSelections,
    clearAllSelections,
    deleteSelection,
    loadCurrentSelections,
    getSDKInstance: () => sdkInstanceRef.current
  };
}
