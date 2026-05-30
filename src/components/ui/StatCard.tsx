import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export function StatCard({ value, label, icon: Icon }: StatCardProps) {
  return (
    <div className="carbon-fiber-surface group flex flex-col gap-2.5 border border-line bg-panel p-4 transition-colors duration-300 hover:border-accent/35">
      <Icon className="h-3.5 w-3.5 text-ink-label transition-colors group-hover:text-accent" strokeWidth={1.5} />
      <p className="type-metric-value text-2xl text-ink-primary lg:text-[28px]">{value}</p>
      <p className="type-metric-label text-ink-label">{label}</p>
    </div>
  );
}
