/**
 * i18n types for examples
 */

export type Locale = 'en' | 'zh'

export interface SelectionTypeTranslation {
  label: string
  description: string
}

export interface TranslationMessages {
  // Common
  common: {
    save: string
    delete: string
    cancel: string
    confirm: string
    clear: string
    clearAll: string
    loading: string
    error: string
    success: string
    prev: string
    next: string
    search: string
  }

  // Control Panel
  controlPanel: {
    title: string
    savedSelections: string
    selectionType: string
    selectTypeHint: string
    defaultStylePreview: string
    interactionMode: string
    triggerActionHint: string
    batchOperations: string
    loadPresetData: string
    restoreAllSelections: string
    clearAllHighlights: string
    printData: string
  }

  // Interaction modes
  interactionModes: {
    click: string
    hover: string
    dblclick: string
    contextmenu: string
  }

  // Search Highlight
  searchHighlight: {
    placeholder: string
    addKeyword: string
    caseSensitive: string
    wholeWord: string
    skipOverlap: string
    dictionaryCard: string
    cardTitle: string
    contentTemplate: string
    contentPlaceholder: string
    showKeywordInCard: string
    expandConfig: string
    remove: string
  }

  // Selection Types
  selectionTypes: {
    search: SelectionTypeTranslation
    important: SelectionTypeTranslation
    question: SelectionTypeTranslation
    bookmark: SelectionTypeTranslation
    note: SelectionTypeTranslation
    warning: SelectionTypeTranslation
  }

  // Popover
  popover: {
    saveSelection: string
    deleteSelection: string
    selectedText: string
    selectionActions: string
    searchResults: string
    newSelection: string
    selections: string
    searches: string
    newSelections: string
    saved: string
    search: string
    new: string
    dictionary: string
  }

  // Demo Content (article titles)
  demoContent: {
    title: string
    author: string
  }
}
