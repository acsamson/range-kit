/**
 * Selection type configurations for React demo
 * Re-exports from common with i18n integration
 */

import type { SelectionTypeConfig } from 'range-kit-react'
import {
  SEARCH_HIGHLIGHT_TYPE as BASE_SEARCH_TYPE,
  USER_SELECTION_TYPES as BASE_USER_TYPES
} from '../../common/constants'
import { messages, type Locale } from '../../common/i18n'

// Re-export type for convenience
export type { SelectionTypeConfig }

/**
 * Create localized selection types
 */
function createLocalizedTypes(locale: Locale): SelectionTypeConfig[] {
  const t = messages[locale].selectionTypes

  return [
    {
      type: BASE_SEARCH_TYPE.type,
      label: t.search.label,
      style: BASE_SEARCH_TYPE.style,
      description: t.search.description,
      icon: BASE_SEARCH_TYPE.icon
    },
    ...BASE_USER_TYPES.map(config => {
      const typeKey = config.type as keyof typeof t
      const translation = t[typeKey]
      return {
        type: config.type,
        label: translation?.label ?? config.type,
        style: config.style,
        description: translation?.description ?? '',
        icon: config.icon
      }
    })
  ]
}

/**
 * Get user selection types with localization
 */
export function getUserSelectionTypes(locale: Locale = 'en'): SelectionTypeConfig[] {
  const t = messages[locale].selectionTypes
  return BASE_USER_TYPES.map(config => {
    const typeKey = config.type as keyof typeof t
    const translation = t[typeKey]
    return {
      type: config.type,
      label: translation?.label ?? config.type,
      style: config.style,
      description: translation?.description ?? '',
      icon: config.icon
    }
  })
}

/**
 * Get all selection types with localization
 */
export function getDefaultSelectionTypes(locale: Locale = 'en'): SelectionTypeConfig[] {
  return createLocalizedTypes(locale)
}

// Default exports for backward compatibility (English)
export const USER_SELECTION_TYPES = getUserSelectionTypes('en')
export const DEFAULT_SELECTION_TYPES = getDefaultSelectionTypes('en')
