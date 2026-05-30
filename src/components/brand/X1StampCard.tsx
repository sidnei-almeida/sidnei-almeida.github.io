import type { ReactNode } from 'react';
import { X1Mark } from './X1Mark';

type X1StampCardProps = {
  children: ReactNode;
  className?: string;
  markSize?: number;
};

export function X1StampCard({ children, className = '', markSize }: X1StampCardProps) {
  return (
    <div
      className={`x1-stamp-card relative overflow-hidden border border-line bg-panel pb-11 ${className}`.trim()}
    >
      {children}
      <X1Mark className="x1-mark--br" size={markSize} />
    </div>
  );
}
