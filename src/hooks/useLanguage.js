import { useContext } from 'react';
import { LanguageContext } from '../App';
import { getTranslation } from '../translations';

export const useLanguage = () => {
  const { language, setLanguage } = useContext(LanguageContext);

  const t = (key) => {
    return getTranslation(language, key);
  };

  return {
    language,
    setLanguage,
    t,
    isRTL: language === 'ar'
  };
};