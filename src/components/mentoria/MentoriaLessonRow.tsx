import { ExternalLink, Lock } from 'lucide-react';

type MentoriaLessonRowProps = {
  number: string;
  title: string;
  description: string;
  badge: string;
  href?: string;
  openLabel?: string;
  locked?: boolean;
};

export function MentoriaLessonRow({
  number,
  title,
  description,
  badge,
  href,
  openLabel,
  locked = false,
}: MentoriaLessonRowProps) {
  const titleNode = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-base font-medium text-ink-primary transition-colors hover:text-accent"
    >
      {title}
    </a>
  ) : (
    <h3 className="text-base font-medium text-ink-primary">{title}</h3>
  );

  return (
    <li className="mentoria-lesson border-t border-line first:border-t-0">
      <div className="mentoria-lesson__inner flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:gap-5">
        <span className="mentoria-lesson__num font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {titleNode}
            <span className="mentoria-lesson__lock inline-flex items-center gap-1.5 border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
              {locked && <Lock className="h-3 w-3 shrink-0" strokeWidth={1.5} aria-hidden />}
              {badge}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{description}</p>
          {href && openLabel && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mentoria-lesson__open mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted transition-colors duration-150 hover:text-accent"
            >
              <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.5} aria-hidden />
              {openLabel}
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
