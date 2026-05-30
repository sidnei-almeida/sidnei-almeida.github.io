import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getFeaturedProjects } from '../../data/projects';
import { fadeUpItem } from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionReveal } from '../motion/SectionReveal';
import { FeaturedProjectCard } from '../project/FeaturedProjectCard';
import { SectionLabel } from '../ui/SectionLabel';
import { cardStaggerContainer } from '../../lib/motion';

const PRIMARY_FEATURED_COUNT = 3;

export function FeaturedProjectsSection() {
  const { t } = useTranslation();
  const projects = getFeaturedProjects().slice(0, PRIMARY_FEATURED_COUNT);

  return (
    <section id="projects" className="section-border w-full bg-canvas">
      <div className="page-container section-pad w-full">
        <SectionReveal className="mb-10 w-full lg:mb-12">
          <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full">
              <SectionLabel animated>{t.projects.label}</SectionLabel>
              <motion.h2 variants={fadeUpItem} className="section-heading mt-5">
                {t.projects.title}
              </motion.h2>
              <motion.p variants={fadeUpItem} className="section-body mt-5">
                {t.projects.subtitle}
              </motion.p>
            </div>
            <motion.div variants={fadeUpItem}>
              <Link
                to="/projects"
                className="inline-flex shrink-0 items-center text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
              >
                <span className="mr-2.5 inline-block h-px w-4 bg-accent" />
                {t.projects.viewMore}
              </Link>
            </motion.div>
          </div>
        </SectionReveal>

        <SectionReveal variants={cardStaggerContainer} className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <FeaturedProjectCard key={project.id} project={project} animated />
          ))}
        </SectionReveal>
      </div>
    </section>
  );
}
