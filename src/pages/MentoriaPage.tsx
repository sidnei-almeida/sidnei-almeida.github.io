import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MentoriaModuleAccordion } from '../components/mentoria/MentoriaModuleAccordion';
import { mentoriaModules } from '../data/mentoriaModules';
import { useTranslation } from '../i18n/useTranslation';
import { fadeUpItem, sectionStaggerContainer } from '../lib/motion';
import { SectionReveal } from '../components/motion/SectionReveal';
import { Button } from '../components/ui/Button';
import { SectionLabel } from '../components/ui/SectionLabel';

export function MentoriaPage() {
  const { t } = useTranslation();
  const m = t.mentoria;

  return (
    <div className="mentoria-page section-border">
      <div className="mentoria-page__inner page-container">
        <SectionReveal>
          <motion.div variants={fadeUpItem}>
            <Link
              to="/"
              className="mb-8 inline-flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100 lg:mb-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              {m.back}
            </Link>
          </motion.div>
        </SectionReveal>

        <SectionReveal variants={sectionStaggerContainer}>
          <motion.div
            variants={fadeUpItem}
            className="mentoria-hero carbon-fiber-surface border border-line bg-panel p-6 lg:p-10"
          >
            <SectionLabel>{m.hero.label}</SectionLabel>
            <h1 className="type-section-heading mt-4 text-[clamp(2rem,4.5vw,3rem)]">{m.hero.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-body">{m.hero.subtitle}</p>
            <div className="mentoria-notice mt-6 max-w-2xl border border-line border-l-2 border-l-accent bg-panel/30 px-4 py-3">
              <p className="text-sm leading-relaxed text-ink-secondary">{m.hero.notice}</p>
            </div>
          </motion.div>
        </SectionReveal>

        <section className="mentoria-section" aria-labelledby="mentoria-curriculum-heading">
          <SectionReveal variants={sectionStaggerContainer} className="mt-10 lg:mt-12">
            <motion.div variants={fadeUpItem} className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
              <div>
                <SectionLabel>{m.curriculum.label}</SectionLabel>
                <h2
                  id="mentoria-curriculum-heading"
                  className="type-section-heading mt-3 text-[clamp(1.35rem,2.8vw,1.75rem)] text-ink-primary"
                >
                  {m.curriculum.title}
                </h2>
              </div>
              <p className="hidden max-w-xs text-right text-xs leading-relaxed text-ink-muted sm:block">
                {m.curriculum.hint}
              </p>
            </motion.div>

            <div className="mentoria-modules space-y-3">
              {mentoriaModules.map((meta, index) => (
                <motion.div key={meta.id} variants={fadeUpItem}>
                  <MentoriaModuleAccordion
                    meta={meta}
                    defaultOpen={index === 0 && meta.status === 'available' && meta.kind === 'lessons'}
                  />
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        </section>

        <section className="mentoria-section mentoria-cta" aria-labelledby="mentoria-cta-heading">
          <SectionReveal variants={sectionStaggerContainer} className="mt-10 lg:mt-14">
            <motion.div
              variants={fadeUpItem}
              className="border border-line bg-canvas p-6 text-center lg:p-10"
            >
              <h2 id="mentoria-cta-heading" className="text-lg font-medium tracking-tight text-ink-primary lg:text-xl">
                {m.cta.title}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-secondary">{m.cta.body}</p>
              <div className="mt-6 flex justify-center">
                <Button href="/contact" variant="outline" mono className="h-[44px] px-6">
                  {m.cta.button}
                </Button>
              </div>
            </motion.div>
          </SectionReveal>
        </section>
      </div>
    </div>
  );
}
