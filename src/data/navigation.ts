import type { NavLabelKey } from '../i18n/types';
import { PYTHON_EXERCISE_PAGE_PATH } from './pythonExercise';

export type NavItem = {
  labelKey: NavLabelKey;
  href: string;
  isRoute?: boolean;
};

export const navItems: NavItem[] = [
  { labelKey: 'home', href: '/', isRoute: true },
  { labelKey: 'about', href: '/#about' },
  { labelKey: 'experience', href: '/#experience' },
  { labelKey: 'projects', href: '/#projects' },
  { labelKey: 'skills', href: '/#skills' },
  { labelKey: 'resume', href: '/resume', isRoute: true },
  { labelKey: 'contact', href: '/contact', isRoute: true },
];

export const footerNav: NavItem[] = [
  { labelKey: 'home', href: '/', isRoute: true },
  { labelKey: 'projects', href: '/#projects' },
  { labelKey: 'about', href: '/#about' },
  { labelKey: 'contact', href: '/contact', isRoute: true },
];

export type FooterProgramLink = {
  href: string;
  isRoute: true;
  labelKey: 'uspEsalq';
};

export const footerProgramLinks: FooterProgramLink[] = [
  { labelKey: 'uspEsalq', href: PYTHON_EXERCISE_PAGE_PATH, isRoute: true },
];
