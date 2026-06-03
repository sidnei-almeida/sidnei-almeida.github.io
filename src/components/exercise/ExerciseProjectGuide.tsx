import { useState } from 'react';
import {
  ACTIVATE_LINUX,
  ACTIVATE_WINDOWS_CMD,
  ACTIVATE_WINDOWS_PS,
  GIT_PUBLISH,
  MKDIR_CD,
  PROJECT_TREE,
  README_TEMPLATE,
  REPORT_ACTIVE,
  REPORT_COMMENTED,
  RUN_SCRIPT,
  TEST_FUNCTION_SNIPPET,
  VENV_CREATE,
  VENV_CREATE_LINUX,
  VENV_PROMPT_HINT,
  VSCODE_OPEN,
} from '../../data/pythonExerciseSamples';
import { useTranslation } from '../../i18n/useTranslation';
import { ExerciseCodeBlock } from './ExerciseCodeBlock';
import { ExerciseDownloadLink } from './ExerciseDownloadLink';
import { ExerciseStepCard } from './ExerciseStepCard';

type Platform = 'linux' | 'windows-ps' | 'windows-cmd';

export function ExerciseProjectGuide() {
  const { t } = useTranslation();
  const g = t.pythonExercise.projectSetup;
  const [platform, setPlatform] = useState<Platform>('linux');

  return (
    <div className="exercise-project-guide">
      <p className="section-body max-w-3xl">{g.intro}</p>

      <div className="exercise-project-guide__steps mt-8 space-y-5">
        <ExerciseStepCard number={1} title={g.step1.title}>
          <p className="text-sm leading-relaxed text-ink-secondary">{g.step1.body}</p>
          <div className="mt-4">
            <ExerciseCodeBlock code={MKDIR_CD} language="bash" />
          </div>
        </ExerciseStepCard>

        <ExerciseStepCard number={2} title={g.step2.title}>
          <p className="text-sm leading-relaxed text-ink-secondary">{g.step2.body}</p>
          <div className="mt-4">
            <ExerciseCodeBlock code={VSCODE_OPEN} language="bash" />
          </div>
          <p className="mt-4 text-sm text-ink-muted">{g.step2.note}</p>
        </ExerciseStepCard>

        <ExerciseStepCard number={3} title={g.step3.title}>
          <p className="text-sm leading-relaxed text-ink-secondary">{g.step3.body}</p>
          <div className="mt-4 space-y-3">
            <ExerciseCodeBlock code={VENV_CREATE} language="bash" />
            <p className="text-sm text-ink-muted">{g.step3.linuxHint}</p>
            <ExerciseCodeBlock code={VENV_CREATE_LINUX} language="bash" />
          </div>
        </ExerciseStepCard>

        <ExerciseStepCard number={4} title={g.step4.title}>
          <p className="text-sm leading-relaxed text-ink-secondary">{g.step4.body}</p>
          <div
            className="exercise-platform-tabs mt-5 flex flex-wrap gap-2"
            role="tablist"
            aria-label={g.step4.platformTabsAria}
          >
            {(
              [
                ['linux', g.step4.platformLinux],
                ['windows-ps', g.step4.platformWindowsPs],
                ['windows-cmd', g.step4.platformWindowsCmd],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={platform === id}
                onClick={() => setPlatform(id)}
                className={`exercise-platform-tabs__btn ${
                  platform === id ? 'exercise-platform-tabs__btn--active' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {platform === 'linux' && <ExerciseCodeBlock code={ACTIVATE_LINUX} language="bash" />}
            {platform === 'windows-ps' && (
              <>
                <ExerciseCodeBlock code={ACTIVATE_WINDOWS_PS} language="powershell" />
                <p className="mt-3 text-sm text-ink-muted">{g.step4.powershellNote}</p>
              </>
            )}
            {platform === 'windows-cmd' && (
              <ExerciseCodeBlock code={ACTIVATE_WINDOWS_CMD} language="cmd" />
            )}
          </div>
          <p className="mt-4 text-sm text-ink-secondary">{g.step4.activeHint}</p>
          <div className="mt-3">
            <ExerciseCodeBlock code={VENV_PROMPT_HINT} language="text" />
          </div>
        </ExerciseStepCard>

        <ExerciseStepCard number={5} title={g.step5.title}>
          <p className="text-sm leading-relaxed text-ink-secondary">{g.step5.body}</p>
          <div className="exercise-download-box mt-5 border border-line bg-[#0e1011] p-5">
            <ExerciseDownloadLink>{g.step5.downloadLabel}</ExerciseDownloadLink>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{g.step5.afterDownload}</p>
          <div className="mt-4">
            <ExerciseCodeBlock code={PROJECT_TREE} language="text" />
          </div>
        </ExerciseStepCard>

        <ExerciseStepCard number={6} title={g.step6.title}>
          <p className="text-sm leading-relaxed text-ink-secondary">{g.step6.body}</p>
          <div className="mt-4">
            <ExerciseCodeBlock code={RUN_SCRIPT} language="bash" />
          </div>
          <p className="mt-4 text-sm text-ink-muted">{g.step6.note}</p>
        </ExerciseStepCard>

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
  );
}
