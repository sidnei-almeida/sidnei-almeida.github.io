import type { ReactNode } from 'react';
import { PYTHON_EXERCISE_DOWNLOAD_URL } from '../../data/pythonExercise';

type ExerciseDownloadLinkProps = {
  children: ReactNode;
  className?: string;
  /** Destaque visual para hero e CTA final */
  prominent?: boolean;
};

export function ExerciseDownloadLink({
  children,
  className = '',
  prominent = false,
}: ExerciseDownloadLinkProps) {
  const base = prominent
    ? 'inline-flex h-12 items-center gap-3 rounded-btn border border-[#c8102e] bg-[#c8102e] px-8 type-button text-white shadow-[0_4px_20px_rgba(200,16,46,0.25)] transition-colors duration-300 hover:border-[#a00d24] hover:bg-[#a00d24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
    : 'inline-flex h-11 items-center gap-3 rounded-btn border border-line bg-canvas-surface px-7 type-button text-ink-primary transition-colors duration-300 hover:border-accent/50 hover:text-ink-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

  return (
    <a
      href={PYTHON_EXERCISE_DOWNLOAD_URL}
      download="analise_pedidos_guiado.py"
      className={`${base} ${className}`}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      <span className="inline-block h-px w-4 bg-accent" aria-hidden />
      {children}
    </a>
  );
}
