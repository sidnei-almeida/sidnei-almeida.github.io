import type { NavLabelKey } from '../i18n/types';

export type NavItem = {
  labelKey: NavLabelKey;
  href: string;
  isRoute?: boolean;
};

export const navItems: NavItem[] = [
  { labelKey: 'home', href: '/', isRoute: true },
  { labelKey: 'about', href: '/#about' },
  { labelKey: 'projects', href: '/#projects' },
  { labelKey: 'mentoria', href: '/mentoria', isRoute: true },
  { labelKey: 'skills', href: '/#skills' },
  { labelKey: 'resume', href: '/resume', isRoute: true },
  { labelKey: 'contact', href: '/contact', isRoute: true },
];

export const footerNav: NavItem[] = [
  { labelKey: 'home', href: '/', isRoute: true },
  { labelKey: 'projects', href: '/#projects' },
  { labelKey: 'about', href: '/#about' },
  { labelKey: 'mentoria', href: '/mentoria', isRoute: true },
  { labelKey: 'contact', href: '/contact', isRoute: true },
];

export type FooterProgramLink = {
  href: string;
  isRoute: true;
  labelKey: 'mentoriaProgram';
};

export const footerProgramLinks: FooterProgramLink[] = [
  { labelKey: 'mentoriaProgram', href: '/mentoria', isRoute: true },
];
