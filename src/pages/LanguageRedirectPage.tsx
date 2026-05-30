import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { DEFAULT_LANG, VALID_LANGS, type Lang } from '../i18n/types';

export function LanguageRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { setLanguage } = useTranslation();

  useEffect(() => {
    const lang = VALID_LANGS.includes(code as Lang) ? (code as Lang) : DEFAULT_LANG;
    setLanguage(lang);

    let target = '/';

    if (document.referrer) {
      try {
        const refererUrl = new URL(document.referrer);
        if (refererUrl.origin === window.location.origin) {
          target = refererUrl.pathname + refererUrl.search + refererUrl.hash;
        }
      } catch {
        // ignore invalid referer
      }
    }

    if (target.startsWith('/lang/')) {
      target = '/';
    }

    navigate(target, { replace: true });
  }, [code, navigate, setLanguage]);

  return null;
}
