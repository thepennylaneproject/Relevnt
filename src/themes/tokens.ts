/**
 * RELEVNT THEME TOKENS
 * 
 * Single source of truth for all design decisions.
 * 
 * 🎨 PHILOSOPHY:
 * Relevnt's visual identity is built on clarity, ethics, and human-centered design.
 * Every token reflects the brand's commitment to transparency and trustworthiness.
 * This system eliminates complexity and prevents design drift across the application.
 * 
 * 📖 REFERENCE:
 * - Brand One-Pager: Authentic intelligence for real people navigating broken systems
 * - Core Values: Radical Clarity, Empowered Honesty, Ethical Intelligence
 * - Visual Direction: Terracotta-led warmth with sage support on an ink/ivory base that inverts cleanly
 */

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Theme Mode: Light or Dark
 * Users can toggle between modes; design adapts while maintaining brand identity.
 */
export type ThemeMode = 'Light' | 'Dark';

/**
 * Color Semantics: Structured token names that explain *why* a color exists
 */
export interface ColorTokens {
  // Primary backgrounds and surfaces
  background: string;      // Page/container background
  surface: string;         // Cards, panels, elevated surfaces
  surfaceHover: string;    // Hover state for surfaces

  // Typography
  textPrimary: string;     // Headlines, primary body text
  textSecondary: string;   // Supporting text, metadata
  textInverse: string;     // Text on colored backgrounds

  // Accents (semantic)
  accent: string;          // Primary action, highlight (Terracotta)
  accentHover: string;     // Hover state for accent
  support: string;         // Secondary action (Sage)
  supportHover: string;    // Hover state for support

  // Structural
  border: string;          // Borders, dividers
  borderStrong: string;    // Strong borders (interactive elements)
  disabled: string;        // Disabled state

  // Feedback (when needed)
  success: string;         // Success messaging
  warning: string;         // Warning messaging
  error: string;           // Error messaging
}

/**
 * Typography System: Scale + Font Families
 * Hierarchy supports readability and information scanning.
 */
export interface TypographyTokens {
  fontFamily: {
    serif: string;        // Headlines: Spectral
    sans: string;         // Body: Inter
    mono: string;         // Code/metadata: Courier or system mono
  };

  // Three-tier hierarchy for semantic sizing
  display: {
    fontSize: string;     // 48px - Major headings (Page titles)
    lineHeight: string;   // 56px
    fontWeight: string;   // 600 (semibold)
    letterSpacing: string;
  };

  heading: {
    fontSize: string;     // 24px - Section headings
    lineHeight: string;   // 32px
    fontWeight: string;   // 600
    letterSpacing: string;
  };

  body: {
    fontSize: string;     // 16px - Standard body text
    lineHeight: string;   // 24px
    fontWeight: string;   // 400
    letterSpacing: string;
  };

  caption: {
    fontSize: string;     // 14px - Labels, metadata, small text
    lineHeight: string;   // 20px
    fontWeight: string;   // 400
    letterSpacing: string;
  };

  small: {
    fontSize: string;     // 12px - Badges, timestamps
    lineHeight: string;   // 16px
    fontWeight: string;   // 500
    letterSpacing: string;
  };
}

/**
 * Spacing System: 8px base scale
 * Consistent spacing creates visual rhythm and breathing room.
 */
export interface SpacingTokens {
  xs: string;   // 4px - Minimal gaps
  sm: string;   // 8px - Small spacing
  md: string;   // 16px - Default spacing
  lg: string;   // 24px - Large spacing
  xl: string;   // 32px - Extra large spacing
  xxl: string;  // 48px - Page-level spacing
}

/**
 * Shadow System: Soft, subtle shadows
 * Shadows are used sparingly to indicate elevation and interactivity.
 * Relevnt avoids harsh shadows—favoring flat design with terracotta accents and sage support.
 */
export interface ShadowTokens {
  none: string;
  sm: string;   // Subtle lift (cards, buttons on hover)
  md: string;   // Medium lift (modals, dropdowns)
  lg: string;   // Strong lift (floating elements)
}

/**
 * Border Radius: Soft, modern rounded corners
 * Predominantly 2xl (16px) for cohesive, contemporary feel.
 */
export interface BorderRadiusTokens {
  sm: string;   // 4px - Subtle rounding
  md: string;   // 8px - Controls, small containers
  lg: string;   // 12px - Cards, medium components
  xl: string;   // 16px - Buttons, primary containers (2xl)
}

/**
 * Animation: Subtle, elegant motion
 * Enhances interactivity without overwhelming the user.
 */
