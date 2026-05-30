import { DEFAULT_LANG, VALID_LANGS, type Lang } from './types';

const COOKIE_NAME = 'lang';
const STORAGE_KEY = 'lang';
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export function detectBrowserLanguage(): Lang {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANG;
  }

  const candidates =
    navigator.languages?.length > 0 ? navigator.languages : [navigator.language];

  for (const raw of candidates) {
    if (!raw) {
      continue;
    }

    const base = raw.toLowerCase().split('-')[0];

    if (base === 'pt') {
      return 'pt';
    }

    if (base === 'es') {
      return 'es';
    }

    if (base === 'en') {
      return 'en';
    }
  }

  return DEFAULT_LANG;
}

function readLangCookie(): Lang | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match?.[1];

  if (value && VALID_LANGS.includes(value as Lang)) {
    return value as Lang;
  }

  return null;
}

function readLangLocalStorage(): Lang | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const value = localStorage.getItem(STORAGE_KEY);

    if (value && VALID_LANGS.includes(value as Lang)) {
      return value as Lang;
    }
  } catch {
    // ignore blocked storage
  }

  return null;
}

function writeLangCookie(lang: Lang): void {
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

function writeLangLocalStorage(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore blocked storage
  }
}

export function readSavedLanguage(): Lang | null {
  const fromCookie = readLangCookie();
  const fromStorage = readLangLocalStorage();

  if (fromCookie && fromStorage && fromCookie !== fromStorage) {
    writeLanguagePreference(fromCookie);
    return fromCookie;
  }

  if (fromCookie) {
    if (!fromStorage) {
      writeLangLocalStorage(fromCookie);
    }
    return fromCookie;
  }

  if (fromStorage) {
    writeLangCookie(fromStorage);
    return fromStorage;
  }

  return null;
}

export function writeLanguagePreference(lang: Lang): void {
  writeLangCookie(lang);
  writeLangLocalStorage(lang);
}

export function resolveInitialLanguage(): Lang {
  const saved = readSavedLanguage();

  if (saved) {
    return saved;
  }

  const detected = detectBrowserLanguage();
  writeLanguagePreference(detected);
  return detected;
}
