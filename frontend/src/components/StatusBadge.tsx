import React from 'react';
import { AgentStatus } from '../types';

interface StatusBadgeProps {
  status: AgentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'NORMAL':
      return (
        <span className={`inline-flex items-center rounded-md font-mono font-medium bg-teal-light text-teal-dark border border-teal/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-teal mr-1.5"></span>
          NORMAL
        </span>
      );
    case 'RESTRICTED':
      return (
        <span className={`inline-flex items-center rounded-md font-mono font-medium bg-warning-light text-warning border border-warning/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-warning mr-1.5"></span>
          RESTRICTED
        </span>
      );
    case 'FROZEN':
      return (
        <span className={`inline-flex items-center rounded-md font-mono font-medium bg-danger-light text-danger border border-danger/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-danger mr-1.5"></span>
          FROZEN
        </span>
      );
    case 'HUMAN_REVIEW':
      return (
        <span className={`inline-flex items-center rounded-md font-mono font-medium bg-canvas text-muted-ink border border-border ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-olive mr-1.5"></span>
          HUMAN_REVIEW
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-md font-mono font-medium bg-canvas text-muted-ink border border-border ${sizeClasses}`}>
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