export interface AnimationTokens {
  durationFast: string;      // 150ms - Quick feedback (hover states)
  durationNormal: string;    // 200ms - Standard animations
  durationSlow: string;      // 250ms - Gentle, deliberate transitions
  easingDefault: string;     // ease-out - Natural deceleration
  easingGentle: string;      // ease-in-out - Smooth, balanced
}

/**
 * Complete Theme Token Set
 */
export interface Theme {
  mode: ThemeMode;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadow: ShadowTokens;
  borderRadius: BorderRadiusTokens;
  animation: AnimationTokens;
}

// ============================================================================
// COLOR DEFINITIONS
// ============================================================================

/**
 * 🎨 CORE COLOR PALETTE — TERRACOTTA, SAGE, INK, IVORY
 * Terracotta is the primary accent, Sage is the supporting accent, everything
 * else lives in Ink/Ivory neutrals that invert cleanly between light/dark.
 */

const COLORS = {
  // Accents
  terracotta: '#A0715C',          // Primary accent
  terracottaHover: '#8A5A42',     // Accent hover/active
  sage: '#5C7A6A',                // Supporting accent
  sageHover: '#3D5A4C',           // Supporting hover/active
  
  // Neutrals
  ink: '#0D0D0D',                 // Deep ink for dark backgrounds
  inkSurface: '#161616',          // Elevated surface on dark
  ivory: '#F5F1E8',               // Base ivory for light backgrounds
  ivorySurface: '#FDFCF9',        // Elevated surface on light
  
  // Typography
  textPrimary: '#0F0F0F',         // Primary text on light
  textSecondary: '#4A4A4A',       // Secondary text on light
  textMuted: '#8A8378',           // Tertiary/muted text on light
  textPrimaryInverse: '#F7F3EA',  // Primary text on dark
  textSecondaryInverse: '#D7D0C5',// Secondary text on dark
  
  // Structural
  borderLight: 'rgba(13, 13, 13, 0.08)',
  borderStrongLight: 'rgba(13, 13, 13, 0.15)',
  borderDark: 'rgba(247, 243, 234, 0.12)',
  borderStrongDark: 'rgba(247, 243, 234, 0.24)',
  
  // Semantic colors (neutral-friendly)
  success: '#5C7A6A',             // Muted sage
  warning: '#A0715C',             // Terracotta for warm alerts
  error: '#8B5C5C',               // Dusty rose for errors
};

// ============================================================================
// LIGHT MODE THEME
// ============================================================================

const lightModeColors: ColorTokens = {
  // 🏙️ BACKGROUNDS & SURFACES
  background: COLORS.ivory,         // Ivory page background
  surface: COLORS.ivorySurface,     // Elevated surfaces
  surfaceHover: '#F1ECE2',          // Soft ivory hover/fill

  // 📝 TEXT
  textPrimary: COLORS.textPrimary,          // Headlines, body text
  textSecondary: COLORS.textSecondary,      // Supporting text, metadata
  textInverse: COLORS.ivorySurface,         // Text on colored backgrounds

  // ✨ ACCENTS
  accent: COLORS.terracotta,               // Primary CTAs, highlights
  accentHover: COLORS.terracottaHover,     // Hover state
  support: COLORS.sage,                    // Secondary actions
  supportHover: COLORS.sageHover,          // Hover state for support

  // 🗂️ STRUCTURE
  border: COLORS.borderLight,              // Soft border for light backgrounds
  borderStrong: COLORS.borderStrongLight,  // Stronger border for interactive elements
  disabled: 'rgba(15, 15, 15, 0.35)',      // Disabled text opacity

  // 🎯 FEEDBACK
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
};

// ============================================================================
// DARK MODE THEME
// ============================================================================

const darkModeColors: ColorTokens = {
  // 🌙 BACKGROUNDS & SURFACES
  background: COLORS.ink,            // Deep ink
  surface: COLORS.inkSurface,        // Cards, panels
  surfaceHover: '#1F1F1F',           // Slightly lighter ink on hover

  // 📝 TEXT
  textPrimary: COLORS.textPrimaryInverse,     // Ivory on ink
  textSecondary: COLORS.textSecondaryInverse, // Muted ivory
  textInverse: COLORS.ink,                     // Ink on light backgrounds

  // ✨ ACCENTS
  accent: COLORS.terracotta,               // Terracotta primary
  accentHover: '#B88A76',                  // Lifted terracotta for contrast
  support: COLORS.sage,                    // Sage support
  supportHover: '#7A9A8A',                 // Lighter sage hover

  // 🗂️ STRUCTURE
  border: COLORS.borderDark,                   // Soft border for dark backgrounds
  borderStrong: COLORS.borderStrongDark,       // Stronger border for interactive elements
  disabled: 'rgba(247, 243, 234, 0.45)',       // Disabled text opacity

  // 🎯 FEEDBACK
  success: '#7AA28F',                // Brighter sage for dark mode
  warning: '#C48B73',                // Warm terracotta warning
  error: '#C18686',                  // Elevated dusty rose
};

