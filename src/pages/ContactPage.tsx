import { ArrowLeft, Globe, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ContactForm } from '../components/contact/ContactForm';
import { SectionReveal } from '../components/motion/SectionReveal';
import { profile } from '../data/profile';
import { fadeUpItem, sectionStaggerContainer } from '../lib/motion';
import { useTranslation } from '../i18n/useTranslation';

const contactMetaItems = [
  { key: 'availability', labelKey: 'availabilityLabel', valueKey: 'availabilityValue' },
  { key: 'response', labelKey: 'responseLabel', valueKey: 'responseValue' },
  { key: 'workMode', labelKey: 'workModeLabel', valueKey: 'workModeValue' },
] as const;

function ContactX1Label({ children }: { children: string }) {
  return (
    <div className="contact-x1-card__header">
      <span className="contact-x1-card__dash" aria-hidden />
      <span className="contact-x1-card__label">{children}</span>
    </div>
  );
}

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="contact-page section-border">
      <div className="contact-page__inner">
        <SectionReveal>
          <motion.div variants={fadeUpItem}>
            <Link
              to="/"
              className="mb-8 inline-flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100 lg:mb-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t.contactPage.back}
            </Link>
          </motion.div>
        </SectionReveal>

        <div className="contact-page__grid">
          <div className="contact-x1-card carbon-fiber-surface flex h-full min-h-0 flex-col p-8 lg:p-10">
            <SectionReveal variants={sectionStaggerContainer} className="min-h-0 flex-1">
              <motion.div variants={fadeUpItem}>
                <ContactX1Label>{t.contact.label}</ContactX1Label>
              </motion.div>
              <motion.h1 variants={fadeUpItem} className="contact-x1-card__title mt-5">
                {t.contactPage.title}
              </motion.h1>
              <motion.p variants={fadeUpItem} className="contact-x1-card__body mt-5">
                {t.contactPage.subtitle}
              </motion.p>

              <motion.ul variants={fadeUpItem} className="contact-x1-card__list mt-10 pt-8">
                <li className="contact-x1-card__item">
                  <Mail className="contact-x1-card__item-icon" strokeWidth={1.5} />
                  <a href={`mailto:${profile.email}`} className="contact-x1-card__item-text contact-x1-card__item-link">
                    {profile.email}
                  </a>
                </li>
                <li className="contact-x1-card__item">
                  <MapPin className="contact-x1-card__item-icon" strokeWidth={1.5} />
                  <span className="contact-x1-card__item-text">{t.hero.metaBasedInValue}</span>
                </li>
                <li className="contact-x1-card__item">
                  <span className="contact-x1-card__status-dot contact-x1-card__status-dot--live" aria-hidden />
                  <span className="contact-x1-card__item-text">{t.hero.metaAvailableValue}</span>
                </li>
                <li className="contact-x1-card__item">
                  <Globe className="contact-x1-card__item-icon" strokeWidth={1.5} />
                  <span className="contact-x1-card__item-text">{t.hero.metaOpenToValue}</span>
                </li>
              </motion.ul>
            </SectionReveal>

            <SectionReveal variants={sectionStaggerContainer} className="contact-x1-card__meta-block mt-10 pt-8">
              {contactMetaItems.map((item) => (
                <motion.div key={item.key} variants={fadeUpItem}>
                  <p className="contact-x1-card__meta-label">{t.contactPage[item.labelKey]}</p>
                  <p className="contact-x1-card__meta-value">{t.contactPage[item.valueKey]}</p>
                </motion.div>
              ))}
            </SectionReveal>

            <div className="x1-mark contact-x1-card__mark" aria-hidden>
              {'\u00D7'}
              <span>1</span>
            </div>
          </div>

          <SectionReveal className="contact-x1-card carbon-fiber-surface flex h-full flex-col p-8 lg:p-10">
            <motion.div variants={fadeUpItem}>
              <ContactX1Label>{t.contactPage.sendMessageLabel}</ContactX1Label>
            </motion.div>
            <motion.p variants={fadeUpItem} className="contact-x1-card__intro mt-4">
              {t.contactPage.formIntro}
            </motion.p>
            <motion.div variants={fadeUpItem} className="mt-8 flex-1">
              <ContactForm />
            </motion.div>
          </SectionReveal>
        </div>
      </div>
    </div>
  );
}
