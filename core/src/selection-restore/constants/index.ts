import { DEFAULT_SELECTION_TYPE, SelectionContextChangeStrategy } from '../types';

// ========== 性能相关常量 ==========

/** 重叠检测时最多检查的选区数量 */
export const MAX_SELECTIONS_TO_CHECK = 10;

/** 滚动边距（像素），用于判断选区是否需要居中显示 */
export const SCROLL_MARGIN = 100;

/** 选区行为监听的防抖延迟（毫秒） */
export const SELECTION_BEHAVIOR_DEBOUNCE_MS = 10;

// ========== 默认配置 ==========

export const DEFAULT_OPTIONS = {
  maxRetries: 1,
  fuzzyMatchThreshold: 0.8,
  contextLength: 50,
  enableLogging: true,
  highlightStyle: {
    backgroundColor: '#ffeaa7',
    border: '1px solid #fdcb6e',
    borderRadius: '3px',
    padding: '2px 4px',
    boxShadow: '0 1px 3px rgba(253, 203, 110, 0.3)',
    transition: 'all 0.2s ease',
  },
  dbName: 'SelectionRestoreDB',
  storeName: 'selections',
  enabledContainers: [],
  disabledContainers: [],
  rootNodeId: undefined,
  defaultSelectionType: DEFAULT_SELECTION_TYPE,
  registeredTypes: [
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
      icon: '🔖',
    },
    {
      type: 'comment',
      label: '评论',
      style: {
        backgroundColor: '#ffeaa7',
        border: '1px solid #fdcb6e',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 1px 3px rgba(253, 203, 110, 0.3)',
        transition: 'all 0.2s ease',
      },
      icon: '💬',
    },
    {
      type: 'dictionary',
      label: '词典',
      style: {
        textDecoration: 'underline',
        textDecorationStyle: 'dashed',
        textDecorationColor: '#4285f4',
        textDecorationThickness: '2px',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        cursor: 'pointer',
      },
      icon: '📖',
    },
    {
      type: 'highlight',
      label: '高亮',
      style: {
        backgroundColor: '#fff3a7',
        border: '1px solid #f1c40f',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 1px 3px rgba(241, 196, 15, 0.3)',
        transition: 'all 0.2s ease',
      },
      icon: '🖍️',
    },
    {
      type: 'note',
      label: '笔记',
      style: {
        backgroundColor: '#ffd3e1',
        border: '1px solid #fd79a8',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 1px 3px rgba(253, 121, 168, 0.3)',
        transition: 'all 0.2s ease',
      },
      icon: '📝',
    },
    {
      type: 'bookmark',
      label: '书签',
      style: {
        backgroundColor: '#e8d5ff',
        border: '1px solid #a29bfe',
        borderRadius: '3px',
        padding: '2px 4px',
        boxShadow: '0 1px 3px rgba(162, 155, 254, 0.3)',
        transition: 'all 0.2s ease',
      },
      icon: '🔖',
    },
  ],
  enableSelectionMonitoring: false,
  monitoringInterval: 1000,
  enableContextChangeMonitoring: false,
  contextChangeStrategy: 'notify-only' as SelectionContextChangeStrategy,
  contextChangeDetectionInterval: 500,
  enableDOMChangeMonitoring: false,
  domChangeTargetContainers: [],
};