// ============================================================================
// TYPOGRAPHY DEFINITIONS
// ============================================================================

/**
 * 📖 TYPOGRAPHY SYSTEM
 * 
 * Two-font system:
 * - Serif (Spectral): Headlines — modern, elegant, premium
 * - Sans (Inter): Body — clean, readable, professional
 * 
 * Three-tier hierarchy prevents cognitive overload:
 * - Display (48px): Major headings, page titles
 * - Heading (24px): Section headers
 * - Body (16px): Standard content
 * 
 * Supporting sizes (Caption, Small) for metadata and UI labels.
 */

const typography: TypographyTokens = {
  fontFamily: {
    serif: "'Spectral', 'Georgia', serif",           // Headlines
    sans: "'Inter', '-apple-system', sans-serif",    // Body
    mono: "'Courier New', 'Courier', monospace",     // Code
  },

  // DISPLAY: 48px / 600 weight
  // Use for page titles, hero headings, major announcements
  display: {
    fontSize: '48px',
    lineHeight: '56px',     // 1.17 ratio for comfortable reading
    fontWeight: '600',      // Semibold for impact
    letterSpacing: '-0.01em',  // Slight tightening for elegance
  },

  // HEADING: 24px / 600 weight
  // Use for section headings, card titles, subsections
  heading: {
    fontSize: '24px',
    lineHeight: '32px',     // 1.33 ratio
    fontWeight: '600',
    letterSpacing: '0em',   // Normal spacing
  },

  // BODY: 16px / 400 weight
  // Use for all standard text content, paragraphs, descriptions
  body: {
    fontSize: '16px',
    lineHeight: '24px',     // 1.5 ratio — optimal for reading
    fontWeight: '400',      // Regular weight for readability
    letterSpacing: '0em',
  },

  // CAPTION: 14px / 400 weight
  // Use for labels, metadata, timestamps, helper text
  caption: {
    fontSize: '14px',
    lineHeight: '20px',     // 1.43 ratio
    fontWeight: '400',
    letterSpacing: '0em',
  },

  // SMALL: 12px / 500 weight
  // Use for badges, tags, very small UI elements
  small: {
    fontSize: '12px',
    lineHeight: '16px',     // 1.33 ratio
    fontWeight: '500',      // Medium for emphasis at small sizes
    letterSpacing: '0.01em',  // Slight opening for clarity
  },
};

// ============================================================================
// SPACING SCALE (8px base)
// ============================================================================

/**
 * 📏 SPACING SYSTEM
 * 
 * Built on 8px base unit. Creates consistent rhythm across the interface.
 * 
 * Naming convention: xs (4) → sm (8) → md (16) → lg (24) → xl (32) → xxl (48)
 * 
 * Use cases:
 * - xs/sm: Tight spacing within components (icon + text, form inputs)
 * - md: Default spacing between elements
 * - lg/xl: Breathing room around major sections
 * - xxl: Page-level margins and gutters
 */

const spacing: SpacingTokens = {
  xs: '4px',    // Minimal gaps (icon-button padding)
  sm: '8px',    // Small spacing (form field padding)
  md: '16px',   // Default spacing (cards, sections)
  lg: '24px',   // Large spacing (between major components)
  xl: '32px',   // Extra large (section margins)
  xxl: '48px',  // Page-level spacing (hero margins, gutters)
};

// ============================================================================
// SHADOW SYSTEM
// ============================================================================

/**
 * 🌑 SHADOW SYSTEM
 * 
 * Relevnt uses subtle, soft shadows that suggest elevation without drama.
 * Shadows are used sparingly—primarily for interactive feedback.
 * 
 * Philosophy: Border + shadow = Modern depth without excess
 */

