type MentoriaColabGuideProps = {
  title: string;
  steps: string[];
  notice: string;
};

export function MentoriaColabGuide({ title, steps, notice }: MentoriaColabGuideProps) {
  return (
    <aside className="mentoria-colab-guide mt-6 border border-line border-l-2 border-l-accent bg-canvas/50 p-5 lg:p-6">
      <h3 className="text-base font-medium text-ink-primary lg:text-[1.05rem]">{title}</h3>
      <ol className="mentoria-colab-guide__steps mt-4 space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink-secondary">
            <span className="mentoria-colab-guide__num font-mono text-[10px] text-accent">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-ink-muted">{notice}</p>
    </aside>
  );
}
