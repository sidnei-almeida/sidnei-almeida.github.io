type DividerLineProps = {
  className?: string;
};

export function DividerLine({ className = '' }: DividerLineProps) {
  return <div className={`h-px w-full bg-line ${className}`} role="presentation" />;
}
