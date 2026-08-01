import React from 'react';
import { RiskEvidence } from '../../types';
import { ImputedBadge } from '../StatusBadge';
import { cn } from '../../lib/cn';

/**
 * Risk component breakdown as horizontal bars. Single teal family — identity
 * is carried by position + label, and imputed evidence by hatch texture, so
 * no hue-encoding is relied on (the brand palette is not a categorical set).
 */
export const RiskComponents: React.FC<{ evidence: RiskEvidence[]; weighted: string }> = ({ evidence, weighted }) => (
  <div>
    {/* AHP weighted composite — headline number, not a hue */}
    <div className="mb-5 flex items-center justify-between gap-4 rounded-[2px] border border-teal/30 bg-teal-light px-5 py-4">
      <span className="kicker text-teal-dark">AHP Weighted Composite</span>
      <span className="font-mono text-2xl font-bold text-teal-dark">
        {weighted}
        <span className="text-sm font-medium text-teal-dark/70"> / 100</span>
      </span>
    </div>

    <ol className="divide-y divide-border border border-border rounded-sm bg-surface shadow-card">
      {evidence.map((ev) => {
        const score = parseFloat(ev.score) * 100;
        const width = `${Math.min(100, Math.max(0, score))}%`;
        return (
          <li key={ev.component} className="px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-ink">{ev.component}</h3>
                <ImputedBadge isImputed={ev.is_imputed} />
              </div>
              <span className="font-mono text-lg font-bold text-ink">
                {score.toFixed(1)}
                <span className="text-xs font-medium text-muted-ink"> / 100</span>
              </span>
            </div>
            <div
              role="meter"
              aria-valuenow={Math.round(score)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${ev.component} ${Math.round(score)} of 100${ev.is_imputed ? ', provisional — imputed' : ''}`}
              aria-label={`${ev.component} score`}
              className="mt-3 h-3 w-full bg-canvas border border-border"
            >
              <div
                className={cn('h-full', ev.is_imputed ? 'risk-bar-imputed' : 'bg-teal')}
                style={{ width }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-ink leading-relaxed">{ev.reason}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-ink">
              Source: {ev.source} • Samples: {ev.evidence_count}
            </p>
          </li>
        );
      })}
    </ol>
  </div>
);
