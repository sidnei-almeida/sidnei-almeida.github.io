import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

type ExerciseCodeBlockProps = {
  code: string;
  language?: string;
  copyable?: boolean;
};

export function ExerciseCodeBlock({ code, language = 'python', copyable = true }: ExerciseCodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback silencioso se clipboard não estiver disponível */
    }
  }, [code]);

  return (
    <div className="exercise-code-block">
      <div className="exercise-code-block__bar">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="exercise-code-block__dot" />
          <span className="exercise-code-block__dot" />
          <span className="exercise-code-block__dot" />
        </div>
        <span className="exercise-code-block__lang">{language}</span>
        {copyable && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="exercise-code-block__copy"
            aria-label={t.pythonExercise.osSetup.copyAria}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" strokeWidth={2} />
                <span>{t.pythonExercise.osSetup.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" strokeWidth={1.5} />
                <span>{t.pythonExercise.osSetup.copy}</span>
              </>
            )}
          </button>
        )}
      </div>
      <pre className="exercise-code-block__pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
