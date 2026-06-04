import { Globe, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { profile } from '../../data/profile';
import { HeroPortrait } from './HeroPortrait';
import {
  heroBodyVariant,
  heroCtaVariant,
  heroImageVariant,
  heroLeftContainer,
  heroOverlineVariant,
  heroSidebarVariant,
  heroTitleVariant,
} from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import { DownloadTextLink } from '../ui/DownloadTextLink';

function Headline() {
  const { t } = useTranslation();

  return (
    <h1 className="type-hero-headline w-full text-pretty text-[32px] leading-[1.04] text-ink-bright sm:text-[36px] lg:text-[42px] xl:text-[46px] 2xl:text-[48px]">
      {t.hero.headline1}{' '}
      {t.hero.headline2}{' '}
      <span className="text-accent">{t.hero.highlight1}</span>{' '}
      {t.hero.headline3}{' '}
      <span className="text-accent">{t.hero.highlight2}</span>{' '}
      {t.hero.headline4}
    </h1>
  );
}

function HeroOverline() {
  const { t } = useTranslation();

  return (
    <motion.p
      variants={heroOverlineVariant}
      className="type-section-label flex items-center text-ink-label"
    >
      <span className="mr-3.5 inline-block h-px w-5 bg-accent" aria-hidden />
      {t.hero.label}
    </motion.p>
  );
}

type HeroMetaItemProps = {
  icon?: typeof MapPin;
  overline: string;
  value: string;
  showDot?: boolean;
};

function HeroMetaItem({ icon: Icon, overline, value, showDot }: HeroMetaItemProps) {
  return (
    <div className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0 lg:gap-5 lg:px-5 lg:py-[18px]">
      <div className="flex w-5 shrink-0 items-center justify-center">
        {showDot ? (
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        ) : (
          Icon && <Icon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.5} aria-hidden />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-medium uppercase leading-none tracking-[0.22em] text-ink-muted">
          {overline}
        </p>
        <p className="mt-1.5 text-[10px] font-medium uppercase leading-none tracking-[0.18em] text-ink-label">
          {value}
        </p>
      </div>
    </div>
  );
}

export function HeroSection({ compactFoot = false }: { compactFoot?: boolean }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const columnPad = compactFoot ? 'py-10 lg:py-11' : 'py-12 lg:py-14';

  return (
    <section id="home" className="section-border relative w-full overflow-hidden bg-canvas">
      <div className="wide-container grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(440px,0.78fr)_minmax(220px,0.3fr)] lg:items-stretch lg:gap-x-12 xl:gap-x-14">
        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          variants={heroLeftContainer}
          className={`flex min-w-0 flex-col justify-center ${columnPad}`}
        >
          <HeroOverline />
          <motion.div variants={heroTitleVariant} className="mt-6 lg:mt-7">
            <Headline />
          </motion.div>
          <motion.p variants={heroBodyVariant} className="type-body mt-5 max-w-[560px] text-ink-body lg:mt-6">
            {t.hero.body}
          </motion.p>
          <motion.div
            variants={heroCtaVariant}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-8"
          >
            <Button href="#projects" variant="outline" className="h-[44px] px-6">
              {t.hero.ctaPrimary}
            </Button>
            <DownloadTextLink href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
              {t.hero.ctaSecondary}
            </DownloadTextLink>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          variants={heroImageVariant}
          className="relative flex min-h-[340px] items-end justify-center overflow-hidden bg-panel-elevated/70 sm:min-h-[380px] lg:h-full lg:min-h-0"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_55%_100%,rgba(255,255,255,0.04)_0%,transparent_60%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-panel-elevated to-transparent"
            aria-hidden
          />
          <HeroPortrait alt={t.hero.portraitAlt} />
        </motion.div>

        <motion.aside
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          variants={heroSidebarVariant}
          className={`flex flex-col justify-center lg:max-w-[260px] lg:justify-self-end lg:self-stretch xl:max-w-[280px] ${columnPad}`}
        >
          <div className="border border-line bg-panel/20">
            <HeroMetaItem
              icon={MapPin}
              overline={t.hero.metaBasedIn}
              value={t.hero.metaBasedInValue}
            />
            <HeroMetaItem
              overline={t.hero.metaAvailableFor}
              value={t.hero.metaAvailableValue}
              showDot
            />
            <HeroMetaItem icon={Globe} overline={t.hero.metaOpenTo} value={t.hero.metaOpenToValue} />
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
