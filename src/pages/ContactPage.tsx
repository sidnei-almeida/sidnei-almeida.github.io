import { ArrowLeft, Globe, Mail, MapPin, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ContactForm } from '../components/contact/ContactForm';
import { SectionReveal } from '../components/motion/SectionReveal';
import { SectionLabel } from '../components/ui/SectionLabel';
import { profile } from '../data/profile';
import { fadeUpItem, sectionStaggerContainer } from '../lib/motion';
import { useTranslation } from '../i18n/useTranslation';

const contactMetaItems = [
  { key: 'availability', labelKey: 'availabilityLabel', valueKey: 'availabilityValue' },
  { key: 'response', labelKey: 'responseLabel', valueKey: 'responseValue' },
  { key: 'workMode', labelKey: 'workModeLabel', valueKey: 'workModeValue' },
] as const;

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
          <div className="contact-info-card flex h-full min-h-0 flex-col border border-line bg-panel p-8 lg:p-10">
            <SectionReveal variants={sectionStaggerContainer} className="min-h-0 flex-1">
              <SectionLabel animated>{t.contact.label}</SectionLabel>
              <motion.h1 variants={fadeUpItem} className="section-heading mt-5">
                {t.contactPage.title}
              </motion.h1>
              <motion.p variants={fadeUpItem} className="section-body mt-5">
                {t.contactPage.subtitle}
              </motion.p>

              <motion.ul variants={fadeUpItem} className="mt-10 space-y-4 border-t border-line pt-8">
                <li className="flex items-start gap-3 text-sm text-ink-body">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.5} />
                  <a
                    href={`mailto:${profile.email}`}
                    className="cursor-pointer transition-opacity duration-150 hover:text-accent hover:opacity-100"
                  >
                    {profile.email}
                  </a>
                </li>
                <li className="flex items-start gap-3 text-sm text-ink-body">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.5} />
                  <span>
                    {t.contactPage.basedIn} {t.hero.metaBasedInValue}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-ink-body">
                  <Radio className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                  <span>{t.hero.metaAvailableValue}</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-ink-body">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.5} />
                  <span>{t.hero.metaOpenToValue}</span>
                </li>
              </motion.ul>
            </SectionReveal>

            <SectionReveal variants={sectionStaggerContainer} className="mt-10 space-y-5 border-t border-line pt-8">
              {contactMetaItems.map((item) => (
                <motion.div key={item.key} variants={fadeUpItem}>
                  <p className="contact-info-meta-label">{t.contactPage[item.labelKey]}</p>
                  <p className="contact-info-meta-value">{t.contactPage[item.valueKey]}</p>
                </motion.div>
              ))}
            </SectionReveal>
          </div>

          <SectionReveal className="flex h-full flex-col border border-line bg-panel p-8 lg:p-10">
            <SectionLabel animated>{t.contactPage.sendMessageLabel}</SectionLabel>
            <motion.p variants={fadeUpItem} className="mt-4 text-sm leading-relaxed text-ink-body">
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
