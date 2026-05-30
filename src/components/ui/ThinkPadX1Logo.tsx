type ThinkPadX1LogoProps = {
  className?: string;
};

export function ThinkPadX1Logo({ className = '' }: ThinkPadX1LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 72 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        fill="var(--color-accent)"
        d="M0 22.5 6.8 22.5 18.2 9.2 11.4 9.2 0 22.5ZM11.4 22.5 18.2 22.5 6.8 9.2 0 9.2 11.4 22.5ZM11.4 14.8 18.2 14.8 6.8 1.5 0 1.5 11.4 14.8ZM0 14.8 6.8 14.8 18.2 1.5 11.4 1.5 0 14.8Z"
      />
      <path
        fill="var(--color-label)"
        d="M24.5 1.5h3.2v21h-3.2V1.5ZM22.8 1.5h6.6v2.1h-6.6V1.5ZM22.8 20.4h6.6v2.1h-6.6v-2.1Z"
      />
    </svg>
  );
}
