import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeUpItem, labelLineVariant } from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { TechStackMarquee } from './TechStackMarquee';
import { SectionReveal } from '../motion/SectionReveal';

export function TechStackSection() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4, margin: '-20px 0px' });

  return (
    <section
      ref={ref}
      id="skills"
      className="tech-stack-bar w-full border-y border-line bg-canvas"
      aria-label={t.techStack.ariaLabel}
    >
      <div className="page-container flex min-h-[84px] w-full items-center gap-8 py-0 lg:min-h-[88px] lg:gap-10">
        <SectionReveal className="flex shrink-0 items-center">
          <motion.p variants={fadeUpItem} className="type-section-label flex items-center whitespace-nowrap text-ink-label">
            <motion.span
              variants={labelLineVariant}
              className="mr-3.5 inline-block h-px w-5 origin-left bg-accent"
              aria-hidden
            />
            {t.techStack.label}
          </motion.p>
        </SectionReveal>

        <TechStackMarquee animate={inView} />

        <SectionReveal className="hidden shrink-0 lg:block">
          <motion.div variants={fadeUpItem} className="flex items-center gap-1.5" aria-hidden>
            <span className="h-1 w-1 rounded-full bg-accent/90" />
            <span className="h-1 w-1 rounded-full bg-accent/70" />
            <span className="h-1 w-1 rounded-full bg-accent/50" />
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  );
}
