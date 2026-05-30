import { motion } from 'framer-motion';
import { techStack } from '../../data/skills';
import { fadeInFromLeft, techStackStaggerContainer } from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { TechStackIcon } from '../ui/TechStackIcon';

const MARQUEE_ITEMS = [...techStack, ...techStack];

type TechStackMarqueeProps = {
  animate?: boolean;
};

export function TechStackMarquee({ animate = false }: TechStackMarqueeProps) {
  const { t } = useTranslation();

  return (
    <div className="tech-stack-marquee-wrap group/marquee relative min-w-0 flex-1 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-canvas via-canvas/80 to-transparent sm:w-14"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-canvas via-canvas/80 to-transparent sm:w-14"
        aria-hidden
      />

      <div className="tech-stack-marquee flex w-max items-center group-hover/marquee:[animation-play-state:paused]">
        <motion.ul
          initial={animate ? 'hidden' : false}
          animate={animate ? 'visible' : undefined}
          variants={techStackStaggerContainer}
          className="flex items-center gap-8 pr-8 lg:gap-10 xl:gap-[38px]"
          aria-label={t.techStack.technologiesAria}
        >
          {MARQUEE_ITEMS.map((item, index) => {
            const isPrimary = index < techStack.length;

            if (animate && isPrimary) {
              return (
                <motion.li
                  key={`${item.name}-${index}`}
                  variants={fadeInFromLeft}
                  className="flex shrink-0 items-center gap-2"
                >
                  <TechStackIcon item={item} />
                  <span className="whitespace-nowrap text-xs text-ink-label">{item.name}</span>
                </motion.li>
              );
            }

            return (
              <li key={`${item.name}-${index}`} className="flex shrink-0 items-center gap-2">
                <TechStackIcon item={item} />
                <span className="whitespace-nowrap text-xs text-ink-label">{item.name}</span>
              </li>
            );
          })}
        </motion.ul>
      </div>
    </div>
  );
}
