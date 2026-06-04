import { PYTHON_EXERCISE_PAGE_PATH } from './pythonExercise';

export type MentoriaModuleStatus = 'available' | 'coming-soon';
export type MentoriaModuleKind = 'lessons' | 'labs';

export type MentoriaModuleMeta = {
  id: string;
  number: string;
  status: MentoriaModuleStatus;
  kind: MentoriaModuleKind;
  lessonCount: number;
  finalProjectHref: string | null;
};

/** Program modules — add new entries here; copy i18n block in locales under mentoria.modules */
export const mentoriaModules: MentoriaModuleMeta[] = [
  {
    id: 'modulo-01',
    number: '01',
    status: 'available',
    kind: 'lessons',
    lessonCount: 9,
    finalProjectHref: PYTHON_EXERCISE_PAGE_PATH,
  },
  {
    id: 'modulo-02',
    number: '02',
    status: 'available',
    kind: 'labs',
    lessonCount: 4,
    finalProjectHref: null,
  },
  {
    id: 'modulo-03',
    number: '03',
    status: 'coming-soon',
    kind: 'lessons',
    lessonCount: 0,
    finalProjectHref: null,
  },
];
