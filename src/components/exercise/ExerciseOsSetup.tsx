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
    <div id="escolha-os" className="exercise-os-setup">
      <h3 className="exercise-os-setup__heading">{os.title}</h3>
      <p className="section-body mt-3 max-w-3xl">{os.intro}</p>
      <aside className="exercise-note-callout mt-6">
        <p>{os.venvNote}</p>
      </aside>

      <div
        className="exercise-os-setup__picker mt-8"
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
          className="mt-6"
        >
          <p className="mb-4 text-sm text-ink-muted">{os.commandsHint}</p>
          <ExerciseCodeBlock code={script.code} language={script.language} />

          <ul className="exercise-def-list mt-6">
            {os.commandLegend.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      <aside className="exercise-note-callout mt-8">
        <p>{os.vscodeNote}</p>
      </aside>

      {platform === 'windows-ps' && (
        <aside className="exercise-note-callout mt-4">
          <p>{os.powershellNote}</p>
        </aside>
      )}

      <div className="exercise-download-card mt-12">
        <p className="exercise-download-card__title">{os.downloadTitle}</p>
        <p className="exercise-download-card__body mt-2">{os.downloadBody}</p>
        <div className="exercise-download-card__action mt-5">
          <ExerciseDownloadLink>{os.downloadLabel}</ExerciseDownloadLink>
        </div>
        <p className="exercise-download-card__body mt-6">{os.treeIntro}</p>
        <div className="exercise-tree-block mt-4">
          <ExerciseCodeBlock code={PROJECT_TREE_WITH_README} language="text" copyable={false} />
        </div>
      </div>

      <aside className="exercise-note-callout mt-8">
        <p>{os.encouragement}</p>
      </aside>
    </div>
  );
}
