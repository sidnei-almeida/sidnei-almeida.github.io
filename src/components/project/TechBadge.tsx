type TechBadgeProps = {
  label: string;
};

export function TechBadge({ label }: TechBadgeProps) {
  return (
    <span className="type-tech-tag inline-flex border border-line px-2 py-0.5 text-ink-muted">
      {label}
    </span>
  );
}
