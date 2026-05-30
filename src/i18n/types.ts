import type en from '../../locales/en.json';

export type Lang = 'en' | 'pt' | 'es';

export type Translation = typeof en;

export const VALID_LANGS: Lang[] = ['en', 'pt', 'es'];

export const DEFAULT_LANG: Lang = 'en';

export type NavLabelKey = Exclude<keyof Translation['nav'], 'letsConnect'>;
