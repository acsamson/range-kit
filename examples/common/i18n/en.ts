import type { TranslationMessages } from './types'

export const en: TranslationMessages = {
  // Common
  common: {
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    clear: 'Clear',
    clearAll: 'Clear All',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    prev: 'Prev',
    next: 'Next',
    search: 'Search'
  },

  // Control Panel
  controlPanel: {
    title: 'Control Panel',
    savedSelections: 'Saved Selections',
    selectionType: 'Selection Type',
    selectTypeHint: 'Selected text will be highlighted with this type:',
    defaultStylePreview: 'Default style preview',
    interactionMode: 'Interaction Mode',
    triggerActionHint: 'How to trigger actions:',
    batchOperations: 'Batch Operations',
    loadPresetData: 'Load Preset Data',
    restoreAllSelections: 'Restore All Selections',
    clearAllHighlights: 'Clear All Highlights',
    printData: 'Print Data'
  },

  // Interaction modes
  interactionModes: {
    click: 'Click',
    hover: 'Hover',
    dblclick: 'Double Click',
    contextmenu: 'Context Menu'
  },

  // Search Highlight
  searchHighlight: {
    placeholder: 'Search keywords...',
    addKeyword: 'Add keyword',
    caseSensitive: 'Case sensitive',
    wholeWord: 'Whole word',
    skipOverlap: 'Skip existing selections',
    dictionaryCard: 'Dictionary Card',
    cardTitle: 'Card Title:',
    contentTemplate: 'Content template (use {{keyword}} as placeholder):',
    contentPlaceholder: 'e.g., The definition of "{{keyword}}" will be shown here',
    showKeywordInCard: 'Show keyword in card',
    expandConfig: 'Expand/collapse detailed config',
    remove: 'Remove'
  },

  // Selection Types
  selectionTypes: {
    search: {
      label: 'Search Highlight',
      description: 'Search keyword highlight'
    },
    important: {
      label: 'Important',
      description: 'Mark important content'
    },
    question: {
      label: 'Question',
      description: 'Mark questionable content'
    },
    bookmark: {
      label: 'Bookmark',
      description: 'Bookmark important paragraphs'
    },
    note: {
      label: 'Note',
      description: 'Add personal notes'
    },
    warning: {
      label: 'Warning',
      description: 'Mark content that needs attention'
    }
  },

  // Popover
  popover: {
    saveSelection: 'Save Selection',
    deleteSelection: 'Delete Selection',
    selectedText: 'Selected Text',
    selectionActions: 'Selection Actions',
    searchResults: 'Search Results',
    newSelection: 'New Selection',
    selections: 'Selections',
    searches: 'Searches',
    newSelections: 'New',
    saved: 'Saved',
    search: 'Search',
    new: 'New',
    dictionary: 'Dictionary Definition'
  },

  // Demo Content
  demoContent: {
    title: 'Memorial on Dispatching the Troops',
    author: 'Zhuge Liang'
  }
}
