/**
 * Vue composable for i18n
 */
import { ref, computed, readonly } from 'vue'
import {
  createI18n,
  messages,
  type Locale
} from '../../../common/i18n'

// Global state for locale (shared across components)
const currentLocale = ref<Locale>('en')
const i18nInstance = createI18n('en')

/**
 * Initialize i18n with browser locale or default
 */
export function initI18n(defaultLocale?: Locale) {
  const locale = defaultLocale ?? 'en'
  currentLocale.value = locale
  i18nInstance.locale = locale
}

/**
 * Vue composable for using i18n
 */
export function useI18n() {
  const locale = computed(() => currentLocale.value)
  const t = computed(() => messages[currentLocale.value])

  /**
   * Set the current locale
   */
  function setLocale(newLocale: Locale) {
    currentLocale.value = newLocale
    i18nInstance.locale = newLocale
  }

  /**
   * Toggle between 'en' and 'zh'
   */
  function toggleLocale() {
    const newLocale = currentLocale.value === 'en' ? 'zh' : 'en'
    setLocale(newLocale)
    return newLocale
  }

  /**
   * Get selection type label
   */
  function getSelectionTypeLabel(type: string): string {
    return i18nInstance.getSelectionTypeLabel(type)
  }

  /**
   * Get selection type description
   */
  function getSelectionTypeDescription(type: string): string {
    return i18nInstance.getSelectionTypeDescription(type)
  }

  return {
    locale: readonly(locale),
    t,
    setLocale,
    toggleLocale,
    getSelectionTypeLabel,
    getSelectionTypeDescription
  }
}

export type UseI18nReturn = ReturnType<typeof useI18n>
