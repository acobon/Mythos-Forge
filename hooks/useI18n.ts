import { useCallback } from 'react';
import { Locale, TranslationKey } from '../types';
import { translations } from '../data/translations';
import { useAppSelector } from '../state/hooks';

export const useI18n = () => {
  const locale = useAppSelector(state => state.ui.locale);

  const t = useCallback((key: TranslationKey | string, replacements?: Record<string, string | number>): string => {
    let translation: string = (translations[locale]?.[key as TranslationKey] || translations['en']?.[key as TranslationKey] || key) as string;
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, String(value));
      });
    }
    return translation;
  }, [locale]);

  return { t };
};
