import type { LucideIcon } from 'lucide-react';
import { Briefcase, Cpu, Layers, Target } from 'lucide-react';
import type { Translation } from '../i18n/types';

export type Stat = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export function getImpactStats(t: Translation): Stat[] {
  return [
    { value: '9+', label: t.experience.featuredProducts, icon: Briefcase },
    { value: '22+', label: t.experience.projectsDelivered, icon: Layers },
    { value: '15+', label: t.experience.technologies, icon: Cpu },
    { value: '100%', label: t.experience.liveDemosCoverage, icon: Target },
  ];
}
