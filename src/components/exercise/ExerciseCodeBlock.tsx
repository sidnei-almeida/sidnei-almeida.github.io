type ExerciseCodeBlockProps = {
  code: string;
  language?: string;
};

export function ExerciseCodeBlock({ code, language = 'python' }: ExerciseCodeBlockProps) {
  return (
    <div className="exercise-code-block">
      <div className="exercise-code-block__bar" aria-hidden>
        <span className="exercise-code-block__dot" />
        <span className="exercise-code-block__dot" />
        <span className="exercise-code-block__dot" />
        <span className="exercise-code-block__lang">{language}</span>
      </div>
      <pre className="exercise-code-block__pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
