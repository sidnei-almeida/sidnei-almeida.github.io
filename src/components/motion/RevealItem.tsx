import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUpItem } from '../../lib/motion';

type RevealItemProps = {
  children: ReactNode;
  className?: string;
};

export function RevealItem({ children, className = '' }: RevealItemProps) {
  return (
    <motion.div variants={fadeUpItem} className={className}>
      {children}
    </motion.div>
  );
}
