import React from 'react';

/**
 * TrueWrist brand identity — a single source of truth for the logo so every
 * surface (header, footer, admin & seller sidebars) stays in sync.
 *
 * Uses the official TrueWrist wordmark image (trimmed + transparent background)
 * so it reads cleanly on both the cream and the dark navy surfaces. A gold
 * tagline ties it back into the house palette.
 */

const GOLD = '#1C9FD9';

/** Transparent-bg wordmark, safe on any surface. */
const LOGO_SRC = '/brand/truewrist-logo-alpha.png';

interface BrandLogoProps {
  /** Surface the logo sits on. Kept for callsite clarity / future theming. */
  surface?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  /** Sub-label under the wordmark. Pass null to hide it. */
  tagline?: string | null;
  className?: string;
}

const SIZES = {
  sm: { img: 'h-7', tag: 'text-[8px]', gap: 'gap-2' },
  md: { img: 'h-8', tag: 'text-[9px]', gap: 'gap-2.5' },
  lg: { img: 'h-11', tag: 'text-[10px]', gap: 'gap-3' },
} as const;

export default function BrandLogo({
  surface = 'light',
  size = 'md',
  tagline = 'AR Watch Studio',
  className = '',
}: BrandLogoProps) {
  const s = SIZES[size];

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <img
        src={LOGO_SRC}
        alt="TrueWrist"
        className={`${s.img} w-auto object-contain select-none`}
        draggable={false}
      />
      {tagline && (
        <span
          className={`mt-1 ${s.tag} uppercase tracking-[0.25em] font-bold`}
          style={{ color: GOLD }}
        >
          {tagline}
        </span>
      )}
    </span>
  );
}
