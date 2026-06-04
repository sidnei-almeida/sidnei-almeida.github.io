import { PYTHON_EXERCISE_PAGE_PATH } from './pythonExercise';

export type MentoriaModuleStatus = 'available' | 'coming-soon';

export type MentoriaModuleMeta = {
  id: string;
  number: string;
  status: MentoriaModuleStatus;
  lessonCount: number;
  finalProjectHref: string | null;
};

/** Program modules — add new entries here; copy i18n block in locales under mentoria.modules */
export const mentoriaModules: MentoriaModuleMeta[] = [
  {
    id: 'modulo-01',
    number: '01',
    status: 'available',
    lessonCount: 9,
    finalProjectHref: PYTHON_EXERCISE_PAGE_PATH,
  },
  {
    id: 'modulo-02',
    number: '02',
    status: 'coming-soon',
    lessonCount: 0,
    finalProjectHref: null,
  },
  {
    id: 'modulo-03',
    number: '03',
    status: 'coming-soon',
    lessonCount: 0,
    finalProjectHref: null,
  },
];
