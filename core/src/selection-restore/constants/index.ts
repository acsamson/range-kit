import { DEFAULT_SELECTION_TYPE, SelectionContextChangeStrategy } from '../types';

export const DEFAULT_OPTIONS = {
  maxRetries: 1,
  fuzzyMatchThreshold: 0.8,
  contextLength: 50,
  enableLogging: true,
  highlightStyle: {
    backgroundColor: '#ffeaa7', // 明显的黄色背景
    border: '1px solid #fdcb6e', // 橙色边框
    borderRadius: '3px',
    padding: '2px 4px', // 增加内边距
    boxShadow: '0 1px 3px rgba(253, 203, 110, 0.3)', // 添加阴影
    transition: 'all 0.2s ease',
  },
  dbName: 'SelectionRestoreDB',
  storeName: 'selections',
  enabledContainers: [], // 空数组表示全页面生效
  disabledContainers: [], // 空数组表示没有豁免区域
  rootNodeId: undefined, // 未指定根节点ID时使用document
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
      // style: {
      //   backgroundColor: '#a7e3ff',
      //   border: '1px solid #6eb8fd',
      //   borderRadius: '3px',
      //   padding: '2px 4px',
      //   boxShadow: '0 1px 3px rgba(110, 184, 253, 0.3)',
      //   transition: 'all 0.2s ease',
      // },
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
      // style: {
      //   backgroundColor: '#d4ffe7',
      //   border: '1px solid #00b894',
      //   borderRadius: '3px',
      //   padding: '2px 4px',
      //   boxShadow: '0 1px 3px rgba(0, 184, 148, 0.3)',
      //   transition: 'all 0.2s ease',
      // },
      style: {
        // color: '#1a73e8',  // 蓝色文字
        // backgroundColor: 'transparent',  // 透明背景
        // textDecoration: 'underline',  // 下划线
        // textDecorationStyle: 'dashed',  // 虚线样式
        // textDecorationColor: '#1a73e8',  // 下划线颜色
        // textDecorationThickness: '1px',  // 下划线粗细
        // textUnderlineOffset: '3px',  // 下划线偏移，增加与文字的间距
        // cursor: 'pointer',  // 鼠标样式 - SDK 会特殊处理
        // CSS Highlights API 不支持 border、padding、display、cursor、transition 等属性
        textDecoration: 'underline',
        textDecorationStyle: 'dashed',
        textDecorationColor: '#4285f4',
        textDecorationThickness: '2px',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        cursor: 'pointer',  // 添加鼠标指针样式
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

  // 新增的上下文变化监听配置
  enableContextChangeMonitoring: false,
  contextChangeStrategy: 'notify-only' as SelectionContextChangeStrategy,
  contextChangeDetectionInterval: 500,
  enableDOMChangeMonitoring: false,
  domChangeTargetContainers: [],
};
