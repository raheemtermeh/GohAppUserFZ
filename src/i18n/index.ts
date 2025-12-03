import enTranslations from './translations/en.json'
import faTranslations from './translations/fa.json'

export type Language = 'en' | 'fa'

export interface Translations {
  common: Record<string, string>
  navigation: Record<string, string>
  pages: Record<string, Record<string, string>>
}

export const translations: Record<Language, Translations> = {
  en: enTranslations,
  fa: faTranslations
}

export const defaultLanguage: Language = 'fa'

export const supportedLanguages: Language[] = ['en', 'fa']

export const languageNames: Record<Language, string> = {
  en: 'English',
  fa: 'فارسی'
}

export const getTranslation = (language: Language, key: string, params?: Record<string, any>): string => {
  const keys = key.split('.')
  let value: any = translations[language]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // Fallback to English if key not found
      value = translations.en
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey]
        } else {
          return key // Return key if not found in any language
        }
      }
      break
    }
  }
  
  if (typeof value !== 'string') {
    return key
  }
  
  // Replace parameters in the translation string
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match
    })
  }
  
  return value
}


