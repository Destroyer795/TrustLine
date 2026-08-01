import React, { useState } from 'react';
import { AuditEvent } from '../../types';
import { cn } from '../../lib/cn';

/**
 * Hash-chain timeline: one dot per audit event, in sequence order. Single
 * teal family; the event whose hash link broke carries a danger ring — the
 * "one edit breaks the chain" story. Hover/focus shows the event detail.
 */
export const AuditTimeline: React.FC<{ events: AuditEvent[]; corruptedSequence?: number | null }> = ({
  events,
  corruptedSequence,
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);
  const n = sorted.length;
  if (n < 3) return null;

  const corruptedIdx =
    corruptedSequence != null ? sorted.findIndex((e) => e.sequence === corruptedSequence) : -1;

  return (
    <div className="px-6 py-6">
      <div className="relative">
        <div aria-hidden="true" className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div className="relative flex items-stretch">
          {sorted.map((ev, i) => {
            const isCorrupt = i === corruptedIdx;
            const isHover = hover === i;
            return (
              <div key={ev.sequence} className="relative flex-1 flex justify-center">
                <button
                  type="button"
                  aria-label={`Event #${ev.sequence}: ${ev.event_type}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className={cn(
                    'relative z-10 h-3.5 w-3.5 rounded-full border border-surface transition-transform focus-visible:scale-125',
                    isCorrupt ? 'bg-danger ring-2 ring-danger/40' : 'bg-teal hover:scale-125',
                  )}
                />
                {isHover && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-6 left-1/2 z-20 w-48 -translate-x-1/2 rounded-[2px] border border-border bg-surface p-3 text-left shadow-card"
                  >
                    <p className="kicker text-muted-ink">
                      #{ev.sequence} · {ev.event_type}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-ink">{new Date(ev.created_at).toLocaleString()}</p>
                    <p className="mt-0.5 break-all font-mono text-[10px] text-muted-ink">
                      {ev.actor} → {ev.entity}
                    </p>
                    {isCorrupt && <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-danger">Chain broken here</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-[10px] uppercase tracking-widest text-muted-ink">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal" /> Routine event
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-danger ring-2 ring-danger/40" /> Chain broken here
        </span>
        <span className="hidden sm:inline">Sequence →</span>
      </div>
    </div>
  );
};
