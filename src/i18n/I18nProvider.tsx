import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  readLanguageFromQuery,
  readSavedLanguage,
  resolveInitialLanguage,
  writeLanguagePreference,
} from './cookie';
import { locales } from './locales';
import { DEFAULT_LANG, VALID_LANGS, type Lang, type Translation } from './types';

const SITE_ORIGIN = 'https://sidnei-almeida.github.io';

/** og:locale wants a full locale tag, not the bare language code. */
const OG_LOCALES: Record<Lang, string> = {
  en: 'en_US',
  pt: 'pt_BR',
  es: 'es_ES',
};

/** Only these paths are published as language alternates in sitemap.xml. */
const MULTILINGUAL_PATHS = new Set(['/', '/projects', '/resume', '/contact']);

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(selector);

  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }

  node.setAttribute('content', content);
}

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
    // A `?lang=` in the URL wins over the stored preference, so shared and
    // crawled links always render in the language they advertise.
    const fromQuery = readLanguageFromQuery(location.search);

    if (fromQuery) {
      writeLanguagePreference(fromQuery);
      setCurrentLang(fromQuery);
      return;
    }

    setCurrentLang(readSavedLanguage() ?? resolveInitialLanguage());
  }, [location.pathname, location.search]);

  const t = useMemo(() => locales[currentLang], [currentLang]);

  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.title = t.meta.title;

    upsertMeta('meta[name="description"]', 'name', 'description', t.meta.description);
    upsertMeta('meta[name="keywords"]', 'name', 'keywords', t.meta.keywords);

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', t.meta.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', t.meta.description);
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', OG_LOCALES[currentLang]);

    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', t.meta.title);
    upsertMeta(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      t.meta.description,
    );
  }, [currentLang, t.meta.description, t.meta.keywords, t.meta.title]);

  useEffect(() => {
    const path = location.pathname;
    const isMultilingual = MULTILINGUAL_PATHS.has(path);

    // Each language variant is its own canonical URL; the bare path is x-default.
    const canonicalHref =
      isMultilingual && currentLang !== DEFAULT_LANG
        ? `${SITE_ORIGIN}${path}?lang=${currentLang}`
        : `${SITE_ORIGIN}${path}`;

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalHref;

    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalHref);

    document.querySelectorAll('link[data-hreflang]').forEach((node) => node.remove());

    // Only pages that actually exist in every language get alternates;
    // pointing three hreflangs at one URL is what search engines reject.
    if (!isMultilingual) {
      return;
    }

    const alternates: Array<{ hreflang: string; href: string }> = [
      ...VALID_LANGS.map((lang) => ({
        hreflang: lang,
        href: `${SITE_ORIGIN}${path}?lang=${lang}`,
      })),
      { hreflang: 'x-default', href: `${SITE_ORIGIN}${path}` },
    ];

    for (const item of alternates) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = item.hreflang;
      link.href = item.href;
      link.setAttribute('data-hreflang', 'true');
      document.head.appendChild(link);
    }
  }, [currentLang, location.pathname]);

  const value = useMemo(
    () => ({ t, currentLang, setLanguage }),
    [t, currentLang, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
