import type { Project } from '../data/projects';
import type { Translation } from '../i18n/types';

export function localizeProject(project: Project, t: Translation): Project {
  if (project.id === 'python-orders-exercise') {
    const card = t.pythonExercise.card;
    return {
      ...project,
      title: card.title,
      shortDescription: card.shortDescription,
      category: card.category,
      tags: card.tags,
    };
  }
  return project;
}
