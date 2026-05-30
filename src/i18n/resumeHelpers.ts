import { resume as baseResume } from '../data/resume';
import type { Translation } from './types';

export function getLocalizedResume(t: Translation) {
  return {
    ...baseResume,
    summary: t.resumeData.summary,
    experience: baseResume.experience.map((entry, entryIndex) => {
      const localizedEntry = t.resumeData.experience[entryIndex];

      return {
        ...entry,
        company: localizedEntry?.company ?? entry.company,
        period: localizedEntry?.period ?? entry.period,
        engagements: entry.engagements.map((engagement, engagementIndex) => {
          const localized = localizedEntry?.engagements[engagementIndex];

          return {
            ...engagement,
            project: localized?.project ?? engagement.project,
            achievements: localized?.achievements ?? engagement.achievements,
          };
        }),
      };
    }),
    projects: baseResume.projects.map((project, index) => ({
      ...project,
      description: t.resumeData.projects[index]?.description ?? project.description,
    })),
    education: baseResume.education.map((entry, index) => {
      const localized = t.resumeData.education?.[index];

      return {
        ...entry,
        degree: localized?.degree ?? entry.degree,
        period: localized?.period ?? entry.period,
      };
    }),
  };
}

export const resumeSkillGroupKeys = [
  'dataScienceAI',
  'dataEngineering',
  'fullStack',
  'visualization',
] as const;
