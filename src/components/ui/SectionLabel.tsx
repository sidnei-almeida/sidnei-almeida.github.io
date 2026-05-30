import { motion } from 'framer-motion';
import { fadeUpItem, labelLineVariant } from '../../lib/motion';

type SectionLabelProps = {
  children: string;
  className?: string;
  animated?: boolean;
};

export function SectionLabel({ children, className = '', animated = false }: SectionLabelProps) {
  if (!animated) {
    return (
      <p className={`type-section-label flex items-center text-ink-label ${className}`}>
        <span className="mr-3.5 inline-block h-px w-5 bg-accent" aria-hidden />
        {children}
      </p>
    );
  }

  return (
    <motion.p
      variants={fadeUpItem}
      className={`type-section-label flex items-center text-ink-label ${className}`}
    >
      <motion.span
        variants={labelLineVariant}
        className="mr-3.5 inline-block h-px w-5 origin-left bg-accent"
        aria-hidden
      />
      {children}
    </motion.p>
  );
}
