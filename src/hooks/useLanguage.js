import { useContext } from 'react';
import { LanguageContext } from '../App';
import { t as translate } from '../translations';

export const useLanguage = () => {
  const { language, setLanguage } = useContext(LanguageContext);

  const t = (key) => translate(language, key);

  return {
    language,
    setLanguage,
    t,
    isRTL: language === 'ar'
  };
};