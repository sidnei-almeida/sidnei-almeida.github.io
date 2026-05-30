import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X1StampCard } from '../brand/X1StampCard';
import { fadeUpItem } from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionReveal } from '../motion/SectionReveal';
import { SectionLabel } from '../ui/SectionLabel';

export function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="relative flex min-h-full border-r border-line bg-canvas">
      <div className="carbon-texture hidden w-3 shrink-0 sm:block lg:w-4" aria-hidden />

      <X1StampCard className="flex w-full flex-1 flex-col border-r-0 p-10 lg:p-12">
        <SectionReveal>
          <SectionLabel animated>{t.about.label}</SectionLabel>

          <motion.p variants={fadeUpItem} className="type-body mt-6 w-full flex-1 text-ink-body">
            {t.about.body}
          </motion.p>

          <motion.div variants={fadeUpItem}>
            <Link
              to="/contact"
              className="type-button mt-10 inline-flex w-fit items-center text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
            >
              {t.about.readMore}
              <span className="ml-2.5 inline-block h-px w-4 bg-accent" aria-hidden />
            </Link>
          </motion.div>
        </SectionReveal>
      </X1StampCard>
    </section>
  );
}
