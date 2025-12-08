import type { TranslationMessages } from './types'

export const zh: TranslationMessages = {
  // Common
  common: {
    save: '保存',
    delete: '删除',
    cancel: '取消',
    confirm: '确认',
    clear: '清除',
    clearAll: '清除全部',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    prev: '上一个',
    next: '下一个',
    search: '搜索'
  },

  // Control Panel
  controlPanel: {
    title: '功能控制面板',
    savedSelections: '已保存选区',
    selectionType: '选区类型',
    selectTypeHint: '选中文本后将使用此类型高亮:',
    defaultStylePreview: '默认样式预览',
    interactionMode: '交互模式',
    triggerActionHint: '触发操作的方式:',
    batchOperations: '批量操作',
    loadPresetData: '加载预设数据',
    restoreAllSelections: '恢复所有选区',
    clearAllHighlights: '清除所有高亮',
    printData: '打印数据'
  },

  // Interaction modes
  interactionModes: {
    click: '点击 (Click)',
    hover: '悬停 (Hover)',
    dblclick: '双击 (Double Click)',
    contextmenu: '右键 (Context Menu)'
  },

  // Search Highlight
  searchHighlight: {
    placeholder: '搜索关键词...',
    addKeyword: '添加关键词',
    caseSensitive: '区分大小写',
    wholeWord: '全词匹配',
    skipOverlap: '避开已有选区',
    dictionaryCard: '词典卡片',
    cardTitle: '卡片标题:',
    contentTemplate: '内容模板 (使用 {{keyword}} 作为占位符):',
    contentPlaceholder: '例如："{{keyword}}" 的释义将显示在这里',
    showKeywordInCard: '在卡片中显示关键词',
    expandConfig: '展开/收起详细配置',
    remove: '移除'
  },

  // Selection Types
  selectionTypes: {
    search: {
      label: '搜索高亮',
      description: '搜索关键词高亮'
    },
    important: {
      label: '重要内容',
      description: '标记重要的内容'
    },
    question: {
      label: '疑问标记',
      description: '标记有疑问的内容'
    },
    bookmark: {
      label: '书签收藏',
      description: '收藏重要段落'
    },
    note: {
      label: '笔记标注',
      description: '添加个人笔记'
    },
    warning: {
      label: '警告提醒',
      description: '标记需要注意的内容'
    }
  },

  // Popover
  popover: {
    saveSelection: '保存选区',
    deleteSelection: '删除选区',
    selectedText: '选中文本',
    selectionActions: '选区操作',
    searchResults: '搜索结果',
    newSelection: '新建选区',
    selections: '个选区',
    searches: '个搜索',
    newSelections: '个新选',
    saved: '已保存',
    search: '搜索',
    new: '新选',
    dictionary: '词典释义'
  },

  // Demo Content
  demoContent: {
    title: '出师表',
    author: '诸葛亮'
  }
}
