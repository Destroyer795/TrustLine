import React, { useState } from "react";

type Point = { label: string; value: number; secondary?: number };
const money = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const LineChart = ({
  data,
  label,
  secondaryLabel,
}: {
  data: Point[];
  label: string;
  secondaryLabel?: string;
}) => {
  const [active, setActive] = useState<number | null>(null);
  if (!data.length)
    return (
      <p className="py-16 text-center text-sm text-muted-ink">
        No evidence in this window.
      </p>
    );
  const values = data.flatMap((point) =>
    point.secondary === undefined
      ? [point.value]
      : [point.value, point.secondary],
  );
  const min = Math.min(...values),
    max = Math.max(...values),
    spread = max - min || 1;
  const point = (value: number, index: number) =>
    `${(index / Math.max(data.length - 1, 1)) * 100},${92 - ((value - min) / spread) * 76}`;
  return (
    <div>
      <div
        className="relative h-64"
        role="img"
        aria-label={`${label} line chart`}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          {[16, 35, 54, 73, 92].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeWidth=".35"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {data.length > 1 && (
            <polyline
              points={data.map((p, i) => point(p.value, i)).join(" ")}
              fill="none"
              stroke="#2F6F68"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {secondaryLabel && data.length > 1 && (
            <polyline
              points={data.map((p, i) => point(p.secondary || 0, i)).join(" ")}
              fill="none"
              stroke="#C86A3B"
              strokeDasharray="4 3"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {data.map((p, i) => {
            const [x, y] = point(p.value, i).split(",");
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="1.8"
                fill="#FFFCF5"
                stroke="#2F6F68"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex">
          {data.map((p, i) => (
            <button
              key={i}
              className="h-full flex-1 opacity-0"
              aria-label={`${p.label}: ${p.value}`}
              onFocus={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </div>
        {active !== null && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-xl bg-ink px-3 py-2 font-mono text-[10px] text-surface">
            {data[active].label}
            <br />
            {label}: {data[active].value.toLocaleString("en-IN")}
            {secondaryLabel && (
              <>
                <br />
                {secondaryLabel}:{" "}
                {(data[active].secondary || 0).toLocaleString("en-IN")}
              </>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-4 font-mono text-[9px] uppercase tracking-wider">
        <span className="text-teal">— {label}</span>
        {secondaryLabel && (
          <span className="text-warning">-- {secondaryLabel}</span>
        )}
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer font-semibold text-muted-ink">
          Exact values
        </summary>
        <table className="mt-3 w-full text-left font-mono">
          <thead>
            <tr>
              <th>Date</th>
              <th>{label}</th>
              {secondaryLabel && <th>{secondaryLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-2">{p.label}</td>
                <td>{p.value}</td>
                {secondaryLabel && <td>{p.secondary}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

export const DonutChart = ({
  data,
}: {
  data: { label: string; value: number }[];
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  const colors = ["#2F6F68", "#C86A3B", "#6E7653", "#A94442", "#5F6966"];
  return (
    <div className="grid items-center gap-7 sm:grid-cols-[12rem_1fr]">
      <svg
        viewBox="0 0 42 42"
        className="mx-auto h-48 w-48 -rotate-90"
        role="img"
        aria-label="Merchant category distribution"
      >
        <circle
          cx="21"
          cy="21"
          r="15.9"
          fill="none"
          stroke="#E6F0EF"
          strokeWidth="7"
        />
        {data.map((item, i) => {
          const pct = (item.value / total) * 100;
          const el = (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="7"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={-offset}
            />
          );
          offset += pct;
          return el;
        })}
      </svg>
      <div className="grid gap-3">
        {data.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="flex items-center gap-2">
              <i
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: colors[i % colors.length] }}
              />
              {item.label.split("_").join(" ")}
            </span>
            <strong className="metric">{money(item.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BarChart = ({
  data,
}: {
  data: { label: string; value: number }[];
}) => {
  const max = Math.max(...data.map((x) => x.value), 1);
  return (
    <div className="grid gap-4" role="img" aria-label="Outcome counts">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex justify-between text-xs">
            <span>{item.label.split("_").join(" ")}</span>
            <strong className="font-mono">{item.value}</strong>
          </div>
          <div className="h-2 rounded-full bg-canvas">
            <div
              className="h-2 rounded-full bg-teal"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
