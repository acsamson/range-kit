/**
 * 默认选区类型配置
 */
export const DEFAULT_SELECTION_TYPES = [
  {
    type: 'important',
    label: '重要内容',
    style: {
      backgroundColor: '#ffeb3b26', // 淡黄色背景
      textDecoration: 'underline',
      textDecorationColor: '#ff9800', // 橙色下划线
      textDecorationThickness: '3px',
      textUnderlineOffset: '2px',
      fontWeight: 'bold'
    },
    description: '标记重要的内容',
    icon: '⭐'
  },
  {
    type: 'question',
    label: '疑问标记',
    style: {
      backgroundColor: '#e3f2fd26', // 淡蓝色背景
      textDecoration: 'underline',
      textDecorationColor: '#2196f3', // 蓝色下划线
      textDecorationThickness: '2px',
      textDecorationStyle: 'wavy',
      textUnderlineOffset: '2px'
    },
    description: '标记有疑问的内容',
    icon: '❓'
  },
  {
    type: 'bookmark',
    label: '书签收藏',
    style: {
      backgroundColor: '#f3e5f526', // 淡紫色背景
      textDecoration: 'underline',
      textDecorationColor: '#9c27b0', // 紫色下划线
      textDecorationThickness: '2px',
      textUnderlineOffset: '2px',
      borderLeft: '4px solid #9c27b0'
    },
    description: '收藏重要段落',
    icon: '🔖'
  },
  {
    type: 'note',
    label: '笔记标注',
    style: {
      backgroundColor: '#e8f5e826', // 淡绿色背景
      textDecoration: 'underline',
      textDecorationColor: '#4caf50', // 绿色下划线
      textDecorationThickness: '2px',
      textDecorationStyle: 'dashed',
      textUnderlineOffset: '2px'
    },
    description: '添加个人笔记',
    icon: '📝'
  },
  {
    type: 'warning',
    label: '警告提醒',
    style: {
      backgroundColor: '#fff3e026', // 淡橙色背景
      textDecoration: 'underline',
      textDecorationColor: '#ff5722', // 红橙色下划线
      textDecorationThickness: '3px',
      textDecorationStyle: 'double',
      textUnderlineOffset: '2px'
    },
    description: '标记需要注意的内容',
    icon: '⚠️'
  }
]