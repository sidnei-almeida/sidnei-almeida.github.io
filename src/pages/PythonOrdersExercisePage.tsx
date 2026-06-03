import { ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExerciseCodeBlock } from '../components/exercise/ExerciseCodeBlock';
import { ExerciseDownloadLink } from '../components/exercise/ExerciseDownloadLink';
import { SectionReveal } from '../components/motion/SectionReveal';
import { Button } from '../components/ui/Button';
import { SectionLabel } from '../components/ui/SectionLabel';
import { profile } from '../data/profile';
import { GITHUB_TREE_SAMPLE, PEDIDOS_SAMPLE_CODE, TERMINAL_OUTPUT_SAMPLE } from '../data/pythonExerciseSamples';
import { ExerciseRunGuide } from '../components/exercise/ExerciseRunGuide';
import { useTranslation } from '../i18n/useTranslation';
import { fadeUpItem, sectionStaggerContainer } from '../lib/motion';

function ExerciseSection({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`exercise-section ${className}`.trim()}>
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
              className="mb-8 inline-flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100 lg:mb-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              {pe.back}
            </Link>
          </motion.div>
        </SectionReveal>

        <SectionReveal variants={sectionStaggerContainer}>
          <motion.div
            variants={fadeUpItem}
            className="exercise-hero carbon-fiber-surface border border-line bg-panel p-6 lg:p-10"
          >
            <SectionLabel>{pe.hero.label}</SectionLabel>
            <h1 className="type-section-heading mt-4 text-[clamp(2rem,4.5vw,3rem)]">{pe.hero.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-body">{pe.hero.subtitle}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-secondary">{pe.hero.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button variant="outline" href="#instrucoes" className="h-[44px] px-6">
                {pe.hero.ctaInstructions}
              </Button>
              <ExerciseDownloadLink>{pe.hero.ctaDownload}</ExerciseDownloadLink>
            </div>
          </motion.div>
        </SectionReveal>

        <ExerciseSection id="simulacao">
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel border border-line bg-panel p-6 lg:p-8">
              <h2 className="type-subsection-heading text-ink-primary">{pe.simulation.title}</h2>
              <p className="section-body mt-3 max-w-3xl">{pe.simulation.intro}</p>
              <ul className="exercise-list mt-5">
                {pe.simulation.fields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal variants={sectionStaggerContainer}>
            <motion.div variants={fadeUpItem}>
              <h2 className="type-subsection-heading text-ink-primary">{pe.concepts.title}</h2>
              <p className="section-body mt-2 max-w-2xl">{pe.concepts.subtitle}</p>
            </motion.div>
            <div className="exercise-concept-grid mt-6">
              {pe.concepts.items.map((item, index) => (
                <motion.div
                  key={item}
                  variants={fadeUpItem}
                  className="exercise-concept-card border border-line bg-panel px-4 py-3"
                >
                  <span className="exercise-concept-card__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="exercise-concept-card__label">{item}</span>
                </motion.div>
              ))}
            </div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel border border-line bg-panel p-6 lg:p-8">
              <h2 className="type-subsection-heading text-ink-primary">{pe.dataStructure.title}</h2>
              <div className="mt-5">
                <ExerciseCodeBlock code={PEDIDOS_SAMPLE_CODE} />
              </div>
              <ul className="exercise-list mt-5">
                {pe.dataStructure.explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-4">
                <ExerciseCodeBlock
                  code={pe.dataStructure.accessExample}
                  language="python"
                />
              </div>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection id="instrucoes">
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel border border-line bg-panel p-6 lg:p-8">
              <h2 className="type-subsection-heading text-ink-primary">{pe.implement.title}</h2>
              <p className="section-body mt-2">{pe.implement.subtitle}</p>
              <ul className="exercise-checklist mt-6">
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
            <motion.aside
              variants={fadeUpItem}
              className="exercise-callout border border-line bg-panel/80 p-6 lg:p-7"
            >
              <h2 className="exercise-callout__title">{pe.encouragement.title}</h2>
              <p className="exercise-callout__body mt-3">{pe.encouragement.body}</p>
            </motion.aside>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel border border-line bg-panel p-6 lg:p-8">
              <h2 className="type-subsection-heading text-ink-primary">{pe.run.title}</h2>
              <ExerciseRunGuide />
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel border border-line bg-panel p-6 lg:p-8">
              <h2 className="type-subsection-heading text-ink-primary">{pe.output.title}</h2>
              <p className="section-body mt-2">{pe.output.subtitle}</p>
              <div className="mt-5">
                <ExerciseCodeBlock code={TERMINAL_OUTPUT_SAMPLE} language="text" />
              </div>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.div variants={fadeUpItem} className="exercise-panel border border-line bg-panel p-6 lg:p-8">
              <h2 className="type-subsection-heading text-ink-primary">{pe.github.title}</h2>
              <p className="section-body mt-2">{pe.github.intro}</p>
              <p className="mt-4 font-mono text-sm text-accent">
                {pe.github.repoName}
              </p>
              <div className="mt-4">
                <ExerciseCodeBlock code={GITHUB_TREE_SAMPLE} language="text" />
              </div>
              <p className="mt-5 text-sm text-ink-secondary">README.md:</p>
              <ul className="exercise-list mt-2">
                {pe.github.readmeItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <ExerciseSection>
          <SectionReveal>
            <motion.div
              variants={fadeUpItem}
              className="exercise-panel exercise-panel--quote carbon-fiber-surface border border-line bg-panel p-6 lg:p-8"
            >
              <h2 className="type-subsection-heading text-ink-primary">{pe.why.title}</h2>
              <p className="section-body mt-3 max-w-3xl">{pe.why.body}</p>
              <blockquote className="exercise-quote mt-6">{pe.why.quote}</blockquote>
              <p className="mt-5 text-sm leading-relaxed text-ink-muted">{pe.nextStep}</p>
            </motion.div>
          </SectionReveal>
        </ExerciseSection>

        <SectionReveal>
          <motion.div
            variants={fadeUpItem}
            className="exercise-cta carbon-fiber-surface border border-line bg-panel p-6 text-center lg:p-10"
          >
            <h2 className="type-subsection-heading text-ink-primary">{pe.cta.title}</h2>
            <p className="section-body mx-auto mt-3 max-w-lg">{pe.cta.body}</p>
            <p className="exercise-closing-note mx-auto mt-5 max-w-xl">{pe.closingNote}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <ExerciseDownloadLink>{pe.cta.download}</ExerciseDownloadLink>
              <Button variant="outline" href="/" className="h-[44px] px-6">
                {pe.cta.back}
              </Button>
              <Button variant="ghost" href={profile.github}>
                {pe.cta.github}
              </Button>
            </div>
          </motion.div>
        </SectionReveal>
      </div>
    </div>
  );
}
