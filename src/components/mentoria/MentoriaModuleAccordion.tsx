import { ChevronDown, Lock } from 'lucide-react';
import { mentoriaModules, type MentoriaModuleMeta } from '../../data/mentoriaModules';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';

type MentoriaModuleAccordionProps = {
  meta: MentoriaModuleMeta;
  defaultOpen?: boolean;
};

export function MentoriaModuleAccordion({ meta, defaultOpen = false }: MentoriaModuleAccordionProps) {
  const { t } = useTranslation();
  const m = t.mentoria;
  const moduleIndex = mentoriaModules.findIndex((item) => item.id === meta.id);
  const content = m.modules[moduleIndex];
  if (!content) {
    return null;
  }
  const isAvailable = meta.status === 'available';
  const isComingSoon = !isAvailable;

  return (
    <details
      className={`mentoria-module group border border-line bg-panel ${isComingSoon ? 'mentoria-module--soon' : ''}`}
      open={defaultOpen}
    >
      <summary className="mentoria-module__summary flex cursor-pointer list-none items-center gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 [&::-webkit-details-marker]:hidden">
        <span className="mentoria-module__chevron shrink-0 text-accent transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
            {m.modulePrefix} {meta.number}
          </span>
          <h2 className="text-base font-medium text-ink-primary lg:text-[1.05rem]">{content.title}</h2>
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          {meta.lessonCount > 0 && (
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">
              {m.lessonCountLabel.replace('{count}', String(meta.lessonCount))}
            </span>
          )}
          <span
            className={`mentoria-module__status font-mono text-[9px] uppercase tracking-[0.18em] ${
              isAvailable ? 'text-ink-primary' : 'text-ink-muted'
            }`}
          >
            {isAvailable ? m.statusAvailable : m.statusComingSoon}
          </span>
        </div>
      </summary>

      <div className="mentoria-module__body border-t border-line px-4 pb-5 sm:px-5 lg:px-6 lg:pb-6">
        {isComingSoon ? (
          <p className="py-4 text-sm leading-relaxed text-ink-muted">{m.comingSoonBody}</p>
        ) : (
          <>
            <ul className="mentoria-lessons space-y-0">
              {content.lessons?.map((lesson, index) => {
                const num = String(index + 1).padStart(2, '0');
                return (
                  <li key={num} className="mentoria-lesson border-t border-line first:border-t-0">
                    <div className="mentoria-lesson__inner flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:gap-5">
                      <span className="mentoria-lesson__num font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                        {num}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <h3 className="text-base font-medium text-ink-primary">{lesson.title}</h3>
                          <span className="mentoria-lesson__lock inline-flex items-center gap-1.5 border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                            <Lock className="h-3 w-3 shrink-0" strokeWidth={1.5} aria-hidden />
                            {m.lockedBadge}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{lesson.description}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {content.finalProject && meta.finalProjectHref && (
              <div className="mentoria-capstone mt-6 border border-line border-l-2 border-l-accent bg-canvas/50 p-5 lg:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">{m.finalProject.label}</p>
                <h3 className="mt-3 text-lg font-medium text-ink-primary">{content.finalProject.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
                  {content.finalProject.description}
                </p>
                <div className="mt-5">
                  <Button href={meta.finalProjectHref} variant="outline" className="h-[44px] px-6">
                    {content.finalProject.cta}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
}
