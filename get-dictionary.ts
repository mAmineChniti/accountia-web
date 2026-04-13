import type { Locale } from '@/i18n-config';
import type en from './dictionaries/en.json';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) =>
  dictionaries[locale]?.() ?? dictionaries.en();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dictionary = any;
