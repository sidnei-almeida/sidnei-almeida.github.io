import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { readSavedLanguage, resolveInitialLanguage, writeLanguagePreference } from './cookie';
import { locales } from './locales';
import { DEFAULT_LANG, VALID_LANGS, type Lang, type Translation } from './types';

type I18nContextValue = {
  t: Translation;
  currentLang: Lang;
  setLanguage: (lang: Lang) => void;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const location = useLocation();
  const [currentLang, setCurrentLang] = useState<Lang>(() => resolveInitialLanguage());

  const setLanguage = useCallback((lang: Lang) => {
    const next = VALID_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    writeLanguagePreference(next);
    setCurrentLang(next);
  }, []);

  useEffect(() => {
    setCurrentLang(readSavedLanguage() ?? resolveInitialLanguage());
  }, [location.pathname]);

  const t = useMemo(() => locales[currentLang], [currentLang]);

  useEffect(() => {
    document.documentElement.lang = currentLang;

    document.title = t.meta.title;

    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', t.meta.description);
  }, [currentLang, t.meta.description, t.meta.title]);

  useEffect(() => {
    const origin = window.location.origin;
    const path = location.pathname + location.search;

    const hreflangs: Array<{ lang: Lang; href: string }> = [
      { lang: 'en', href: `${origin}${path}` },
      { lang: 'pt', href: `${origin}${path}` },
      { lang: 'es', href: `${origin}${path}` },
    ];

    document.querySelectorAll('link[data-hreflang]').forEach((node) => node.remove());

    for (const item of hreflangs) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = item.lang;
      link.href = item.href;
      link.setAttribute('data-hreflang', 'true');
      document.head.appendChild(link);
    }

    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${origin}${path}`;
    defaultLink.setAttribute('data-hreflang', 'true');
    document.head.appendChild(defaultLink);
  }, [location.pathname, location.search]);

  const value = useMemo(
    () => ({ t, currentLang, setLanguage }),
    [t, currentLang, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
