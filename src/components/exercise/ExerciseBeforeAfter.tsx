import { ArrowRight } from 'lucide-react';
import { ExerciseCodeBlock } from './ExerciseCodeBlock';

type ExerciseBeforeAfterProps = {
  beforeLabel: string;
  afterLabel: string;
  beforeCode: string;
  afterCode: string;
};

export function ExerciseBeforeAfter({
  beforeLabel,
  afterLabel,
  beforeCode,
  afterCode,
}: ExerciseBeforeAfterProps) {
  return (
    <div className="exercise-before-after">
      <div className="exercise-before-after__panel">
        <p className="exercise-before-after__label exercise-before-after__label--muted">{beforeLabel}</p>
        <ExerciseCodeBlock code={beforeCode} language="python" className="exercise-before-after__code" />
      </div>
      <div className="exercise-before-after__separator" aria-hidden>
        <ArrowRight className="hidden h-4 w-4 text-accent md:block" strokeWidth={1.5} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent md:hidden">↓</span>
      </div>
      <div className="exercise-before-after__panel">
        <p className="exercise-before-after__label exercise-before-after__label--active">{afterLabel}</p>
        <ExerciseCodeBlock code={afterCode} language="python" className="exercise-before-after__code" />
      </div>
    </div>
  );
}
