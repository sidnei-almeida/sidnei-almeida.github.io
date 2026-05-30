import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUpItem, sectionStaggerContainer } from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionReveal } from '../motion/SectionReveal';
import { SectionLabel } from '../ui/SectionLabel';

export function WhatIDoSection() {
  const { t } = useTranslation();

  return (
    <section className="relative flex min-h-full w-full flex-col overflow-hidden bg-canvas p-10 lg:p-12">
      <SectionReveal>
        <SectionLabel animated>{t.whatIDo.label}</SectionLabel>
      </SectionReveal>

      <SectionReveal variants={sectionStaggerContainer} className="mt-6 w-full">
        <ul className="space-y-4">
          {t.whatIDo.items.map((item) => (
            <motion.li
              key={item}
              variants={fadeUpItem}
              className="type-body flex items-start gap-2.5 text-ink-body"
            >
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.5} />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </SectionReveal>
    </section>
  );
}
