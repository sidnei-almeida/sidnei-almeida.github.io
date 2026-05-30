export type ServiceItem = {
  title: string;
};

export const whatIDo: ServiceItem[] = [
  { title: 'AI Strategy & Solution Design' },
  { title: 'Machine Learning & Data Science' },
  { title: 'Full-Stack Web Development' },
  { title: 'Cloud Architecture & DevOps' },
  { title: 'Data Engineering & Analytics' },
];

export type Education = {
  institution: string;
};

/** From JSON-LD in old/index.html */
export const education: Education[] = [
  { institution: 'Universidade Federal de Santa Catarina (UFSC)' },
  { institution: 'Universidade de Caxias do Sul (UCS)' },
  { institution: 'Universidade Federal do Rio Grande do Sul (UFRGS)' },
];
