import { resume as baseResume, type ResumeLanguage } from '../data/resume';
import type { Lang, Translation } from './types';

export function getLocalizedResume(t: Translation) {
  return {
    ...baseResume,
    title: t.resumeData.title,
    subtitle: t.resumeData.subtitle,
    location: t.resumeData.location,
    summary: t.resumeData.summary,
    experience: baseResume.experience.map((entry, entryIndex) => {
      const localizedEntry = t.resumeData.experience[entryIndex];

      return {
        ...entry,
        title: localizedEntry?.title ?? entry.title,
        company: localizedEntry?.company ?? entry.company,
        period: localizedEntry?.period ?? entry.period,
        engagements: entry.engagements.map((engagement, engagementIndex) => {
          const localized = localizedEntry?.engagements[engagementIndex];

          return {
            ...engagement,
            client: localized?.client ?? engagement.client,
            role: localized?.role ?? engagement.role,
            project: localized?.project ?? engagement.project,
            achievements: localized?.achievements ?? engagement.achievements,
          };
        }),
      };
    }),
    projects: baseResume.projects.map((project, index) => ({
      ...project,
      title: t.resumeData.projects[index]?.title ?? project.title,
      category: t.resumeData.projects[index]?.category ?? project.category,
      description: t.resumeData.projects[index]?.description ?? project.description,
    })),
    education: baseResume.education.map((entry, index) => {
      const localized = t.resumeData.education[index];

      return {
        ...entry,
        degree: localized?.degree ?? entry.degree,
        institution: localized?.institution ?? entry.institution,
        period: localized?.period ?? entry.period,
      };
    }),
  };
}

/** Order must mirror `resume.skills` in src/data/resume.ts — both are zipped by index. */
export const resumeSkillGroupKeys = [
  'dataScienceAI',
  'dataEngineering',
  'fullStack',
  'cloudMlops',
  'visualization',
] as const;

/** "Sep 2025" in the reader's language; empty when the credential carries no issue date. */
export function formatCertificationDate(
  lang: Lang,
  cert: { month?: number; year?: number },
): string {
  if (!cert.year) return '';
  if (!cert.month) return String(cert.year);

  return new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' }).format(
    new Date(cert.year, cert.month - 1, 1),
  );
}

export type LocalizedLanguage = {
  code: ResumeLanguage['code'];
  name: string;
  level: string;
  credential?: string;
};

export function getLocalizedLanguages(t: Translation): LocalizedLanguage[] {
  return baseResume.languages.map((entry) => ({
    code: entry.code,
    name: t.resume.languageNames[entry.code],
    level: t.resume.languageLevels[entry.level],
    credential: entry.credential,
  }));
}
