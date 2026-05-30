import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

export function AboutX1Card() {
  const { t } = useTranslation();

  return (
    <article className="about-x1-card carbon-fiber-surface">
      <div className="about-x1-card__inner">
        <header className="about-x1-card__header">
          <div className="about-x1-card__header-left">
            <span className="about-x1-card__dash" aria-hidden />
            <span className="about-x1-card__label">{t.about.label}</span>
          </div>
          <span className="about-x1-card__tag">{t.about.modelTag}</span>
        </header>

        <div className="about-x1-card__role">
          <h2 className="about-x1-card__role-title">{t.about.roleTitle}</h2>
        </div>

        <ul className="about-x1-card__status" aria-label={t.about.statusAria}>
          <li className="about-x1-card__status-item">
            <span className="about-x1-card__status-dot about-x1-card__status-dot--live" aria-hidden />
            <span>{t.about.statusAvailable}</span>
          </li>
          <li className="about-x1-card__status-item">
            <span className="about-x1-card__status-dot" aria-hidden />
            <span>{t.about.statusFullStack}</span>
          </li>
          <li className="about-x1-card__status-item">
            <span className="about-x1-card__status-dot" aria-hidden />
            <span>{t.about.statusAiMl}</span>
          </li>
        </ul>

        <div className="about-x1-card__separator" aria-hidden>
          <span className="about-x1-card__separator-line" />
          <span className="about-x1-card__separator-dot" />
          <span className="about-x1-card__separator-line" />
        </div>

        <p className="about-x1-card__body">
          {t.about.bodyBeforeStrong1}
          <strong>{t.about.bodyStrong1}</strong>
          {t.about.bodyBetween}
          <strong>{t.about.bodyStrong2}</strong>
        </p>

        <footer className="about-x1-card__footer">
          <Link to="/contact" className="about-x1-card__read-more">
            {t.about.readMore}
          </Link>
          <div className="x1-mark" aria-hidden>
            {'\u00D7'}
            <span>1</span>
          </div>
        </footer>
      </div>
    </article>
  );
}
