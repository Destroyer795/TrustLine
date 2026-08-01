import React from 'react';
import { cn } from '../lib/cn';

type Accent = 'default' | 'teal' | 'olive' | 'warning' | 'danger' | 'ink';

const accentValue: Record<Accent, string> = {
  default: 'text-ink',
  teal: 'text-teal-dark',
  olive: 'text-olive',
  warning: 'text-warning-text',
  danger: 'text-danger',
  ink: 'text-walnut',
};

const accentTick: Record<Accent, string> = {
  default: 'bg-border-dark',
  teal: 'bg-teal',
  olive: 'bg-olive',
  warning: 'bg-accent',
  danger: 'bg-danger',
  ink: 'bg-walnut',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  caption?: string;
  accent?: Accent;
  icon?: React.ReactNode;
  variant?: 'box' | 'flat';
  className?: string;
}

/** Editorial metric tile — mono label with accent tick, display value, muted caption. */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  caption,
  accent = 'default',
  icon,
  variant = 'box',
  className,
}) => {
  return (
    <div className={cn(variant === 'box' && 'card-editorial rounded-sm p-5', variant === 'flat' && 'bg-surface p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0', accentTick[accent])} />
            <span className="kicker text-muted-ink truncate">{label}</span>
          </span>
          <span className={cn('mt-2 block font-display text-2xl font-semibold tracking-tight leading-none', accentValue[accent])}>
            {value}
          </span>
          {caption && <span className="mt-2 block text-[11px] text-muted-ink leading-snug">{caption}</span>}
        </div>
        {icon && <span aria-hidden="true" className="text-muted-ink/60 shrink-0 mt-0.5">{icon}</span>}
      </div>
    </div>
  );
};
