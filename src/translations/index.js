import { en } from './en'
import { ar } from './ar'

const translations = { en, ar }

export function t(language, key) {
  return translations[language]?.[key] ?? translations.en[key] ?? key
}
