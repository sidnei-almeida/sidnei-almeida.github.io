import type { LucideIcon } from 'lucide-react';

type IconBadgeProps = {
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
  compact?: boolean;
};

export function IconBadge({ icon: Icon, label, highlight, compact }: IconBadgeProps) {
  return (
    <div
      className={`flex items-center border border-line bg-panel/40 text-ink-secondary ${
        compact ? 'gap-2 px-3 py-2 text-[11px]' : 'gap-3 px-4 py-3 text-sm'
      }`}
    >
      <Icon className={`shrink-0 text-ink-muted ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} strokeWidth={1.5} />
      <span>{label}</span>
      {highlight && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-label="Active" />
      )}
    </div>
  );
}
