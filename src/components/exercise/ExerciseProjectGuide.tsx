import {
  GIT_PUBLISH,
  README_TEMPLATE,
  REPORT_ACTIVE,
  REPORT_COMMENTED,
  TEST_FUNCTION_SNIPPET,
} from '../../data/pythonExerciseSamples';
import { useTranslation } from '../../i18n/useTranslation';
import { ExerciseBeforeAfter } from './ExerciseBeforeAfter';
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

      <div className="exercise-project-guide__continued">
        <h3 className="exercise-continued-heading">{g.continuedTitle}</h3>
        <p className="section-body mt-3 max-w-3xl">{g.continuedIntro}</p>

        <div className="exercise-steps-stack mt-10">
          <ExerciseStepCard number={7} title={g.step7.title}>
            <p className="exercise-step-card__prose">{g.step7.body}</p>
            <div className="mt-5">
              <ExerciseCodeBlock code={TEST_FUNCTION_SNIPPET} language="python" />
            </div>
            <p className="exercise-step-card__note mt-5">{g.step7.note}</p>
          </ExerciseStepCard>

          <ExerciseStepCard number={8} title={g.step8.title}>
            <p className="exercise-step-card__prose">{g.step8.body}</p>
            <div className="mt-5">
              <ExerciseBeforeAfter
                beforeLabel={g.step8.beforeLabel}
                afterLabel={g.step8.afterLabel}
                beforeCode={REPORT_COMMENTED}
                afterCode={REPORT_ACTIVE}
              />
            </div>
          </ExerciseStepCard>

          <ExerciseStepCard number={9} title={g.step9.title}>
            <p className="exercise-step-card__prose">{g.step9.body}</p>
            <div className="mt-5">
              <ExerciseCodeBlock code={README_TEMPLATE} language="markdown" scrollable />
            </div>
            <p className="exercise-step-card__note mt-5">{g.step9.note}</p>
          </ExerciseStepCard>

          <ExerciseStepCard number={10} title={g.step10.title}>
            <p className="exercise-step-card__prose">{g.step10.body}</p>
            <div className="mt-5">
              <ExerciseCodeBlock code={GIT_PUBLISH} language="bash" />
            </div>
            <p className="exercise-step-card__prose mt-5">
              {g.step10.repoHint}{' '}
              <span className="exercise-inline-code exercise-inline-code--accent">{g.step10.repoName}</span>
            </p>
            <p className="exercise-step-card__note mt-4">{g.step10.githubNote}</p>
          </ExerciseStepCard>
        </div>
      </div>
    </div>
  );
}
