import { ExternalLink, GitBranch } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

type ProjectLinksProps = {
  liveDemo: string | null;
  github: string | null;
  compact?: boolean;
};

export function ProjectLinks({ liveDemo, github, compact }: ProjectLinksProps) {
  const { t } = useTranslation();

  if (!liveDemo && !github) return null;

  const linkClass = compact
    ? 'type-mono-link text-ink-muted hover:text-accent'
    : 'type-mono-link inline-flex items-center gap-1.5 text-ink-secondary hover:text-accent';

  return (
    <div className="flex flex-wrap items-center gap-4">
      {liveDemo && (
        <a
          href={liveDemo}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label={t.projects.liveDemo}
        >
          <ExternalLink className="h-3 w-3" />
          {t.projects.liveDemo}
        </a>
      )}
      {github && (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          aria-label={t.projects.source}
        >
          <GitBranch className="h-3 w-3" />
          {t.projects.source}
        </a>
      )}
    </div>
  );
}
