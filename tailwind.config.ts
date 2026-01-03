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
         COLORS — Mapped to minimal 18-token system
         ───────────────────────────────────────────────────────────────────── */
      colors: {
        // Core surfaces (3 tokens)
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        
        // Text (2 tokens)
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
        },
        
        // Border (1 token)
        border: 'var(--border)',
        
        // Accent (3 tokens)
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          glow: 'var(--accent-glow)',
        },
        
        // Semantic (3 tokens)
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        
        // Raw champagne gold for cases where CSS vars don't work
        champagne: {
          DEFAULT: '#C7A56A',
          hover: '#B8965B',
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
         BORDER RADIUS — Editorial: sharp corners, minimal rounding
         ───────────────────────────────────────────────────────────────────── */
      borderRadius: {
        'none': '0',
        'sm': '4px',      // 4px MAXIMUM — editorial restraint
        // REMOVED: md, lg, xl, 2xl — too friendly, not editorial
      },
      
      /* ─────────────────────────────────────────────────────────────────────
         BOX SHADOW — Minimal, barely perceptible
         ───────────────────────────────────────────────────────────────────── */
      boxShadow: {
        'none': 'none',
        'sm': 'var(--shadow)',  // Minimal shadow — 1px 3px barely visible
        // REMOVED: md, lg, glow variants — decorative, not structural
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
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      
      keyframes: {
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
