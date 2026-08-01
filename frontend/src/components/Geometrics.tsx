import React from 'react';

/** Decorative SVG ornaments — always presentational. Inherit color via currentColor. */

interface SvgProps {
  className?: string;
}

/** Concentric orbit rings with a gap — the atomic / credit-dial motif. */
export const Orbit: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false" className={className}>
    <circle cx="60" cy="60" r="56" stroke="currentColor" strokeOpacity="0.9" />
    <circle cx="60" cy="60" r="44" stroke="currentColor" strokeOpacity="0.55" />
    <circle cx="60" cy="60" r="30" stroke="currentColor" strokeOpacity="0.3" />
    <path d="M4 60h14" stroke="currentColor" strokeOpacity="0.55" />
    <path d="M102 60h14" stroke="currentColor" strokeOpacity="0.55" />
  </svg>
);

/** 12 radiating rays clipped to a disc — Saul Bass sunburst. */
export const Sunburst: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className={className}>
    <g fill="currentColor">
      {Array.from({ length: 12 }).map((_, i) => (
        <path
          key={i}
          transform={`rotate(${i * 30} 60 60)`}
          d="M60 6v26"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      ))}
    </g>
  </svg>
);

/** Solid semicircular disc with a straight base — used as a composition anchor. */
export const HalfDisc: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 120 60" aria-hidden="true" focusable="false" className={className}>
    <path d="M0 60a60 60 0 0 1 120 0Z" fill="currentColor" />
  </svg>
);

/** Diagonal-stripe band — a crisp print divider. */
export const StripeBand: React.FC<SvgProps> = ({ className }) => (
  <svg viewBox="0 0 240 12" preserveAspectRatio="none" aria-hidden="true" focusable="false" className={className}>
    <defs>
      <pattern id="tl-stripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="12" fill="currentColor" />
      </pattern>
    </defs>
    <rect width="240" height="12" fill="url(#tl-stripes)" />
  </svg>
);
