import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'ghost' | 'outline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  href?: string;
  mono?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-line bg-canvas-surface text-ink-primary hover:border-accent/50 hover:text-ink-bright',
  outline:
    'border border-line bg-transparent text-ink-primary hover:border-accent/40 hover:text-ink-bright',
  ghost: 'border border-transparent bg-transparent text-ink-secondary hover:text-ink-primary',
};

function isInternalHref(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  href,
  mono = false,
  ...props
}: ButtonProps) {
  const typeClass = mono ? 'type-mono-link' : 'type-button';
  const classes = `inline-flex h-11 items-center gap-3 rounded-btn px-7 ${typeClass} transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${variants[variant]} ${className}`;

  const content = (
    <>
      {variant !== 'ghost' && (
        <span className="inline-block h-px w-4 bg-accent" aria-hidden />
      )}
      {children}
    </>
  );

  if (href) {
    if (isInternalHref(href)) {
      return (
        <Link to={href} className={classes}>
          {content}
        </Link>
      );
    }

    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {content}
    </button>
  );
}
