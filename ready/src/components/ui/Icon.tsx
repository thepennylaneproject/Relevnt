/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT ICON COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A single component that renders all Relevnt icons at any size.
 * Icons use currentColor for strokes, making them theme-aware.
 * The gold accent dot is rendered separately and never changes.
 * 
 * Usage:
 *   <Icon name="compass" />
 *   <Icon name="briefcase" size="lg" />
 *   <Icon name="seeds" size="hero" className="text-graphite-light" />
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type IconName =
  // Navigation
  | 'compass'
  | 'briefcase'
  | 'paper-airplane'
  | 'scroll'
  | 'book'
  | 'microphone'
  | 'pocket-watch'
  | 'gauge'
  // States
  | 'seeds'
  | 'candle'
  | 'flower'
  | 'compass-cracked'
  // Accents
  | 'key'
  | 'stars'
  | 'check'
  | 'search'
  | 'alert-triangle'
  | 'plus'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-right'
  | 'user'
  | 'dollar'
  | 'mailbox'
  | 'zap'
  | 'bookmark'
  | 'x'
  | 'map-pin'
  | 'wand'
  | 'list'
  | 'lighthouse';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  /** Hide the gold accent dot */
  hideAccent?: boolean;
  /** Accessible label */
  label?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIZE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const sizeMap: Record<IconSize, { width: number; strokeWidth: number; dotSize: number }> = {
  sm: { width: 20, strokeWidth: 1.5, dotSize: 2 },
  md: { width: 24, strokeWidth: 1.5, dotSize: 3 },
  lg: { width: 32, strokeWidth: 1.5, dotSize: 4 },
  xl: { width: 48, strokeWidth: 1.25, dotSize: 5 },
  hero: { width: 120, strokeWidth: 1, dotSize: 8 },
};

// ═══════════════════════════════════════════════════════════════════════════
// ICON PATHS
// Strokes only, no fills. viewBox is always 0 0 64 64.
// Gold dot position is specified per icon.
// ═══════════════════════════════════════════════════════════════════════════

interface IconDefinition {
  paths: string[];
  dotPosition?: { cx: number; cy: number };
}

