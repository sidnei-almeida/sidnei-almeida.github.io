type X1MarkProps = {
  className?: string;
  size?: number;
};

export function X1Mark({ className = '', size = 40 }: X1MarkProps) {
  return (
    <img
      src="/assets/brand/x1.png"
      alt=""
      className={`x1-mark ${className}`.trim()}
      width={size}
      height={size}
      loading="lazy"
      aria-hidden
    />
  );
}
