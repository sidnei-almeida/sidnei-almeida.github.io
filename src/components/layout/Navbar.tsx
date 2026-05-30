import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { profile } from '../../data/profile';
import { navItems } from '../../data/navigation';
import { getSectionIdFromHref, useActiveSection } from '../../hooks/useActiveSection';
import { navEnter, navIndicatorTransition } from '../../lib/motion';
import type { Lang } from '../../i18n/types';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';

const LANGS: Lang[] = ['en', 'pt', 'es'];

function LanguageSwitcher() {
  const { currentLang, setLanguage } = useTranslation();

  return (
    <div className="lang-switcher">
      {LANGS.map((lang, index) => (
        <span key={lang} className="flex items-center gap-1.5">
          {index > 0 && <span className="lang-divider">|</span>}
          <button
            type="button"
            onClick={() => setLanguage(lang)}
            className={`lang-btn ${currentLang === lang ? 'lang-btn--active' : ''}`}
            aria-current={currentLang === lang ? 'true' : undefined}
          >
            {lang.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

function NavActiveIndicator() {
  return (
    <motion.span
      layoutId="nav-active-indicator"
      className="absolute -bottom-1 left-0 right-0 h-px bg-accent"
      transition={navIndicatorTransition}
      aria-hidden
    />
  );
}

function NavLinkLabel({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <span className="relative inline-block">
      {label}
      {isActive && <NavActiveIndicator />}
    </span>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { activeSection, isHome, pathname } = useActiveSection();
  const reduceMotion = useReducedMotion();

  function isNavActive(href: string, isRoute?: boolean) {
    if (isRoute) {
      if (href === '/') {
        return isHome && activeSection === 'home';
      }

      return pathname === href;
    }

    if (href === '/#projects' && pathname === '/projects') {
      return true;
    }

    if (!isHome) {
      return false;
    }

    const sectionId = getSectionIdFromHref(href);
    return sectionId === activeSection;
  }

  function navLinkClassName(isActive: boolean, mobile = false) {
    if (mobile) {
      return `type-nav-link py-2 transition-colors duration-300 ${
        isActive ? 'text-accent' : 'text-ink-body hover:text-accent'
      }`;
    }

    return `type-nav-link relative pb-1 transition-opacity duration-150 ${
      isActive ? 'text-accent opacity-100' : 'text-ink-label opacity-70 hover:text-ink-primary hover:opacity-100'
    }`;
  }

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={navEnter}
      className="sticky top-0 z-50 w-full border-b border-line bg-canvas/95 backdrop-blur-sm"
    >
      <div className="page-container grid h-[72px] grid-cols-[1fr_auto_1fr] items-center">
        <Link
          to="/"
          className="flex items-center justify-self-start text-[13px] font-medium uppercase tracking-brand text-ink-primary"
        >
          <span className="mr-3.5 inline-block h-px w-5 bg-accent" aria-hidden />
          {profile.name}
        </Link>

        <LayoutGroup>
          <nav className="hidden items-center justify-center gap-10 lg:flex xl:gap-12" aria-label={t.aria.mainNav}>
            {navItems.map((item) => {
            const isActive = isNavActive(item.href, item.isRoute);
            const className = navLinkClassName(isActive);
            const label = t.nav[item.labelKey];

            return item.isRoute ? (
              <Link
                key={item.href}
                to={item.href}
                className={className}
                aria-current={isActive ? 'page' : undefined}
              >
                <NavLinkLabel label={label} isActive={isActive} />
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className={className}
                aria-current={isActive ? 'page' : undefined}
              >
                <NavLinkLabel label={label} isActive={isActive} />
              </a>
            );
            })}
          </nav>
        </LayoutGroup>

        <div className="hidden items-center justify-end gap-6 justify-self-end lg:flex">
          <LanguageSwitcher />
          <Button href="/contact" variant="outline" mono className="h-[42px] px-6">
            {t.nav.letsConnect}
          </Button>
        </div>

        <button
          type="button"
          className="col-start-3 inline-flex items-center justify-center justify-self-end border border-line p-2 text-ink-primary lg:hidden"
          aria-label={open ? t.aria.closeMenu : t.aria.openMenu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-canvas lg:hidden" aria-label={t.aria.mobileNav}>
          <div className="page-container flex flex-col gap-1 py-4">
            {navItems.map((item) => {
              const isActive = isNavActive(item.href, item.isRoute);
              const className = navLinkClassName(isActive, true);
              const label = t.nav[item.labelKey];

              return item.isRoute ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className={className}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className={className}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              );
            })}
            <div className="py-3">
              <LanguageSwitcher />
            </div>
            <Button href="/contact" variant="outline" mono className="mt-3 w-full justify-center">
              {t.nav.letsConnect}
            </Button>
          </div>
        </nav>
      )}
    </motion.header>
  );
}
