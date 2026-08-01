import React from 'react';
import { CheckCircle, HandPalm, LockKey, UserFocus } from '@phosphor-icons/react';
import { AgentStatus } from '../types';

interface StatusBadgeProps {
  status: AgentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[10px]';
  const base = `inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-[.08em] ring-1 ${sizeClasses}`;

  switch (status) {
    case 'NORMAL':
      return (
        <span className={`${base} bg-teal-light text-teal-dark ring-teal/20`}>
          <CheckCircle size={14} weight="fill" aria-hidden="true" />
          NORMAL
        </span>
      );
    case 'RESTRICTED':
      return (
        <span className={`${base} bg-warning-light text-warning ring-warning/20`}>
          <HandPalm size={14} weight="fill" aria-hidden="true" />
          RESTRICTED
        </span>
      );
    case 'FROZEN':
      return (
        <span className={`${base} bg-danger-light text-danger ring-danger/20`}>
          <LockKey size={14} weight="fill" aria-hidden="true" />
          FROZEN
        </span>
      );
    case 'HUMAN_REVIEW':
      return (
        <span className={`${base} bg-canvas text-muted-ink ring-olive/30`}>
          <UserFocus size={14} weight="fill" aria-hidden="true" />
          HUMAN_REVIEW
        </span>
      );
    default:
      return (
        <span className={`${base} bg-canvas text-muted-ink ring-border`}>
          {status}
        </span>
      );
  }
};

export const ImputedBadge: React.FC<{ isImputed: boolean }> = ({ isImputed }) => {
  if (isImputed) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-warning/10 text-warning border border-warning/20" title="Imputed prior from identity level">
        PROVISIONAL (IMPUTED)
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-teal/10 text-teal border border-teal/20" title="Derived from verified real-world evidence">
      EARNED EVIDENCE
    </span>
  );
};
