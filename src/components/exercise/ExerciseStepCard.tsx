import type { ReactNode } from 'react';

type ExerciseStepCardProps = {
  number: number;
  title: string;
  children: ReactNode;
};

export function ExerciseStepCard({ number, title, children }: ExerciseStepCardProps) {
  return (
    <article className="exercise-step-card border border-line bg-panel/60 p-5 lg:p-6">
      <div className="exercise-step-card__header">
        <span className="exercise-step-card__num" aria-hidden>
          {String(number).padStart(2, '0')}
        </span>
        <h3 className="exercise-step-card__title">{title}</h3>
      </div>
      <div className="exercise-step-card__body mt-4">{children}</div>
    </article>
  );
}
