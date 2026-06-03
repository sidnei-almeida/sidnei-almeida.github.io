import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LINUX_VENV_COMMANDS,
  WINDOWS_CMD_COMMANDS,
  WINDOWS_POWERSHELL_COMMANDS,
} from '../../data/pythonExerciseSamples';
import { useTranslation } from '../../i18n/useTranslation';
import { ExerciseCodeBlock } from './ExerciseCodeBlock';

type Platform = 'linux' | 'windows';

export function ExerciseRunGuide() {
  const { t } = useTranslation();
  const run = t.pythonExercise.run;
  const [platform, setPlatform] = useState<Platform>('linux');

  return (
    <div className="exercise-run-guide">
      <p className="section-body">{run.stepsIntro}</p>
      <p className="exercise-run-guide__venv-intro mt-4">{run.venvIntro}</p>

      <div
        className="exercise-platform-tabs mt-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label={run.platformTabsAria}
      >
        <button
          type="button"
          role="tab"
          aria-selected={platform === 'linux'}
          onClick={() => setPlatform('linux')}
          className={`exercise-platform-tabs__btn ${
            platform === 'linux' ? 'exercise-platform-tabs__btn--active' : ''
          }`}
        >
          {run.platformLinux}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={platform === 'windows'}
          onClick={() => setPlatform('windows')}
          className={`exercise-platform-tabs__btn ${
            platform === 'windows' ? 'exercise-platform-tabs__btn--active' : ''
          }`}
        >
          {run.platformWindows}
        </button>
      </div>

      {platform === 'linux' ? (
        <motion.div
          key="linux"
          role="tabpanel"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
        >
          <p className="text-sm leading-relaxed text-ink-secondary">{run.linux.intro}</p>
          <div className="mt-4">
            <ExerciseCodeBlock code={LINUX_VENV_COMMANDS} language="bash" />
          </div>
          <p className="mt-4 text-sm text-ink-muted">{run.linux.pythonNote}</p>
          <ol className="exercise-steps mt-5">
            {run.linux.steps.map((step, i) => (
              <li key={step}>
                <span className="exercise-steps__num">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </motion.div>
      ) : (
        <motion.div
          key="windows"
          role="tabpanel"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
        >
          <p className="text-sm leading-relaxed text-ink-secondary">{run.windows.intro}</p>
          <p className="mt-3 text-sm font-medium text-ink-primary">{run.windows.powershellLabel}</p>
          <div className="mt-3">
            <ExerciseCodeBlock code={WINDOWS_POWERSHELL_COMMANDS} language="powershell" />
          </div>
          <p className="mt-4 text-sm text-ink-muted">{run.windows.powershellNote}</p>
          <p className="mt-5 text-sm font-medium text-ink-primary">{run.windows.cmdLabel}</p>
          <div className="mt-3">
            <ExerciseCodeBlock code={WINDOWS_CMD_COMMANDS} language="cmd" />
          </div>
          <ol className="exercise-steps mt-5">
            {run.windows.steps.map((step, i) => (
              <li key={step}>
                <span className="exercise-steps__num">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      <div className="exercise-run-guide__common mt-8 border-t border-line pt-6">
        <p className="text-sm font-medium text-ink-primary">{run.commonTitle}</p>
        <ol className="exercise-steps mt-4">
          {run.commonSteps.map((step, i) => (
            <li key={step}>
              <span className="exercise-steps__num">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
