import React, { useMemo, useState } from 'react';
import { CreditLimitChange } from '../../types';
import { formatINR } from '../../lib/format';

const W = 640;
const H = 200;
const PAD = { top: 18, right: 20, bottom: 26, left: 64 };

interface Model {
  points: { x: number; y: number; change: CreditLimitChange }[];
  ticks: { y: number; label: string }[];
  stepPath: string;
  dropIdx: number;
  drop: number;
  yOf: (v: number) => number;
  innerW: number;
  innerH: number;
}

/** Step-line of the asymmetric-EMA credit limit trajectory. */
export const LimitTrajectory: React.FC<{ changes: CreditLimitChange[] }> = ({ changes }) => {
  const [hover, setHover] = useState<number | null>(null);

  const model: Model | null = useMemo(() => {
    const sorted = [...changes].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const n = sorted.length;
    if (n === 0) return null;

    const times = sorted.map((c) => +new Date(c.created_at));
    const values = sorted.map((c) => parseFloat(c.new_limit));
    const prior = sorted.map((c, i) => (i === 0 ? values[0] : parseFloat(c.previous_limit)));
    const lo = Math.min(...values, ...prior);
    const hi = Math.max(...values, ...prior);
    const span = hi - lo || hi || 1;
    const yMin = Math.max(0, lo - span * 0.15);
    const yMax = hi + span * 0.15;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const xOf = (t: number) => {
      if (n === 1) return PAD.left + innerW / 2;
      const t0 = times[0];
      const t1 = times[n - 1];
      const frac = t1 === t0 ? 0.5 : (t - t0) / (t1 - t0);
      return PAD.left + frac * innerW;
    };
    const yOf = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

    const points = sorted.map((c, i) => ({ x: xOf(times[i]), y: yOf(values[i]), change: c }));

    // Value holds the prior level until a change lands, then jumps — hence the step.
    let stepPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < n; i++) {
      stepPath += ` L ${points[i].x} ${yOf(prior[i])}`;
      stepPath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Largest single-step drop — the "lost fast" moment.
    let dropIdx = -1;
    let drop = 0;
    sorted.forEach((c, i) => {
      const d = prior[i] - values[i];
      if (d > drop) {
        drop = d;
        dropIdx = i;
      }
    });

    const ticks = [0.25, 0.5, 0.75].map((f) => ({
      y: yOf(yMin + f * (yMax - yMin)),
      label: formatINR(yMin + f * (yMax - yMin), 0),
    }));

    return { points, ticks, stepPath, dropIdx, drop, yOf, innerW, innerH };
  }, [changes]);

  if (!model) return null;

  const { points, ticks, stepPath, dropIdx, drop, yOf, innerW, innerH } = model;
  const last = points[points.length - 1];
  const hov = hover != null ? points[hover] : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  };

  const tooltipLeft = hov ? Math.min(94, Math.max(6, (hov.x / W) * 100)) : 0;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full select-none"
        role="img"
        aria-label={`Credit limit over time. Current limit ${formatINR(last.change.new_limit, 0)}.`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Recessive grid + y ticks */}
        {ticks.map((t) => (
          <g key={t.label}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="#D8D1C3" strokeWidth="1" />
            <text x={PAD.left - 8} y={t.y + 3} textAnchor="end" className="fill-muted-ink font-mono" fontSize="10">
              {t.label}
            </text>
          </g>
        ))}

        {/* Step line — single sequential hue, thin mark */}
        <path d={stepPath} fill="none" stroke="#2F6F68" strokeWidth="2" strokeLinejoin="round" />

        {/* The "lost fast" segment — accent marks the single largest drop */}
        {dropIdx > 0 && (
          <g>
            <line
              x1={points[dropIdx].x}
              x2={points[dropIdx].x}
              y1={yOf(parseFloat(points[dropIdx].change.previous_limit))}
              y2={points[dropIdx].y}
              stroke="#C65D2B"
              strokeWidth="2.5"
            />
            <text
              x={points[dropIdx].x + 8}
              y={(yOf(parseFloat(points[dropIdx].change.previous_limit)) + points[dropIdx].y) / 2}
              className="fill-accent font-mono"
              fontSize="10"
              fontWeight="600"
            >
              −{formatINR(drop, 0)}
            </text>
          </g>
        )}

        {/* Hover guide */}
        {hov && (
          <g>
            <line x1={hov.x} x2={hov.x} y1={PAD.top} y2={H - PAD.bottom} stroke="#2F6F68" strokeOpacity="0.3" strokeWidth="1" />
            <circle cx={hov.x} cy={hov.y} r="4" fill="#C65D2B" />
          </g>
        )}

        {/* Current value — direct label at the last point */}
        <circle cx={last.x} cy={last.y} r="4.5" fill="#245651" />
        <text
          x={Math.min(W - PAD.right - 4, last.x + 10)}
          y={last.y + 4}
          className="fill-ink font-mono"
          fontSize="11"
          fontWeight="700"
        >
          {formatINR(last.change.new_limit, 0)}
        </text>
      </svg>

      {/* Hover tooltip */}
      {hov && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-52 -translate-x-1/2 rounded-[2px] border border-border bg-surface p-3 shadow-card"
          style={{ left: `${tooltipLeft}%` }}
        >
          <p className="kicker text-muted-ink">{new Date(hov.change.created_at).toLocaleString()}</p>
          <p className="mt-1.5 font-mono text-xs text-ink">
            {formatINR(hov.change.previous_limit, 0)} → <span className="font-bold">{formatINR(hov.change.new_limit, 0)}</span>
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-accent">{hov.change.trigger}</p>
          <p className="mt-0.5 text-[11px] text-muted-ink">{hov.change.reason}</p>
        </div>
      )}
    </div>
  );
};
