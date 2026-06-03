import { GitBranch, Link2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { profile } from '../../data/profile';
import { footerNav, footerProgramLinks } from '../../data/navigation';
import { useTranslation } from '../../i18n/useTranslation';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="carbon-fiber-surface section-border w-full bg-canvas-raised" aria-label={t.footer.ariaLabel}>
      <div className="page-container py-12 lg:py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 flex items-center text-[13px] font-medium uppercase tracking-brand text-ink-primary">
              <span className="mr-3.5 inline-block h-px w-5 bg-accent" />
              {profile.name}
            </p>
            <p className="type-footer mb-2 text-ink-muted">
              © {new Date().getFullYear()} {profile.name}. {t.footer.rights}
            </p>
          </div>

          <nav className="flex flex-wrap gap-5" aria-label={t.footer.ariaLabel}>
            {footerNav.map((item) =>
              item.isRoute ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="type-footer text-ink-muted transition-colors hover:text-accent"
                >
                  {t.nav[item.labelKey]}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="type-footer text-ink-muted transition-colors hover:text-accent"
                >
                  {t.nav[item.labelKey]}
                </a>
              ),
            )}
            {footerProgramLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="type-footer text-ink-muted transition-colors hover:text-accent"
                aria-label={t.footer.uspEsalqAria}
              >
                {t.footer.uspEsalq}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted transition-colors hover:text-accent"
              aria-label={t.footer.githubAria}
            >
              <GitBranch className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-muted transition-colors hover:text-accent"
              aria-label={t.footer.linkedinAria}
            >
              <Link2 className="h-4 w-4" strokeWidth={1.5} />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="text-ink-muted transition-colors hover:text-accent"
              aria-label={t.footer.emailAria}
            >
              <Mail className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
