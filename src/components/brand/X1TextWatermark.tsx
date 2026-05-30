type X1TextWatermarkProps = {
  className?: string;
};

/** Ghost ×1 stamp — ThinkPad X1 Carbon motif (× U+00D7, not letter x). */
export function X1TextWatermark({ className = '' }: X1TextWatermarkProps) {
  return (
    <span className={`x1-text-watermark x1-text-watermark--br ${className}`.trim()} aria-hidden>
      {'\u00D7'}
      <span className="x1-text-watermark__one">1</span>
    </span>
  );
}
