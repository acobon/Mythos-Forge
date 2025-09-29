// types/i18n.ts
import { translations } from '../data/translations';

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}