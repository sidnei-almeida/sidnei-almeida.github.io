import { Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { SectionReveal } from '../components/motion/SectionReveal';
import { profile } from '../data/profile';
import { resume as baseResume } from '../data/resume';
import { fadeUpItem, sectionStaggerContainer, cardStaggerContainer } from '../lib/motion';
import { getLocalizedResume, resumeSkillGroupKeys } from '../i18n/resumeHelpers';
import { useTranslation } from '../i18n/useTranslation';
import './resume.css';

function TagList({ tags }: { tags: readonly string[] }) {
  return (
    <div className="tech-tag-list">
      {tags.map((tag) => (
        <span key={tag} className="tech-tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ResumePage() {
  const { t } = useTranslation();
  const resume = useMemo(() => getLocalizedResume(t), [t]);

  const contactLine = [baseResume.location, baseResume.email, baseResume.website, baseResume.phone].join(
    ' · ',
  );
  const titleLine = `${baseResume.title} | ${baseResume.subtitle}`;

  return (
    <div className="resume-page section-border w-full bg-canvas">
      <div className="page-container section-pad w-full">
        <div className="resume-page-inner carbon-fiber-surface border border-line bg-panel p-8 lg:p-10 xl:p-12">
          <SectionReveal variants={sectionStaggerContainer}>
            <div className="resume-page-header">
              <div>
                <motion.p variants={fadeUpItem} className="resume-page-label">
                  {t.resume.label}
                </motion.p>
                <motion.h1 variants={fadeUpItem} className="resume-page-title">
                  {baseResume.name}
                </motion.h1>
                <motion.p variants={fadeUpItem} className="resume-page-subtitle">
                  {titleLine}
                </motion.p>
                <motion.p variants={fadeUpItem} className="resume-page-contact">
                  {contactLine}
                </motion.p>
                <motion.div variants={fadeUpItem}>
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex h-[44px] cursor-pointer items-center gap-2 text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {t.hero.ctaSecondary}
                  </a>
                </motion.div>
              </div>
            </div>
          </SectionReveal>

          <motion.hr
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="resume-page-rule"
          />

          <section className="resume-section" aria-label={t.resume.sections.summary}>
            <SectionReveal>
              <motion.h2 variants={fadeUpItem} className="resume-section-label">
                {t.resume.sections.summary}
              </motion.h2>
              <motion.p variants={fadeUpItem} className="resume-summary">
                {resume.summary}
              </motion.p>
            </SectionReveal>
          </section>

          <section className="resume-section" aria-label={t.resume.sections.experience}>
            <SectionReveal variants={sectionStaggerContainer}>
              <motion.h2 variants={fadeUpItem} className="resume-section-label">
                {t.resume.sections.experience}
              </motion.h2>
              {resume.experience.map((entry) => (
              <motion.article
                key={`${entry.title}-${entry.company}`}
                variants={fadeUpItem}
                className="timeline-entry"
                aria-label={`${entry.title} at ${entry.company}, ${entry.period}`}
              >
                <div className="timeline-rail" aria-hidden />
                <div className="timeline-content">
                  <div className="timeline-entry-header">
                    <h3 className="timeline-entry-title">{entry.title}</h3>
                    <div className="timeline-entry-meta">
                      <span className="timeline-entry-company">{entry.company}</span>
                      <span className="timeline-entry-period">{entry.period}</span>
                    </div>
                  </div>

                  {entry.engagements.map((engagement) => (
                    <div key={`${engagement.client}-${engagement.role}`} className="engagement-block">
                      <p className="engagement-client">
                        <span className="engagement-client-mark" aria-hidden>
                          ›
                        </span>
                        {engagement.client}
                      </p>
                      <p className="engagement-role">{engagement.role}</p>
                      <p className="engagement-project">{engagement.project}</p>
                      <ul className="engagement-achievements">
                        {engagement.achievements.map((achievement) => (
                          <li key={achievement}>
                            <span aria-hidden>•</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.article>
              ))}
            </SectionReveal>
          </section>

          <section className="resume-section" aria-label={t.resume.sections.projects}>
            <SectionReveal>
              <motion.h2 variants={fadeUpItem} className="resume-section-label">
                {t.resume.sections.projects}
              </motion.h2>
            </SectionReveal>
            <SectionReveal variants={cardStaggerContainer} className="projects-grid">
              {resume.projects.map((project) => (
                <motion.article
                  key={project.title}
                  variants={fadeUpItem}
                  className="project-card carbon-fiber-surface"
                  aria-label={project.title}
                >
                  <div className="project-card-header">
                    <h3 className="project-card-title">{project.title}</h3>
                    <span className="project-card-category">{project.category}</span>
                  </div>
                  <p className="project-card-description">{project.description}</p>
                  <TagList tags={project.stack} />
                </motion.article>
              ))}
            </SectionReveal>
          </section>

          <section className="resume-section" aria-label={t.resume.sections.education}>
            <SectionReveal variants={sectionStaggerContainer}>
              <motion.h2 variants={fadeUpItem} className="resume-section-label">
                {t.resume.sections.education}
              </motion.h2>
              {resume.education.map((entry) => (
              <motion.article key={entry.degree} variants={fadeUpItem} className="education-entry">
                <div>
                  <h3 className="education-degree">{entry.degree}</h3>
                  <p className="education-institution">{entry.institution}</p>
                </div>
                <span className="education-period">{entry.period}</span>
              </motion.article>
              ))}
            </SectionReveal>
          </section>

          <section className="resume-section" aria-label={t.resume.sections.skills}>
            <SectionReveal variants={sectionStaggerContainer}>
              <motion.h2 variants={fadeUpItem} className="resume-section-label">
                {t.resume.sections.skills}
              </motion.h2>
              <div className="skills-grid">
                {resumeSkillGroupKeys.map((key, index) => (
                  <motion.div key={key} variants={fadeUpItem}>
                    <p className="skill-group-name">{t.skills.groups[key]}</p>
                    <TagList tags={baseResume.skills[index]?.items ?? []} />
                  </motion.div>
                ))}
              </div>
            </SectionReveal>
          </section>

          <section className="resume-section" aria-label={t.resume.sections.certifications}>
            <SectionReveal variants={sectionStaggerContainer}>
              <motion.h2 variants={fadeUpItem} className="resume-section-label">
                {t.resume.sections.certifications}
              </motion.h2>
              {resume.certifications.map((cert) => (
                <motion.article
                  key={`${cert.issuer}-${cert.name}`}
                  variants={fadeUpItem}
                  className="cert-entry"
                >
                  <p className="cert-text">
                    <span className="cert-issuer">{cert.issuer}</span>
                    {', '}
                    {cert.name}
                  </p>
                  <span className="cert-year">{cert.year}</span>
                </motion.article>
              ))}
            </SectionReveal>
          </section>
        </div>
      </div>
    </div>
  );
}
