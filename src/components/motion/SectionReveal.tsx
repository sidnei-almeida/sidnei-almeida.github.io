import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { sectionStaggerContainer } from '../../lib/motion';

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  once?: boolean;
};

export function SectionReveal({
  children,
  className = '',
  variants = sectionStaggerContainer,
  once = true,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: 0.12, margin: '-50px 0px' });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion || inView ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
