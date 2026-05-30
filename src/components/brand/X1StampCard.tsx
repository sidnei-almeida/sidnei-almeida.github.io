import type { ReactNode } from 'react';
import { X1TextWatermark } from './X1TextWatermark';

type X1StampCardProps = {
  children: ReactNode;
  className?: string;
};

export function X1StampCard({ children, className = '' }: X1StampCardProps) {
  return (
    <div
      className={`x1-stamp-card relative overflow-hidden border border-line bg-panel pb-11 ${className}`.trim()}
    >
      {children}
      <X1TextWatermark />
    </div>
  );
}
