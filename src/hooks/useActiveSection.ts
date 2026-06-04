import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const HOME_SECTION_IDS = [
  'home',
  'projects',
  'skills',
  'about',
  'contact',
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

const ACTIVATION_THRESHOLD = 0.4;

function isHomeSectionId(value: string): value is HomeSectionId {
  return HOME_SECTION_IDS.includes(value as HomeSectionId);
}

function resolveInitialSection(hash: string): HomeSectionId {
  const id = hash.replace('#', '');
  return isHomeSectionId(id) ? id : 'home';
}

export function useActiveSection() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [activeSection, setActiveSection] = useState<HomeSectionId>(() =>
    location.pathname === '/' ? resolveInitialSection(location.hash) : 'home',
  );

  useEffect(() => {
    if (!isHome) {
      return;
    }

    if (location.hash) {
      setActiveSection(resolveInitialSection(location.hash));
    }
  }, [isHome, location.hash]);

  useEffect(() => {
    if (!isHome) {
      return;
    }

    const visibility = new Map<string, number>();
    const elements = HOME_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[];

    if (elements.length === 0) {
      return;
    }

    const pickActive = () => {
      let bestAboveThreshold: HomeSectionId | null = null;
      let bestAboveRatio = 0;
      let fallbackId: HomeSectionId = 'home';
      let fallbackRatio = 0;

      for (const id of HOME_SECTION_IDS) {
        const ratio = visibility.get(id) ?? 0;

        if (ratio >= ACTIVATION_THRESHOLD && ratio >= bestAboveRatio) {
          bestAboveRatio = ratio;
          bestAboveThreshold = id;
        }

        if (ratio > fallbackRatio) {
          fallbackRatio = ratio;
          fallbackId = id;
        }
      }

      const next = bestAboveThreshold ?? (fallbackRatio > 0 ? fallbackId : null);

      if (next) {
        setActiveSection(next);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio);
        }
        pickActive();
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-15% 0px -45% 0px',
      },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [isHome]);

  return {
    activeSection,
    isHome,
    pathname: location.pathname,
  };
}

export function getSectionIdFromHref(href: string): string | null {
  const hashIndex = href.indexOf('#');

  if (hashIndex === -1) {
    return null;
  }

  return href.slice(hashIndex + 1);
}
