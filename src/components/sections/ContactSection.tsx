import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { profile } from '../../data/profile';
import { fadeUpItem, sectionStaggerContainer } from '../../lib/motion';
import { useTranslation } from '../../i18n/useTranslation';
import { SectionReveal } from '../motion/SectionReveal';
import { Button } from '../ui/Button';
import { SectionLabel } from '../ui/SectionLabel';

export function ContactSection() {
  const { t } = useTranslation();

  return (
    <section id="contact" className="section-border w-full bg-panel/40">
      <div className="page-container section-pad w-full">
        <SectionReveal variants={sectionStaggerContainer} className="w-full text-center">
          <SectionLabel className="justify-center" animated>
            {t.contact.label}
          </SectionLabel>
          <motion.h2 variants={fadeUpItem} className="section-heading mx-auto mt-5 max-w-3xl">
            {t.contact.title}
          </motion.h2>
          <motion.p variants={fadeUpItem} className="section-body mx-auto mt-5">
            {t.contact.subtitle}
          </motion.p>
          <motion.div variants={fadeUpItem} className="mt-9 flex flex-wrap items-center justify-center gap-5">
            <Button href="/contact">{t.contact.btnPrimary}</Button>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
            >
              {t.contact.github}
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
            >
              {t.contact.linkedin}
            </a>
            <Link
              to="/contact"
              className="text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100"
            >
              {t.contact.sendMessage}
            </Link>
          </motion.div>
        </SectionReveal>
      </div>
    </section>
  );
}
