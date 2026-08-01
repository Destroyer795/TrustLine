import React from 'react';
import { cn } from '../lib/cn';
import { AgentStatus } from '../types';

interface StatusBadgeProps {
  status: AgentStatus | string;
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

const statusStyles: Record<string, { chip: string; dot: string }> = {
  NORMAL: { chip: 'bg-teal-light text-teal-dark border-teal/30', dot: 'bg-teal' },
  RESTRICTED: { chip: 'bg-warning-light text-warning-text border-warning/30', dot: 'bg-accent' },
  FROZEN: { chip: 'bg-danger-light text-danger border-danger/30', dot: 'bg-danger' },
  HUMAN_REVIEW: { chip: 'bg-canvas text-muted-ink border-border', dot: 'bg-olive' },
};

const fallbackStyle = statusStyles.HUMAN_REVIEW;

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const style = statusStyles[status] ?? fallbackStyle;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[2px] border font-mono font-medium tracking-wide',
        sizeClasses[size],
        style.chip,
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0', style.dot)} />
      {status}
    </span>
  );
};

export const ImputedBadge: React.FC<{ isImputed: boolean }> = ({ isImputed }) => {
  if (isImputed) {
    return (
      <span className="inline-flex items-center rounded-[2px] border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-warning-text" title="Imputed prior from identity level">
        PROVISIONAL (IMPUTED)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-[2px] border border-teal/30 bg-teal/10 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-teal-dark" title="Derived from verified real-world evidence">
      EARNED EVIDENCE
    </span>
  );
};
