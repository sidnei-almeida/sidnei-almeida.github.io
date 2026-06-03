import {
  GIT_PUBLISH,
  README_TEMPLATE,
  REPORT_ACTIVE,
  REPORT_COMMENTED,
  TEST_FUNCTION_SNIPPET,
} from '../../data/pythonExerciseSamples';
import { useTranslation } from '../../i18n/useTranslation';
import { ExerciseCodeBlock } from './ExerciseCodeBlock';
import { ExerciseOsSetup } from './ExerciseOsSetup';
import { ExerciseStepCard } from './ExerciseStepCard';

export function ExerciseProjectGuide() {
  const { t } = useTranslation();
  const g = t.pythonExercise.projectSetup;

  return (
    <div className="exercise-project-guide">
      <p className="section-body max-w-3xl">{g.intro}</p>

      <ExerciseOsSetup />

      <div className="exercise-project-guide__continued mt-10 border-t border-line pt-10">
        <h3 className="type-subsection-heading text-ink-primary">{g.continuedTitle}</h3>
        <p className="section-body mt-2 max-w-3xl">{g.continuedIntro}</p>

        <div className="mt-8 space-y-5">
          <ExerciseStepCard number={7} title={g.step7.title}>
            <p className="text-sm leading-relaxed text-ink-secondary">{g.step7.body}</p>
            <div className="mt-4">
              <ExerciseCodeBlock code={TEST_FUNCTION_SNIPPET} language="python" />
            </div>
            <p className="mt-4 text-sm text-ink-muted">{g.step7.note}</p>
          </ExerciseStepCard>

          <ExerciseStepCard number={8} title={g.step8.title}>
            <p className="text-sm leading-relaxed text-ink-secondary">{g.step8.body}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink-muted">{g.step8.beforeLabel}</p>
                <ExerciseCodeBlock code={REPORT_COMMENTED} language="python" />
              </div>
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink-muted">{g.step8.afterLabel}</p>
                <ExerciseCodeBlock code={REPORT_ACTIVE} language="python" />
              </div>
            </div>
          </ExerciseStepCard>

          <ExerciseStepCard number={9} title={g.step9.title}>
            <p className="text-sm leading-relaxed text-ink-secondary">{g.step9.body}</p>
            <div className="mt-4">
              <ExerciseCodeBlock code={README_TEMPLATE} language="markdown" />
            </div>
            <p className="mt-4 text-sm text-ink-muted">{g.step9.note}</p>
          </ExerciseStepCard>

          <ExerciseStepCard number={10} title={g.step10.title}>
            <p className="text-sm leading-relaxed text-ink-secondary">{g.step10.body}</p>
            <div className="mt-4">
              <ExerciseCodeBlock code={GIT_PUBLISH} language="bash" />
            </div>
            <p className="mt-4 text-sm text-ink-secondary">
              {g.step10.repoHint}{' '}
              <span className="font-mono text-accent">{g.step10.repoName}</span>
            </p>
            <p className="mt-3 text-sm text-ink-muted">{g.step10.githubNote}</p>
          </ExerciseStepCard>
        </div>
      </div>
    </div>
  );
}
