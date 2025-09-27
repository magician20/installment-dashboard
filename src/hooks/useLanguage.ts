import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    const initializeDirection = () => {
      const currentLang = i18n.language;
      
      if (currentLang === 'ar') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
        setDirection('rtl');
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
        setDirection('ltr');
      }
    };

    // Initialize direction on mount
    initializeDirection();

    // Listen for language changes
    i18n.on('languageChanged', initializeDirection);

    return () => {
      i18n.off('languageChanged', initializeDirection);
    };
  }, [i18n]);

  return { direction };
}