import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { profile } from '../../data/profile';
import { useTranslation } from '../../i18n/useTranslation';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

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
    <form onSubmit={handleSubmit} className="contact-x1-form flex flex-col gap-5">
      <div>
        <label htmlFor="contact-name" className="contact-x1-form__label">
          {t.contactForm.name}
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          placeholder={t.contactForm.namePlaceholder}
          className="contact-x1-form__field"
          disabled={status === 'sending'}
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="contact-x1-form__label">
          {t.contactForm.email}
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t.contactForm.emailPlaceholder}
          className="contact-x1-form__field"
          disabled={status === 'sending'}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="contact-x1-form__label">
          {t.contactForm.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          placeholder={t.contactForm.messagePlaceholder}
          className="contact-x1-form__field contact-x1-form__field--textarea"
          disabled={status === 'sending'}
        />
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="contact-x1-form__submit h-[44px] w-full sm:w-auto"
          disabled={status === 'sending'}
        >
          <span className="contact-x1-form__submit-dash" aria-hidden />
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          {status === 'sending' ? t.contactForm.sending : t.contactForm.submit}
        </button>

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
