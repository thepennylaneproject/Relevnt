/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT TAILWIND CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This config extends Tailwind with Relevnt's design tokens.
 * Use these classes instead of arbitrary values to maintain consistency.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DESIGN CONSTITUTION RULE 2: ARBITRARY VALUE POLICY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * IMPORTANT: Arbitrary values (e.g., `text-[14px]`, `bg-[#fff]`) are TEMPORARY.
 *
 * Current Status:
 * - Arbitrary values are NOT disabled (would break too much existing code)
 * - They are flagged for audit and eventual removal
 * - New arbitrary values SHOULD NOT be introduced
 *
 * Guidelines:
 * 1. PREFER semantic classes: `text-sm` over `text-[14px]`
 * 2. PREFER CSS variables in arbitrary values: `text-[var(--text-sm)]`
 * 3. If you must use arbitrary values, add a comment explaining why
 * 4. See /docs/design-token-escape.md for the escape hatch policy
 *
 * Future Plans:
 * - Phase 1 (current): Document and warn - this file
 * - Phase 2: ESLint rule to warn on new arbitrary value usage
 * - Phase 3: Audit and migrate existing arbitrary values
 * - Phase 4: Consider disabling arbitrary values in specific categories
 *
 * Migration Example:
 *   BEFORE: className="text-[14px] p-[20px] bg-[#C7A56A]"
 *   AFTER:  className="text-sm p-5 bg-champagne"
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // Enable dark mode via class (allows manual toggle)
  darkMode: 'class',
  
  theme: {
    extend: {
      /* ─────────────────────────────────────────────────────────────────────
         COLORS
         Maps to CSS custom properties for runtime theme switching
         ───────────────────────────────────────────────────────────────────── */
      colors: {
        // Core surfaces
        bg: {
          DEFAULT: 'var(--color-bg)',
          alt: 'var(--color-bg-alt)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
        },
        
        // Text (ink)
        ink: {
          DEFAULT: 'var(--color-ink)',
          secondary: 'var(--color-ink-secondary)',
          tertiary: 'var(--color-ink-tertiary)',
          inverse: 'var(--color-ink-inverse)',
        },
        
        // Lines & illustrations
        graphite: {
          DEFAULT: 'var(--color-graphite)',
          light: 'var(--color-graphite-light)',
          faint: 'var(--color-graphite-faint)',
        },
        
        // The Sacred Gold
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          glow: 'var(--color-accent-glow)',
        },
        
        // Semantic
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          bg: 'var(--color-error-bg)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
        },
        
        // Raw values (for cases where CSS vars don't work)
        ivory: {
          50: '#FDFCFA',
          100: '#FAF8F5',
          200: '#F8F4ED',  // Our primary ivory
          300: '#F3EDE4',
          400: '#E8E2D7',
          500: '#D4CEC3',
        },
        charcoal: {
          900: '#11100E',  // Our dark mode bg
          800: '#1A1917',
          700: '#2A2826',
          600: '#3D3A36',
        },
        champagne: {
          DEFAULT: '#C7A56A',
          light: '#D4B57A',
          dark: '#B8956A',
        },
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         TYPOGRAPHY
         ───────────────────────────────────────────────────────────────────── */
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        // Matches CSS custom properties
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
      },
      
      lineHeight: {
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         SPACING
         ───────────────────────────────────────────────────────────────────── */
      spacing: {
        // These extend Tailwind's default scale
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         BORDER RADIUS
         ───────────────────────────────────────────────────────────────────── */
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         BOX SHADOW
         ───────────────────────────────────────────────────────────────────── */
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow': 'var(--shadow-glow)',
        'glow-lg': '0 0 40px var(--color-accent-glow)',
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         TRANSITIONS
         ───────────────────────────────────────────────────────────────────── */
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         ANIMATIONS
         ───────────────────────────────────────────────────────────────────── */
      animation: {
        'dust-float': 'dust-float 10s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      
      keyframes: {
        'dust-float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.25' },
          '50%': { transform: 'translateY(-8px) scale(1.02)', opacity: '0.35' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         Z-INDEX
         ───────────────────────────────────────────────────────────────────── */
      zIndex: {
        'dropdown': '10',
        'sticky': '20',
        'modal-backdrop': '30',
        'modal': '40',
        'toast': '50',
        'tooltip': '60',
      },
    },
  },
  
  plugins: [
    // Custom plugin for Relevnt-specific utilities
    function({ addComponents, addUtilities, theme }: any) {
      // Gold accent dot (for icons)
      addComponents({
        '.accent-dot': {
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: theme('colors.champagne.DEFAULT'),
          },
        },
      });
      
      // Gold dust overlay utility
      addUtilities({
        '.gold-dust': {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '0',
            backgroundImage: `radial-gradient(circle, ${theme('colors.champagne.DEFAULT')} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            opacity: '0.25',
            maskImage: 'radial-gradient(ellipse 50% 70% at 60% 40%, black 10%, transparent 60%)',
            animation: 'dust-float 10s ease-in-out infinite',
            pointerEvents: 'none',
          },
        },
      });
      
      // Text selection utility
      addUtilities({
        '.selection-gold': {
          '&::selection': {
            backgroundColor: 'var(--color-selection)',
          },
          '& *::selection': {
            backgroundColor: 'var(--color-selection)',
          },
        },
      });
    },
  ],
};

export default config;