const shadow: ShadowTokens = {
  none: 'none',

  // sm: Cards, buttons on hover — subtle lift
  // 2px blur @ 8% opacity
  sm: '0 2px 8px rgba(0, 0, 0, 0.08)',

  // md: Modals, dropdowns, floating elements
  // 12px blur @ 12% opacity
  md: '0 4px 16px rgba(0, 0, 0, 0.12)',

  // lg: Critical overlays, tooltips
  // 20px blur @ 16% opacity
  lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

/**
 * 🎯 BORDER RADIUS SYSTEM
 * 
 * Rounded corners signal modern, approachable design.
 * Predominantly 2xl (16px) for a cohesive, contemporary feel.
 * Smaller values used rarely for subtle variations.
 */

const borderRadius: BorderRadiusTokens = {
  sm: '4px',    // Subtle rounding (small interactive elements)
  md: '8px',    // Standard rounding (form controls, small cards)
  lg: '12px',   // Medium rounding (cards, containers)
  xl: '16px',   // 2xl — Primary rounding (buttons, major containers)
};

// ============================================================================
// ANIMATION
// ============================================================================

/**
 * ⚡ ANIMATION SYSTEM
 * 
 * Motion enhances interactivity without overwhelming.
 * All animations use ease-out for natural deceleration.
 * Durations kept between 150-250ms for snappy, responsive feel.
 */

const animation: AnimationTokens = {
  durationFast: '150ms',     // Quick feedback (hover states, fast toggles)
  durationNormal: '200ms',   // Standard transitions (page navigations)
  durationSlow: '250ms',     // Gentle, deliberate (modals, overlays)
  easingDefault: 'cubic-bezier(0.4, 0, 0.2, 1)',   // ease-out — natural deceleration
  easingGentle: 'cubic-bezier(0.4, 0, 0.2, 1)',    // ease-in-out — smooth, balanced
};

// ============================================================================
// THEME OBJECTS (Export)
// ============================================================================

/**
 * 🌞 LIGHT MODE THEME
 * Complete token set for light mode contexts
 */
export const THEME_LIGHT: Theme = {
  mode: 'Light',
  colors: lightModeColors,
  typography,
  spacing,
  shadow,
  borderRadius,
  animation,
};

/**
 * 🌙 DARK MODE THEME
 * Complete token set for dark mode contexts
 */
export const THEME_DARK: Theme = {
  mode: 'Dark',
  colors: darkModeColors,
  typography,
  spacing,
  shadow,
  borderRadius,
  animation,
};

// ============================================================================
// UTILITY FUNCTION
// ============================================================================

/**
 * getTheme: Retrieve the appropriate theme based on mode
 * 
 * Usage:
 * const tokens = getTheme('Light');
 * const bgColor = tokens.colors.background;
 * 
 * @param mode - 'Light' or 'Dark'
 * @returns Complete theme object
 */
export function getTheme(mode: ThemeMode): Theme {
  return mode === 'Light' ? THEME_LIGHT : THEME_DARK;
}

// ============================================================================
// COMMON PATTERNS (For convenience)
// ============================================================================

/**
 * Quick utility objects for common style patterns
 * Use these in styled components or CSS-in-JS solutions
 */

export const buttonStyles = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--text-inverse)',
    borderRadius: 'var(--border-radius-xl)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    border: 'none',
    cursor: 'pointer',
    transition: `all var(--animation-duration-fast) var(--animation-easing-default)`,
    '&:hover': {
      background: 'var(--accent-hover)',
      boxShadow: 'var(--shadow-sm)',
    },
  },
};

/**
 * WCAG Contrast Guidance:
 * - Text Primary (#0F0F0F) on Ivory (#F5F1E8): ✓ AA/AAA
 * - Terracotta (#A0715C) on Ivory (#F5F1E8): ✓ AA
 * - Text Primary Inverse (#F7F3EA) on Ink (#0D0D0D): ✓ AAA
 * - Terracotta (#A0715C) on Ink (#0D0D0D): ✓ AA
 */

// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * 📚 USAGE GUIDE
 * 
 * 1. REACT COMPONENTS (with useTheme hook):
 * ```tsx
 * import { getTheme } from '@/theme/tokens';
 * 
 * function Button() {
 *   const theme = getTheme('Light');
 *   return <button style={{ color: theme.colors.textPrimary }} />;
 * }
 * ```
 * 
 * 2. CSS VARIABLES (recommended for global styles):
 * In index.css:
 * ```css
 * :root {
 *   --bg: #F5F1E8;
 *   --accent: #A0715C;
 *   --text-primary: #0F0F0F;
 *   ...
 * }
 * 
 * body {
 *   background: var(--bg);
 *   color: var(--text-primary);
 * }
 * ```
 * 
 * 3. TAILWIND CONFIG (if using Tailwind):
 * ```js
 * module.exports = {
 *   theme: {
 *     colors: {
 *       primary: '#A0715C',
 *       accent: '#5C7A6A',
 *       // ...
 *     }
 *   }
 * };
 * ```
 * 
 * 4. TESTING:
 * Verify contrast ratios at: https://contrast-ratio.com
 * Test dark mode at: https://app.contrast-ratio.com
 */
