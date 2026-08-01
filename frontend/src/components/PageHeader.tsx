import React from 'react';
import { cn } from '../lib/cn';

interface PageHeaderProps {
  kicker: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Editorial page header — kicker rule, Fraunces title, muted description, optional action slot. */
export const PageHeader: React.FC<PageHeaderProps> = ({ kicker, title, description, actions, className }) => {
  return (
    <header className={cn('pb-6 border-b border-border', className)}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            <span className="kicker text-muted-ink">{kicker}</span>
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-muted-ink leading-relaxed">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
};
