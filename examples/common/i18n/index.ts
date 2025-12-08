/**
 * i18n entry for examples
 */

import { en } from './en'
import { zh } from './zh'
import type { Locale, TranslationMessages } from './types'

export type { Locale, TranslationMessages, SelectionTypeTranslation } from './types'

export const messages: Record<Locale, TranslationMessages> = {
  en,
  zh
}

export const defaultLocale: Locale = 'en'

/**
 * Get browser language and map to supported locale
 */
export function getBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return defaultLocale

  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'zh'
  return 'en'
}

/**
 * Create a simple i18n instance
 */
export function createI18n(initialLocale?: Locale) {
  let currentLocale: Locale = initialLocale ?? defaultLocale

  return {
    get locale() {
      return currentLocale
    },

    set locale(newLocale: Locale) {
      currentLocale = newLocale
    },

    get messages() {
      return messages[currentLocale]
    },

    t<K extends keyof TranslationMessages>(
      section: K,
      key: keyof TranslationMessages[K]
    ): string {
      const sectionMessages = messages[currentLocale][section]
      const value = sectionMessages[key]
      if (typeof value === 'string') {
        return value
      }
      // For nested objects like selectionTypes
      return String(value)
    },

    /**
     * Get translation for selection type
     */
    getSelectionTypeLabel(type: string): string {
      const selectionTypes = messages[currentLocale].selectionTypes
      const typeKey = type as keyof typeof selectionTypes
      if (typeKey in selectionTypes) {
        return selectionTypes[typeKey].label
      }
      return type
    },

    getSelectionTypeDescription(type: string): string {
      const selectionTypes = messages[currentLocale].selectionTypes
      const typeKey = type as keyof typeof selectionTypes
      if (typeKey in selectionTypes) {
        return selectionTypes[typeKey].description
      }
      return ''
    },

    /**
     * Switch to next locale
     */
    toggleLocale() {
      currentLocale = currentLocale === 'en' ? 'zh' : 'en'
      return currentLocale
    }
  }
}

export type I18nInstance = ReturnType<typeof createI18n>
