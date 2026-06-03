import { Download } from 'lucide-react';
import type { ReactNode } from 'react';

/** Mesmo estilo do link "Baixar currículo" no hero (HeroSection / ResumePage). */
const downloadTextLinkClass =
  'inline-flex h-[44px] items-center gap-2 text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

type DownloadTextLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  download?: string;
  target?: string;
  rel?: string;
  'aria-label'?: string;
};

export function DownloadTextLink({
  href,
  children,
  className = '',
  download,
  target,
  rel,
  'aria-label': ariaLabel,
}: DownloadTextLinkProps) {
  return (
    <a
      href={href}
      download={download}
      target={target}
      rel={rel}
      className={`${downloadTextLinkClass} ${className}`.trim()}
      aria-label={ariaLabel ?? (typeof children === 'string' ? children : undefined)}
    >
      <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
      {children}
    </a>
  );
}
