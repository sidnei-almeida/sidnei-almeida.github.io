import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { PYTHON_EXERCISE_DOWNLOAD_URL } from '../../data/pythonExercise';

type ExerciseDownloadLinkProps = {
  children: ReactNode;
  className?: string;
};

/** Mesmo visual do link "Baixar currículo" no hero e na página de resume */
const downloadLinkClass =
  'inline-flex h-[44px] items-center gap-2 text-[11px] uppercase tracking-label text-ink-label opacity-70 transition-opacity duration-150 hover:text-accent hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function ExerciseDownloadLink({ children, className = '' }: ExerciseDownloadLinkProps) {
  return (
    <a
      href={PYTHON_EXERCISE_DOWNLOAD_URL}
      download="analise_pedidos_guiado.py"
      className={`${downloadLinkClass} ${className}`.trim()}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
      {children}
    </a>
  );
}
