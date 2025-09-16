import { en } from './en';
import { ar } from './ar';

export const translations = {
  en,
  ar
};

export const getTranslation = (language, key) => {
  return translations[language]?.[key] || translations.en[key] || key;
};