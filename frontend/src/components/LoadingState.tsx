import React from 'react';
import { cn } from '../lib/cn';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

/** Console-style loading line — mono label with a pulsing square. */
export const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading…', className }) => {
  return (
    <div className={cn('py-16 px-6 text-center', className)}>
      <span className="inline-flex items-center gap-3 text-sm text-muted-ink">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 animate-pulse border border-teal bg-teal-light"
        />
        <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
      </span>
    </div>
  );
};
