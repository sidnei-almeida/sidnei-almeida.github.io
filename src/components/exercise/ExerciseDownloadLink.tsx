import type { ReactNode } from 'react';
import { DownloadTextLink } from '../ui/DownloadTextLink';
import { PYTHON_EXERCISE_DOWNLOAD_URL } from '../../data/pythonExercise';

type ExerciseDownloadLinkProps = {
  children: ReactNode;
  className?: string;
};

export function ExerciseDownloadLink({ children, className = '' }: ExerciseDownloadLinkProps) {
  return (
    <DownloadTextLink
      href={PYTHON_EXERCISE_DOWNLOAD_URL}
      download="analise_pedidos_guiado.py"
      className={className}
    >
      {children}
    </DownloadTextLink>
  );
}
