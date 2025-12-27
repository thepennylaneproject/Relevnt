/**
 * RELEVNT DESIGN SYSTEM
 *
 * Aesthetic: Luxury Correspondence / Premium Archive
 * Color Philosophy: Monochrome + Terracotta Primary Accent (Sage support)
 *
 * This design system uses a refined palette inspired by:
 * - Terracotta stationery warmth with sage as a calm complement
 * - Luxury correspondence and refined paper textures
 * - Hand-drawn botanical engravings
 * - Premium manuscript aesthetics
 */

export const designTokens = {
  // ============================================
  // COLOR PALETTE
  // ============================================
  colors: {
    // Primary: Charcoal (Ink)
    // Used for: text, icons, linework, primary elements
    ink: '#1a1a1a',

    // Secondary: Warm Ivory
    // Used for: backgrounds, cards, paper-like surfaces
    ivory: '#f5f1e8',

    // Accent: Terracotta
    // Used for: interactive elements, highlights, calls-to-action
    emerald: '#A0715C',

    // Tertiary: Muted Gray
    // Used for: secondary text, disabled states, subtle borders
    gray: '#8a8a8a',

    // Utility colors
    success: '#2d8f6f', // Emerald variant
    warning: '#d4af37', // Gold (for alerts)
    error: '#8b4513',   // Dark brown (refined error state)
  },

  // ============================================
  // DARK MODE
  // ============================================
  darkMode: {
    ink: '#f5f1e8',      // Swap: text becomes ivory
    ivory: '#1a1a1a',    // Swap: background becomes charcoal
    emerald: '#A0715C',  // Accent stays the same (terracotta)
    gray: '#a8a8a8',     // Lighter gray for dark mode
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    fontFamily: {
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
      serif: '"Crimson Text", "Georgia", serif',
      mono: '"Fira Code", "Monaco", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // ============================================
  // SPACING
  // ============================================
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },

  // ============================================
  // TEXTURES
  // ============================================
  textures: {
    paperGrain: 'url("/textures/paper-grain.svg")',
    watercolor: 'url("/textures/watercolor.svg")',
    canvasWeave: 'url("/textures/canvas-weave.svg")',
    inkSpeckle: 'url("/textures/ink-speckle.svg")',

    // Opacity levels for texture application
    opacity: {
      subtle: 0.02,      // Paper grain (everywhere)
      light: 0.03,       // Watercolor (hero sections)
      medium: 0.015,     // Canvas weave (buttons)
      accent: 0.05,      // Ink speckle (details)
    },
  },

  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    sm: '0 1px 2px rgba(26, 26, 26, 0.05)',
    md: '0 4px 6px rgba(26, 26, 26, 0.1)',
    lg: '0 10px 15px rgba(26, 26, 26, 0.1)',
    xl: '0 20px 25px rgba(26, 26, 26, 0.15)',
  },

  // ============================================
  // BORDER RADIUS
  // ============================================
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  // ============================================
  // Z-INDEX
  // ============================================
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  // ============================================
  // TRANSITIONS
  // ============================================
  transitions: {
    fast: '150ms ease-in-out',
    base: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
} as const

// CSS Variables for easy application
export const cssVariables = `
:root {
  /* Colors */
  --color-ink: ${designTokens.colors.ink};
  --color-ivory: ${designTokens.colors.ivory};
  --color-emerald: ${designTokens.colors.emerald};
  --color-gray: ${designTokens.colors.gray};

  /* Spacing */
  --space-xs: ${designTokens.spacing.xs};
  --space-sm: ${designTokens.spacing.sm};
  --space-md: ${designTokens.spacing.md};
  --space-lg: ${designTokens.spacing.lg};
  --space-xl: ${designTokens.spacing.xl};

  /* Typography */
  --font-base: ${designTokens.typography.fontFamily.base};
  --font-serif: ${designTokens.typography.fontFamily.serif};

  /* Transitions */
  --transition-fast: ${designTokens.transitions.fast};
  --transition-base: ${designTokens.transitions.base};
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-ink: ${designTokens.darkMode.ink};
    --color-ivory: ${designTokens.darkMode.ivory};
    --color-emerald: ${designTokens.darkMode.emerald};
    --color-gray: ${designTokens.darkMode.gray};
  }
}
`
