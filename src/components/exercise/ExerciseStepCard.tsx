import type { ReactNode } from 'react';

type ExerciseStepCardProps = {
  number: number;
  title: string;
  children: ReactNode;
};

export function ExerciseStepCard({ number, title, children }: ExerciseStepCardProps) {
  const numLabel = String(number).padStart(2, '0');

  return (
    <article className="exercise-step-card">
      <span className="exercise-step-card__watermark" aria-hidden>
        {numLabel}
      </span>
      <div className="exercise-step-card__header">
        <span className="exercise-step-card__num" aria-hidden>
          {numLabel}
        </span>
        <h3 className="exercise-step-card__title">{title}</h3>
      </div>
      <div className="exercise-step-card__body">{children}</div>
    </article>
  );
}
