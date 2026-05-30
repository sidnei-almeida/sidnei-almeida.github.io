import { motion } from 'framer-motion';
import { getImpactStats } from '../../data/stats';
import { cardStaggerContainer, fadeUpItem } from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionReveal } from '../motion/SectionReveal';
import { StatCard } from '../ui/StatCard';
import { SectionLabel } from '../ui/SectionLabel';

export function ExperienceImpactSection() {
  const { t } = useTranslation();
  const impactStats = getImpactStats(t);

  return (
    <section id="experience" className="flex min-h-full w-full flex-col border-r border-line bg-canvas p-10 lg:p-12">
      <SectionReveal>
        <SectionLabel animated>{t.experience.label}</SectionLabel>
      </SectionReveal>

      <SectionReveal variants={cardStaggerContainer} className="mt-6 grid flex-1 grid-cols-2 gap-3">
        {impactStats.map((stat) => (
          <motion.div key={stat.label} variants={fadeUpItem}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </SectionReveal>
    </section>
  );
}
