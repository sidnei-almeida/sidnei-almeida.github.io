import { ArrowLeft, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExerciseCodeBlock } from '../components/exercise/ExerciseCodeBlock';
import { ExerciseDownloadLink } from '../components/exercise/ExerciseDownloadLink';
import { ExerciseProjectGuide } from '../components/exercise/ExerciseProjectGuide';
import { ExerciseSectionHeader } from '../components/exercise/ExerciseSectionHeader';
import { SectionReveal } from '../components/motion/SectionReveal';
import { Button } from '../components/ui/Button';
import { SectionLabel } from '../components/ui/SectionLabel';
import { profile } from '../data/profile';
import { PEDIDOS_SAMPLE_CODE, TERMINAL_OUTPUT_SAMPLE } from '../data/pythonExerciseSamples';
import { useTranslation } from '../i18n/useTranslation';
import { fadeUpItem, sectionStaggerContainer } from '../lib/motion';

function ExerciseSection({
  id,
  children,
  className = '',
  tone = 'default',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'alt';
}) {
  return (
    <section
      id={id}
      className={`exercise-section exercise-section--${tone} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export function PythonOrdersExercisePage() {
  const { t } = useTranslation();
  const pe = t.pythonExercise;

  return (
    <div className="exercise-page section-border">
      <div className="exercise-page__inner page-container">
        <SectionReveal>
          <motion.div variants={fadeUpItem}>
            <Link
              to="/"
              className="exercise-back-link mb-10 inline-flex cursor-pointer items-center gap-2 lg:mb-12"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              {pe.back}
            </Link>
          </motion.div>
        </SectionReveal>

        <SectionReveal variants={sectionStaggerContainer}>
          <motion.div variants={fadeUpItem} className="exercise-hero">
            <SectionLabel>{pe.hero.label}</SectionLabel>
            <h1 className="exercise-hero__title mt-5">{pe.hero.title}</h1>
            <p className="exercise-hero__subtitle mt-5">{pe.hero.subtitle}</p>
            <p className="exercise-hero__description mt-4">{pe.hero.description}</p>
            <div className="exercise-hero__actions mt-10">
              <ExerciseDownloadLink>{pe.hero.ctaDownload}</ExerciseDownloadLink>
              <Button variant="outline" href="#escolha-os" className="exercise-hero__os-btn">
                {pe.hero.ctaInstructions}
              </Button>
            </div>
            <div className="exercise-hero__divider" aria-hidden />
          </motion.div>
        </SectionReveal>

        <ExerciseSection id="guia-projeto" tone="alt">
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel exercise-panel--guide">
              <ExerciseSectionHeader title={pe.projectSetup.title} />
              <ExerciseProjectGuide />
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection id="simulacao">
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel">
              <ExerciseSectionHeader title={pe.simulation.title} />
              <p className="section-body mt-6">{pe.simulation.intro}</p>
              <ul className="exercise-field-pills mt-8">
                {pe.simulation.fields.map((field) => (
                  <li key={field}>
                    <span className="exercise-field-pills__tag">{field}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection tone="alt">
          <SectionReveal variants={sectionStaggerContainer}>
            <motion.div variants={fadeUpItem}>
              <ExerciseSectionHeader title={pe.concepts.title} subtitle={pe.concepts.subtitle} />
            </motion.div>
            <motion.div variants={fadeUpItem} className="exercise-concept-grid mt-8">
              {pe.concepts.items.map((item, index) => (
                <div key={item} className="exercise-concept-card">
                  <span className="exercise-concept-card__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="exercise-concept-card__label">{item}</span>
                </div>
              ))}
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel">
              <ExerciseSectionHeader title={pe.dataStructure.title} />
              <div className="mt-8">
                <ExerciseCodeBlock code={PEDIDOS_SAMPLE_CODE} />
              </div>
              <ul className="exercise-def-list mt-8">
                {pe.dataStructure.explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-6 max-w-xl">
                <ExerciseCodeBlock code={pe.dataStructure.accessExample} language="python" />
              </div>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection id="instrucoes" tone="alt">
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel">
              <ExerciseSectionHeader title={pe.implement.title} subtitle={pe.implement.subtitle} />
              <ul className="exercise-checklist mt-10">
                {pe.implement.functions.map((fn) => (
                  <li key={fn.name} className="exercise-checklist__item">
                    <span className="exercise-checklist__icon" aria-hidden>
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div>
                      <code className="exercise-checklist__fn">{fn.name}</code>
                      <p className="exercise-checklist__desc">{fn.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.aside variants={fadeUpItem} className="exercise-highlight-callout">
              <h2 className="exercise-highlight-callout__title">{pe.encouragement.title}</h2>
              <p className="exercise-highlight-callout__body">{pe.encouragement.body}</p>
            </motion.aside>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection tone="alt">
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel">
              <ExerciseSectionHeader title={pe.output.title} subtitle={pe.output.subtitle} />
              <div className="mt-8">
                <ExerciseCodeBlock
                  code={TERMINAL_OUTPUT_SAMPLE}
                  language="text"
                  variant="terminal"
                />
              </div>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel exercise-panel--quote">
              <ExerciseSectionHeader title={pe.why.title} />
              <p className="section-body mt-6 max-w-3xl">{pe.why.body}</p>
              <blockquote className="exercise-quote mt-8">{pe.why.quote}</blockquote>
              <p className="exercise-forward-note mt-8">{pe.nextStep}</p>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <SectionReveal>
          <motion.div variants={fadeUpItem} className="exercise-cta">
            <h2 className="exercise-cta__title">{pe.cta.title}</h2>
            <p className="exercise-cta__body">{pe.cta.body}</p>
            <p className="exercise-closing-note">{pe.closingNote}</p>
            <div className="exercise-cta__actions">
              <ExerciseDownloadLink className="exercise-cta__download-primary">
                {pe.cta.download}
              </ExerciseDownloadLink>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="exercise-cta__github type-button inline-flex h-11 items-center gap-2 rounded-btn border border-line bg-transparent px-6 text-ink-primary transition-colors duration-300 hover:border-accent/40 hover:text-ink-bright"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                {pe.cta.github}
              </a>
              <Link to="/" className="exercise-cta__back">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                {pe.cta.back}
              </Link>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </div>
  );
}
