import React from 'react';
import { cn } from '../lib/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Editorial empty state — geometric icon tile, title, description, optional CTA. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => {
  return (
    <div className={cn('py-16 px-6 text-center', className)}>
      {icon && (
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-canvas text-muted-ink">
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-ink leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
