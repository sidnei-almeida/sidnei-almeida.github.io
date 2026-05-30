import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { profile } from '../../data/profile';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const inputClassName =
  'w-full border border-line bg-canvas-surface px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted transition-colors focus:border-accent/45 focus:outline-none';

export function ContactForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<FormStatus>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(profile.formspreeEndpoint, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      setStatus('success');
      form.reset();
      window.setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 4000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="contact-name" className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-ink-label">
          {t.contactForm.name}
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          placeholder={t.contactForm.namePlaceholder}
          className={inputClassName}
          disabled={status === 'sending'}
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-ink-label">
          {t.contactForm.email}
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t.contactForm.emailPlaceholder}
          className={inputClassName}
          disabled={status === 'sending'}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-ink-label">
          {t.contactForm.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          placeholder={t.contactForm.messagePlaceholder}
          className={`${inputClassName} resize-y min-h-[140px] leading-relaxed`}
          disabled={status === 'sending'}
        />
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          variant="outline"
          className="h-[44px] w-full justify-center sm:w-auto"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? (
            t.contactForm.sending
          ) : (
            <>
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t.contactForm.submit}
            </>
          )}
        </Button>

        {status === 'success' && (
          <p className="text-[11px] uppercase tracking-label text-accent" role="status">
            {t.contactForm.success}
          </p>
        )}
        {status === 'error' && (
          <p className="text-[11px] uppercase tracking-label text-accent" role="alert">
            {t.contactForm.error}
          </p>
        )}
      </div>
    </form>
  );
}
