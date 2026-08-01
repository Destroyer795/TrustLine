import React from 'react';
import { cn } from '../lib/cn';

/**
 * TrustLine bridge mark — a "T" drawn as a suspension bridge.
 * Deck  = the credit line
 * Cables = the Ed25519-signed capability mandate
 * Tower = principal authority, rooted in the ledger
 * The gap it spans is the trust gap between a principal and a machine.
 */
export const LogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" role="img" aria-hidden="true" focusable="false" className={className}>
    <rect x="4" y="8" width="40" height="6" rx="1" fill="currentColor" />
    <path d="M8 15 L21 21 M40 15 L27 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" fill="none" />
    <rect x="20" y="16" width="8" height="24" rx="1" fill="currentColor" />
  </svg>
);

export const Logo: React.FC<{ className?: string; markClassName?: string; tagline?: boolean }> = ({
  className,
  markClassName,
  tagline = true,
}) => (
  <span className={cn('flex items-center gap-3 text-ink', className)}>
    <LogoMark className={cn('h-9 w-9 shrink-0 text-teal', markClassName)} />
    <span className="flex flex-col leading-none">
      <span className="font-display font-semibold text-lg tracking-tight leading-none">TrustLine</span>
      {tagline && (
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-ink">
          Credit, extended to machines.
        </span>
      )}
    </span>
  </span>
);
