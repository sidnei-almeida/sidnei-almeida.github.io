import type { ReactElement } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { TechStackIconId, TechStackItem } from '../../data/skills';

type TechStackIconProps = {
  item: TechStackItem;
};

function BrandMark({ label }: { label: string }) {
  return (
    <span
      className="flex h-4 w-4 items-center justify-center rounded-full border border-ink-muted/60 text-[8px] font-medium leading-none text-ink-muted"
      aria-hidden
    >
      {label}
    </span>
  );
}

function NextJsMark() {
  return <BrandMark label="N" />;
}

function GroqMark() {
  return <BrandMark label="G" />;
}

function HuggingFaceMark() {
  return <BrandMark label="HF" />;
}

const customIcons: Record<TechStackIconId, () => ReactElement> = {
  nextjs: NextJsMark,
  groq: GroqMark,
  huggingface: HuggingFaceMark,
};

export function TechStackIcon({ item }: TechStackIconProps) {
  if (typeof item.icon === 'string') {
    const CustomIcon = customIcons[item.icon];
    return <CustomIcon />;
  }

  const Icon = item.icon as LucideIcon;
  return <Icon className="h-4 w-4 shrink-0 text-ink-muted/80" strokeWidth={1.25} aria-hidden />;
}

export function TechStackItemLabel({ item }: TechStackIconProps) {
  return (
    <li className="flex shrink-0 items-center gap-2">
      <TechStackIcon item={item} />
      <span className="whitespace-nowrap text-xs text-ink-label">{item.name}</span>
    </li>
  );
}
