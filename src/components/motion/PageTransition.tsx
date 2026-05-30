import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { pageTransition } from '../../lib/motion';

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex w-full flex-1 flex-col"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
