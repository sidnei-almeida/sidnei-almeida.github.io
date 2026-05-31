import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resume as baseResume } from '../data/resume';
import { getLocalizedResume, resumeSkillGroupKeys } from '../i18n/resumeHelpers';
import { useTranslation } from '../i18n/useTranslation';
import { exportResumePdf } from '../lib/exportResumePdf';

const printStyles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'IBM Plex Sans', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
  }

  body.resume-print-active {
    background: #ffffff !important;
    color: #1a1a1a !important;
  }

  body.resume-print-active #root {
    background: #ffffff;
  }

  .print-page {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 20px 16px;
  }

  .no-print {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    border: none;
    border-radius: 2px;
    background: #1a1a1a;
    padding: 10px 20px;
    font-family: inherit;
    font-size: 11px;
    color: #fff;
    cursor: pointer;
  }

  .print-header h1 {
    margin: 0 0 4px;
    font-size: 24pt;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: #1a1a1a;
  }

  .print-header .print-title {
    margin: 0 0 2px;
    font-size: 11pt;
    font-weight: 600;
    color: #1a1a1a;
  }

  .print-header .print-subtitle {
    margin: 0 0 8px;
    font-size: 10pt;
    font-weight: 400;
    color: #444;
  }

  .print-contact {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 0;
    font-size: 9.5pt;
    line-height: 1.5;
    color: #444;
  }

  .print-contact-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .print-contact-item {
    white-space: nowrap;
  }

  .print-contact-item + .print-contact-item::before {
    content: ' | ';
    color: #888;
  }

  .print-header hr {
    margin: 12px 0;
    border: none;
    border-top: 2px solid #1a1a1a;
  }

  .print-section h2 {
    margin: 24px 0 12px;
    padding-bottom: 4px;
    border-bottom: 1px solid #ccc;
    font-size: 10pt;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #1a1a1a;
    page-break-after: avoid;
  }

  .print-summary {
    margin: 0;
    font-size: 10.5pt;
    line-height: 1.7;
    color: #333;
  }

  .experience-entry {
    margin-bottom: 16px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .experience-entry-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }

  .experience-entry-header h3 {
    margin: 0;
    font-size: 11pt;
    font-weight: 600;
    color: #1a1a1a;
  }

  .experience-period {
    font-size: 10pt;
    color: #444;
  }

  .experience-company {
    margin: 0 0 10px;
    font-size: 10pt;
    color: #555;
  }

  .engagement {
    margin-top: 10px;
  }

  .engagement-client {
    margin: 0;
    font-size: 10.5pt;
    font-weight: 600;
    color: #1a1a1a;
  }

  .engagement-role {
    margin: 2px 0 0;
    font-size: 10pt;
    font-style: italic;
    color: #555;
  }

  .engagement-project {
    margin: 4px 0 6px;
    font-size: 10pt;
    color: #444;
  }

  .engagement ul {
    margin: 0;
    padding-left: 18px;
  }

  .engagement li {
    margin-bottom: 3px;
    font-size: 10pt;
    line-height: 1.6;
    color: #333;
  }

  .project-entry {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .project-entry:last-child {
    border-bottom: none;
  }

  .project-entry-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .project-entry-header h3 {
    margin: 0;
    font-size: 10.5pt;
    font-weight: 600;
    color: #1a1a1a;
  }

  .project-category {
    font-size: 10pt;
    color: #555;
  }

  .project-description {
    margin: 4px 0;
    font-size: 10pt;
    color: #333;
  }

  .project-stack {
    margin: 0;
    font-size: 10pt;
    font-style: italic;
    color: #555;
  }

  .education-entry {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .education-entry h3 {
    margin: 0;
    font-size: 10.5pt;
    font-weight: 600;
    color: #1a1a1a;
  }

  .education-institution {
    margin: 2px 0 0;
    font-size: 10pt;
    color: #555;
  }

  .education-period {
    font-size: 10pt;
    color: #444;
  }

  .skill-line {
    margin: 0 0 8px;
    font-size: 10pt;
    color: #333;
  }

  .skill-line strong {
    font-weight: 600;
    color: #1a1a1a;
  }

  .cert-table {
    width: 100%;
    border-collapse: collapse;
  }

  .cert-table tr {
    border-bottom: 1px solid #eee;
  }

  .cert-table td {
    padding: 5px 0;
    font-size: 10pt;
    vertical-align: top;
  }

  .cert-table td:last-child {
    text-align: right;
    color: #555;
    white-space: nowrap;
  }

  .print-footer {
    margin-top: 24px;
    text-align: center;
    font-size: 9pt;
    color: #aaa;
  }

  .print-footer hr {
    margin: 0 0 12px;
    border: none;
    border-top: 1px solid #eee;
  }

  @media print {
    @page {
      size: A4;
      margin: 15mm;
    }

    body {
      padding: 0;
    }

    .print-page {
      padding: 0;
    }

    .no-print,
    .print-footer {
      display: none !important;
    }

    a {
      color: #1a1a1a !important;
      text-decoration: none !important;
    }

    a[href]::after {
      content: none !important;
    }

    h2 {
      page-break-after: avoid;
    }
  }
`;

export function ResumePrintPage() {
  const { t, currentLang } = useTranslation();
  const [searchParams] = useSearchParams();
  const shouldAutoPrint = searchParams.get('download') === '1';
  const resume = useMemo(() => getLocalizedResume(t), [t]);
  const printRootRef = useRef<HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const exportingRef = useRef(false);

  const handleDownloadPdf = useCallback(async () => {
    const root = printRootRef.current;
    if (!root || exportingRef.current) {
      return;
    }

    exportingRef.current = true;
    setIsExporting(true);

    try {
      await exportResumePdf(root, {
        filename: `Sidnei-Almeida-Resume-${currentLang}.pdf`,
      });
    } finally {
      exportingRef.current = false;
      setIsExporting(false);
    }
  }, [currentLang]);

  useEffect(() => {
    document.body.classList.add('resume-print-active');
    return () => document.body.classList.remove('resume-print-active');
  }, []);

  useEffect(() => {
    if (!shouldAutoPrint) return;

    const timer = window.setTimeout(() => {
      void handleDownloadPdf();
    }, 800);

    return () => window.clearTimeout(timer);
  }, [shouldAutoPrint, handleDownloadPdf]);

  const contactRows = [
    [resume.location, baseResume.email],
    [baseResume.website, baseResume.phone],
  ] as const;

  return (
    <>
      <style>{printStyles}</style>
      <button
        type="button"
        className="no-print"
        disabled={isExporting}
        onClick={() => void handleDownloadPdf()}
      >
        {isExporting ? t.resumePrint.generatingPdf : t.resumePrint.savePdf}
      </button>

      <main ref={printRootRef} className="print-page" lang={currentLang}>
        <header className="print-header">
          <h1>{baseResume.name}</h1>
          <p className="print-title">{resume.title}</p>
          <p className="print-subtitle">{resume.subtitle}</p>
          <div className="print-contact">
            {contactRows.map((row) => (
              <div key={row.join('-')} className="print-contact-row">
                {row.map((item) => (
                  <span key={item} className="print-contact-item">
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <hr />
        </header>

        <section className="print-section" aria-label={t.resumePrint.sections.summary}>
          <h2>{t.resumePrint.sections.summary}</h2>
          <p className="print-summary">{resume.summary}</p>
        </section>

        <section className="print-section" aria-label={t.resumePrint.sections.experience}>
          <h2>{t.resumePrint.sections.experience}</h2>
          {resume.experience.map((entry) => (
            <article
              key={`${entry.title}-${entry.company}`}
              className="experience-entry"
              aria-label={`${entry.title}, ${entry.company}, ${entry.period}`}
            >
              <div className="experience-entry-header">
                <h3>{entry.title}</h3>
                <span className="experience-period">{entry.period}</span>
              </div>
              <p className="experience-company">{entry.company}</p>

              {entry.engagements.map((engagement) => (
                <div key={`${engagement.client}-${engagement.role}`} className="engagement">
                  <p className="engagement-client">{engagement.client}</p>
                  <p className="engagement-role">{engagement.role}</p>
                  <p className="engagement-project">{engagement.project}</p>
                  <ul>
                    {engagement.achievements.map((achievement) => (
                      <li key={achievement}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </article>
          ))}
        </section>

        <section className="print-section" aria-label={t.resumePrint.sections.projects}>
          <h2>{t.resumePrint.sections.projects}</h2>
          {resume.projects.map((project) => (
            <article key={project.title} className="project-entry">
              <div className="project-entry-header">
                <h3>{project.title}</h3>
                <span className="project-category">{project.category}</span>
              </div>
              <p className="project-description">{project.description}</p>
              <p className="project-stack">
                {t.resume.stack}: {project.stack.join(', ')}
              </p>
            </article>
          ))}
        </section>

        <section className="print-section" aria-label={t.resumePrint.sections.education}>
          <h2>{t.resumePrint.sections.education}</h2>
          {resume.education.map((entry) => (
            <article key={entry.degree} className="education-entry">
              <div>
                <h3>{entry.degree}</h3>
                <p className="education-institution">{entry.institution}</p>
              </div>
              <span className="education-period">{entry.period}</span>
            </article>
          ))}
        </section>

        <section className="print-section" aria-label={t.resumePrint.sections.skills}>
          <h2>{t.resumePrint.sections.skills}</h2>
          {resumeSkillGroupKeys.map((key, index) => (
            <p key={key} className="skill-line">
              <strong>{t.skills.groups[key]}:</strong>{' '}
              {(baseResume.skills[index]?.items ?? []).join(', ')}
            </p>
          ))}
        </section>

        <section className="print-section" aria-label={t.resumePrint.sections.certifications}>
          <h2>{t.resumePrint.sections.certifications}</h2>
          <table className="cert-table">
            <tbody>
              {resume.certifications.map((cert) => (
                <tr key={`${cert.issuer}-${cert.name}`}>
                  <td>
                    {cert.issuer}, {cert.name}
                  </td>
                  <td>{cert.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="print-footer">
          <hr />
          <p>{t.resumePrint.generatedFrom}</p>
        </footer>
      </main>
    </>
  );
}