const iconDefinitions: Record<IconName, IconDefinition> = {
  // ─────────────────────────────────────────────────────────────────────────
  // NAVIGATION ICONS
  // ─────────────────────────────────────────────────────────────────────────

  compass: {
    paths: [
      // Outer circle
      'M32 8a24 24 0 1 0 0 48 24 24 0 0 0 0-48z',
      // Inner markings
      'M32 14v4M32 46v4M14 32h4M46 32h4',
      // Compass needle (N-S)
      'M32 20l-4 12 4 12 4-12-4-12z',
      // Direction letters
      'M32 10v2M32 52v2M10 32h2M52 32h2',
    ],
    dotPosition: { cx: 32, cy: 32 },
  },

  briefcase: {
    paths: [
      // Main body
      'M8 22h48v28a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V22z',
      // Top lid
      'M8 22a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4',
      // Handle
      'M24 18v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4',
      // Clasps
      'M20 22v4M44 22v4',
      // Center divider
      'M32 26v12',
    ],
    dotPosition: { cx: 32, cy: 36 },
  },

  'paper-airplane': {
    paths: [
      // Main body
      'M8 32l48-20-20 48-8-20-20-8z',
      // Fold line
      'M36 40l-8-8',
      // Motion lines
      'M4 28h8M4 36h6M6 32h4',
    ],
    dotPosition: { cx: 40, cy: 24 },
  },

  lighthouse: {
    paths: [
      'M32 8v4', // Top light beam
      'M28 16h8v8h-8z', // Lantern room
      'M24 24h16l-4 32h-8z', // Tower body
      'M20 56h24', // Base
    ],
    dotPosition: { cx: 32, cy: 20 },
  },

  scroll: {
    paths: [
      // Main body
      'M16 12h32a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H16',
      // Top curl
      'M16 12a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4',
      // Bottom curl
      'M16 52a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4',
      // Text lines
      'M24 24h20M24 32h16M24 40h20',
    ],
    dotPosition: { cx: 14, cy: 32 },
  },

  book: {
    paths: [
      // Left page
      'M8 12c4-2 8-2 12 0v40c-4-2-8-2-12 0V12z',
      // Right page
      'M56 12c-4-2-8-2-12 0v40c4-2 8-2 12 0V12z',
      // Spine
      'M20 12h24M20 52h24',
      // Binding
      'M32 12v40',
      // Page lines left
      'M12 22h6M12 30h6M12 38h6',
      // Page lines right
      'M46 22h6M46 30h6M46 38h6',
    ],
    dotPosition: { cx: 32, cy: 32 },
  },

  microphone: {
    paths: [
      // Capsule head
      'M24 12h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H24a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8z',
      // Grille lines
      'M20 20h24M20 28h24M20 36h24',
      // Stand
      'M32 44v12',
      // Base
      'M24 56h16',
    ],
    dotPosition: { cx: 32, cy: 28 },
  },

  'pocket-watch': {
    paths: [
      // Main circle
      'M32 16a20 20 0 1 0 0 40 20 20 0 0 0 0-40z',
      // Crown/stem
      'M32 8v8M28 10h8',
      // Clock hands
      'M32 36V24M32 36l8 4',
      // Hour markers
      'M32 20v2M44 36h-2M32 48v-2M20 36h2',
    ],
    dotPosition: { cx: 32, cy: 36 },
  },

  gauge: {
    paths: [
      // Outer rim (semi-circle)
      'M12 44a20 20 0 1 1 40 0',
      // Base line
      'M12 44h40',
      // Needle
      'M32 44l-12-16',
      // Tick marks
      'M20 28l2 2M44 28l-2 2M32 16v4',
    ],
    dotPosition: { cx: 32, cy: 44 },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STATE ICONS
  // ─────────────────────────────────────────────────────────────────────────

  seeds: {
    paths: [
      // Open palm
      'M16 40c0-8 4-16 8-20M48 40c0-8-4-16-8-20',
      // Palm curve
      'M16 40c0 8 8 12 16 12s16-4 16-12',
      // Fingers
      'M24 20c-2-4-2-8 0-10M32 18c0-4 0-8 2-10M40 20c2-4 2-8 0-10',
      // Seeds
      'M26 34a2 3 0 1 0 0-6 2 3 0 0 0 0 6',
      'M32 32a2 3 0 1 0 0-6 2 3 0 0 0 0 6',
      'M38 34a2 3 0 1 0 0-6 2 3 0 0 0 0 6',
    ],
    dotPosition: { cx: 32, cy: 30 },
  },

  candle: {
    paths: [
      // Candle body
      'M24 28h16v24H24z',
      // Drips
      'M26 28v-4a2 2 0 0 1 2-2M36 28v-6a2 2 0 0 0 2-2',
      // Wick
      'M32 28v-6',
      // Flame
      'M32 12c-4 4-4 8 0 10 4-2 4-6 0-10z',
      // Base
      'M22 52h20',
    ],
    dotPosition: { cx: 32, cy: 16 },
  },

  flower: {
    paths: [
      // Petals
      'M32 16c-4 0-8 4-8 8s4 8 8 8',
      'M32 16c4 0 8 4 8 8s-4 8-8 8',
      'M24 24c0-4 4-8 8-8',
      'M40 24c0-4-4-8-8-8',
      'M24 24c0 4 4 8 8 8',
      'M40 24c0 4-4 8-8 8',
      // Center
      'M32 24a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      // Stem
      'M32 32v20',
      // Leaf
      'M32 40c-6 0-10-4-10-4s4-2 10 0',
    ],
    dotPosition: { cx: 32, cy: 20 },
  },

  'compass-cracked': {
    paths: [
      // Outer circle
      'M32 8a24 24 0 1 0 0 48 24 24 0 0 0 0-48z',
      // Crack lines
      'M24 20l4 8-2 12 8 4M44 28l-8 2-4 10',
      // Compass needle (askew)
      'M34 22l-6 10 4 14 6-10-4-14z',
      // Direction letters (misaligned)
      'M32 12v2M30 50v2M12 34h2M52 30h2',
    ],
    dotPosition: { cx: 30, cy: 34 },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACCENT ICONS
  // ─────────────────────────────────────────────────────────────────────────

  key: {
    paths: [
      // Bow (decorative top)
      'M20 8a12 12 0 1 0 0 24 12 12 0 0 0 0-24z',
      'M20 14a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
      // Shaft
      'M32 20h20',
      // Bit (teeth)
      'M44 20v8M50 20v6',
      // Collar
      'M36 18v4',
    ],
    dotPosition: { cx: 20, cy: 20 },
  },

  stars: {
    paths: [
      // Large star
      'M32 8l4 12 12 2-10 8 4 12-10-6-10 6 4-12-10-8 12-2z',
      // Small star 1
      'M12 32l2 6 6 1-5 4 2 6-5-3-5 3 2-6-5-4 6-1z',
      // Small star 2
      'M52 28l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z',
    ],
    dotPosition: { cx: 32, cy: 20 },
  },

  check: {
    paths: [
      'M14 32l12 12 24-24',
    ],
    dotPosition: { cx: 26, cy: 44 },
  },

  search: {
    paths: [
      // Magnifying glass head
      'M28 28a12 12 0 1 0 0-24 12 12 0 0 0 0 24z',
      // Handle
      'M36 36l18 18',
    ],
    dotPosition: { cx: 28, cy: 16 },
  },

  'alert-triangle': {
    paths: [
      // Triangle
      'M32 6L6 54h52L32 6z',
      // Exclamation mark
      'M32 22v16M32 46v2',
    ],
    dotPosition: { cx: 32, cy: 16 },
  },

  plus: {
    paths: [
      'M32 12v40M12 32h40',
    ],
    dotPosition: { cx: 32, cy: 32 },
  },

  'chevron-down': {
    paths: [
      'M16 24l16 16 16-16',
    ],
    dotPosition: { cx: 32, cy: 32 },
  },

  'chevron-up': {
    paths: [
      'M16 40l16-16 16 16',
    ],
    dotPosition: { cx: 32, cy: 32 },
  },

  'chevron-right': {
    paths: [
      'M24 16l16 16-16 16',
    ],
    dotPosition: { cx: 32, cy: 32 },
  },

  user: {
    paths: [
      // Head
      'M32 28a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      // Shoulders
      'M12 52c0-10 8-12 20-12s20 2 20 12',
    ],
    dotPosition: { cx: 32, cy: 18 },
  },

  dollar: {
    paths: [
      'M24 16h16a8 8 0 0 1 0 16H32a8 8 0 0 0 0 16h16', // S shape
      'M32 8v48', // Vertical line
    ],
    dotPosition: { cx: 32, cy: 32 },
  },

  mailbox: {
    paths: [
      // Post
      'M32 48v12',
      // Box
      'M16 24h32v24H16z',
      // Opening
      'M16 24a16 16 0 0 1 32 0',
      // Flag
      'M48 36l8-8',
    ],
    dotPosition: { cx: 40, cy: 28 },
  },
  zap: {
    paths: [
      'M32 8l-16 28h12l-4 20 20-28h-12l4-20z',
    ],
    dotPosition: { cx: 32, cy: 30 },
  },
  bookmark: {
    paths: [
      'M16 8h32v44l-16-12-16 12V8z',
    ],
    dotPosition: { cx: 32, cy: 24 },
  },
  x: {
    paths: [
      'M16 16l32 32M48 16L16 48',
    ],
    dotPosition: { cx: 32, cy: 32 },
  },
  'map-pin': {
    paths: [
      'M32 8c-8.8 0-16 7.2-16 16 0 12 16 32 16 32s16-20 16-32c0-8.8-7.2-16-16-16z',
      'M32 30a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
    ],
    dotPosition: { cx: 32, cy: 24 },
  },
  wand: {
    paths: [
      // Wand body
      'M12 52L44 20',
      // Wand tip sparkles
      'M48 16l4-8M52 16l8 4M56 20l-4 8M52 24l-8-4',
      // Sparkle at tip
      'M52 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      // Star sparkles
      'M28 28l-4-4M20 32l-4 0M24 40l-4 4',
    ],
    dotPosition: { cx: 52, cy: 12 },
  },
  list: {
    paths: [
      // Bullet points
      'M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      'M12 35a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      'M12 54a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      // Lines
      'M22 13h30M22 32h30M22 51h30',
    ],
    dotPosition: { cx: 37, cy: 32 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className = '',
  hideAccent = false,
  label,
}) => {
  const { width, strokeWidth, dotSize } = sizeMap[size];
  const icon = iconDefinitions[name];

  if (!icon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const { paths, dotPosition } = icon;

  return (
    <svg
      viewBox="0 0 64 64"
      width={width}
      height={width}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={!label}
    >
      {/* Illustration strokes - uses currentColor for theme awareness */}
      <g
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Gold accent dot - Theme aware (Gold in Dark Academia, Teal in Light) */}
      {!hideAccent && dotPosition && (
        <circle
          cx={dotPosition.cx}
          cy={dotPosition.cy}
          r={dotSize}
          fill="var(--color-accent)"
          className="accent-dot"
        />
      )}
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

/** Navigation icon names */
export const NAV_ICONS: IconName[] = [
  'compass',
  'briefcase',
  'paper-airplane',
  'scroll',
  'book',
  'microphone',
  'pocket-watch',
];

/** State icon names */
export const STATE_ICONS: IconName[] = [
  'seeds',
  'candle',
  'flower',
  'compass-cracked',
];

/** Accent icon names */
export const ACCENT_ICONS: IconName[] = [
  'key',
  'stars',
];

export default Icon;
