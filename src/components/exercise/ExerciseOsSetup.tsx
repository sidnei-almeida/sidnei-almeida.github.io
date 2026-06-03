import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OS_SETUP_SCRIPTS, PROJECT_TREE_WITH_README, type OsPlatform } from '../../data/pythonExerciseSamples';
import { useTranslation } from '../../i18n/useTranslation';
import { ExerciseCodeBlock } from './ExerciseCodeBlock';
import { ExerciseDownloadLink } from './ExerciseDownloadLink';

const PLATFORMS: OsPlatform[] = ['linux', 'windows-ps', 'windows-cmd'];

export function ExerciseOsSetup() {
  const { t } = useTranslation();
  const os = t.pythonExercise.osSetup;
  const [platform, setPlatform] = useState<OsPlatform>('linux');

  const platformLabels: Record<OsPlatform, string> = {
    linux: os.platformLinux,
    'windows-ps': os.platformWindowsPs,
    'windows-cmd': os.platformWindowsCmd,
  };

  const script = OS_SETUP_SCRIPTS[platform];

  return (
    <div id="escolha-os" className="exercise-os-setup mt-8">
      <h3 className="type-subsection-heading text-ink-primary">{os.title}</h3>
      <p className="section-body mt-3 max-w-3xl">{os.intro}</p>
      <p className="exercise-os-setup__venv mt-4 max-w-3xl text-sm leading-relaxed text-ink-secondary">
        {os.venvNote}
      </p>

      <div
        className="exercise-os-setup__picker mt-6 grid gap-2 sm:grid-cols-3"
        role="tablist"
        aria-label={os.platformTabsAria}
      >
        {PLATFORMS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={platform === id}
            onClick={() => setPlatform(id)}
            className={`exercise-os-setup__tab ${
              platform === id ? 'exercise-os-setup__tab--active' : ''
            }`}
          >
            <span className="exercise-os-setup__tab-label">{platformLabels[id]}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
        >
          <p className="mb-3 text-sm text-ink-muted">{os.commandsHint}</p>
          <ExerciseCodeBlock code={script.code} language={script.language} />

          <ul className="exercise-os-setup__legend mt-5 space-y-2">
            {os.commandLegend.map((line) => (
              <li key={line} className="flex gap-2 text-sm leading-relaxed text-ink-secondary">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      <aside className="exercise-os-setup__note mt-6 border border-line bg-panel/50 p-4 lg:p-5">
        <p className="text-sm leading-relaxed text-ink-secondary">{os.vscodeNote}</p>
      </aside>

      {platform === 'windows-ps' && (
        <aside className="exercise-os-setup__note mt-4 border-l-2 border-l-accent/70 bg-panel/40 p-4 lg:p-5">
          <p className="text-sm leading-relaxed text-ink-secondary">{os.powershellNote}</p>
        </aside>
      )}

      <div className="mt-8">
        <p className="text-sm font-medium text-ink-primary">{os.downloadTitle}</p>
        <p className="mt-2 text-sm text-ink-secondary">{os.downloadBody}</p>
        <div className="exercise-download-box mt-4 border border-line bg-[#0e1011] p-5">
          <ExerciseDownloadLink>{os.downloadLabel}</ExerciseDownloadLink>
        </div>
        <p className="mt-4 text-sm text-ink-secondary">{os.treeIntro}</p>
        <div className="mt-3">
          <ExerciseCodeBlock code={PROJECT_TREE_WITH_README} language="text" copyable={false} />
        </div>
      </div>

      <aside className="exercise-callout mt-8 border border-line bg-panel/80 p-5 lg:p-6">
        <p className="text-sm leading-relaxed text-ink-secondary">{os.encouragement}</p>
      </aside>
    </div>
  );
}
