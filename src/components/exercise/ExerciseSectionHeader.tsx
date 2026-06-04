import { SectionLabel } from '../ui/SectionLabel';

type ExerciseSectionHeaderProps = {
  label?: string;
  title: string;
  subtitle?: string;
  titleClassName?: string;
};

export function ExerciseSectionHeader({
  label,
  title,
  subtitle,
  titleClassName = 'section-heading',
}: ExerciseSectionHeaderProps) {
  return (
    <header className="exercise-section-header">
      {label ? (
        <SectionLabel>{label}</SectionLabel>
      ) : (
        <p className="type-section-label flex items-center text-ink-label" aria-hidden>
          <span className="mr-3.5 inline-block h-px w-5 bg-accent" />
        </p>
      )}
      <h2 className={`${titleClassName} mt-4 text-ink-primary`}>{title}</h2>
      {subtitle ? <p className="section-body mt-3">{subtitle}</p> : null}
    </header>
  );
}
