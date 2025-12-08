/**
 * i18n hook for React demo
 */

import { useState, useCallback, useMemo } from 'react'
import { messages, type Locale, type TranslationMessages } from '../../../common/i18n'

let globalLocale: Locale = 'en'

export function initI18n(locale: Locale) {
  globalLocale = locale
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(globalLocale)

  const toggleLocale = useCallback(() => {
    const newLocale = locale === 'en' ? 'zh' : 'en'
    globalLocale = newLocale
    setLocaleState(newLocale)
  }, [locale])

  const t = useMemo<TranslationMessages>(() => messages[locale], [locale])

  return {
    locale,
    t,
    toggleLocale
  }
}
