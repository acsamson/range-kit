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
} from '@life2code/range-kit-core';

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
    if (!sdkInstanceRef.current) return;
    try {
      const selections = await sdkInstanceRef.current.getAllSelections();
      setCurrentSelections(selections);
    } catch (err) {
      // Silent error
    }
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
        storage: { type: 'memory' },
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
        await instance.importSelections(optionsRef.current.initialSelections);
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

      serialized.type = type;
      serialized.appName = optionsRef.current.appId;

      await sdkInstanceRef.current.updateSelection(serialized.id, { type, appName: optionsRef.current.appId });
      await loadCurrentSelections();

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
  }, [loadCurrentSelections]);

  const restoreSelections = useCallback(async (
    selections: SerializedSelection[],
    enableAutoScroll: boolean = false
  ) => {
    if (!sdkInstanceRef.current) throw new Error('SDK not initialized');

    try {
      setIsLoading(true);
      await sdkInstanceRef.current.importSelections(selections);
      const scrollIndex = enableAutoScroll ? 0 : -1;
      await sdkInstanceRef.current.highlightSelections(selections, scrollIndex);
      await loadCurrentSelections();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to restore selections';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadCurrentSelections]);

  const clearAllSelections = useCallback(() => {
    sdkInstanceRef.current?.clearHighlight();
  }, []);

  const deleteSelection = useCallback(async (selectionId: string) => {
    if (!sdkInstanceRef.current) throw new Error('SDK not initialized');
    try {
      await sdkInstanceRef.current.deleteSelection(selectionId);
      await loadCurrentSelections();
      optionsRef.current.onSelectionDeleted?.(selectionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete selection';
      setError(msg);
      throw err;
    }
  }, [loadCurrentSelections]);

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
