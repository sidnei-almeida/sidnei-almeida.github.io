import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { FeaturedProjectCard } from '../components/project/FeaturedProjectCard';
import { HeroSection } from '../components/sections/HeroSection';
import { SectionReveal } from '../components/motion/SectionReveal';
import { SectionLabel } from '../components/ui/SectionLabel';
import { getAllProjects, PROJECT_FILTERS, projectMatchesFilter, type ProjectFilter } from '../data/projects';
import { cardStaggerContainer, fadeUpItem, sectionStaggerContainer } from '../lib/motion';
import { interpolate } from '../i18n/helpers';
import { useTranslation } from '../i18n/useTranslation';

export function ProjectsPage() {
  const { t } = useTranslation();
  const allProjects = useMemo(() => getAllProjects(), []);
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all');

  const visibleProjects = useMemo(() => {
    if (activeFilter === 'all') return allProjects;
    return allProjects.filter((project) => projectMatchesFilter(project, activeFilter));
  }, [activeFilter, allProjects]);

  return (
    <>
      <HeroSection compactFoot />

      <div id="projects" className="section-border w-full bg-canvas">
        <div className="page-container w-full pt-8 pb-12 lg:pt-10 lg:pb-14">
          <SectionReveal variants={sectionStaggerContainer}>
            <div className="carbon-fiber-surface border border-line bg-panel p-6 lg:p-8">
              <div className="max-w-2xl">
                <SectionLabel animated>{t.projects.pageLabel}</SectionLabel>
                <motion.h1
                  variants={fadeUpItem}
                  className="type-section-heading mt-4 text-[clamp(2.5rem,5vw,3.25rem)]"
                >
                  {t.projects.pageTitle}
                </motion.h1>
                <motion.p variants={fadeUpItem} className="section-body mt-3 max-w-xl">
                  {interpolate(t.projects.pageSubtitle, { count: allProjects.length })}
                </motion.p>
              </div>

              <motion.div
                variants={fadeUpItem}
                className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5"
              >
                {PROJECT_FILTERS.map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveFilter(value)}
                    className={`cursor-pointer rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[2px] transition-colors ${
                      activeFilter === value
                        ? 'border-[#c8102e] bg-[#c8102e] text-white'
                        : 'border-line bg-transparent text-ink-muted hover:border-[#c8102e] hover:text-[#c8102e]'
                    }`}
                  >
                    {t.projects.filters[labelKey]}
                  </button>
                ))}
              </motion.div>
            </div>
          </SectionReveal>

          {visibleProjects.length > 0 ? (
            <SectionReveal
              key={activeFilter}
              variants={cardStaggerContainer}
              className="mt-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {visibleProjects.map((project) => (
                <FeaturedProjectCard key={project.id} project={project} animated />
              ))}
            </SectionReveal>
          ) : (
            <SectionReveal className="mt-10">
              <motion.p variants={fadeUpItem} className="text-center text-sm text-ink-muted">
                {t.projects.noResults}
              </motion.p>
            </SectionReveal>
          )}
        </div>
      </div>
    </>
  );
}
