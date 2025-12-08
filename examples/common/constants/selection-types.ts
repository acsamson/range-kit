/**
 * Selection type style configurations
 * These are base configs without localization, use i18n for labels and descriptions
 */

export interface SelectionTypeStyle {
  backgroundColor?: string
  textDecoration?: string
  textDecorationColor?: string
  textDecorationThickness?: string
  textDecorationStyle?: string
  textUnderlineOffset?: string
  fontWeight?: string
  borderLeft?: string
  borderRadius?: string
  padding?: string
}

/**
 * Base selection type config without localization
 */
export interface BaseSelectionTypeConfig {
  type: string
  icon: string
  style: SelectionTypeStyle
}

/**
 * Full selection type config (compatible with core package)
 */
export interface SelectionTypeConfig {
  type: string
  label: string
  style: SelectionTypeStyle
  description?: string
  icon?: string
}

/**
 * Search highlight style configuration (base config without localization)
 */
export const SEARCH_HIGHLIGHT_TYPE: BaseSelectionTypeConfig = {
  type: 'search',
  icon: '🔍',
  style: {
    backgroundColor: '#fef08a',
    textDecoration: 'none',
    borderRadius: '2px',
    padding: '1px 0'
  }
}

/**
 * User selectable types (excluding search, base config without localization)
 */
export const USER_SELECTION_TYPES: BaseSelectionTypeConfig[] = [
  {
    type: 'important',
    icon: '⭐',
    style: {
      backgroundColor: '#ffeb3b26',
      textDecoration: 'underline',
      textDecorationColor: '#ff9800',
      textDecorationThickness: '3px',
      textUnderlineOffset: '2px',
      fontWeight: 'bold'
    }
  },
  {
    type: 'question',
    icon: '❓',
    style: {
      backgroundColor: '#e3f2fd26',
      textDecoration: 'underline',
      textDecorationColor: '#2196f3',
      textDecorationThickness: '2px',
      textDecorationStyle: 'wavy',
      textUnderlineOffset: '2px'
    }
  },
  {
    type: 'bookmark',
    icon: '🔖',
    style: {
      backgroundColor: '#f3e5f526',
      textDecoration: 'underline',
      textDecorationColor: '#9c27b0',
      textDecorationThickness: '2px',
      textUnderlineOffset: '2px',
      borderLeft: '4px solid #9c27b0'
    }
  },
  {
    type: 'note',
    icon: '📝',
    style: {
      backgroundColor: '#e8f5e826',
      textDecoration: 'underline',
      textDecorationColor: '#4caf50',
      textDecorationThickness: '2px',
      textDecorationStyle: 'dashed',
      textUnderlineOffset: '2px'
    }
  },
  {
    type: 'warning',
    icon: '⚠️',
    style: {
      backgroundColor: '#fff3e026',
      textDecoration: 'underline',
      textDecorationColor: '#ff5722',
      textDecorationThickness: '3px',
      textDecorationStyle: 'double',
      textUnderlineOffset: '2px'
    }
  }
]

/**
 * All selection types (including search, base config without localization)
 */
export const DEFAULT_SELECTION_TYPES: BaseSelectionTypeConfig[] = [
  SEARCH_HIGHLIGHT_TYPE,
  ...USER_SELECTION_TYPES
]
