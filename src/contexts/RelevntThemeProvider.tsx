/**
 * 🎨 RELEVNT THEME PROVIDER
 * 
 * Simplified theme system providing Light/Dark mode with centralized color tokens.
 * Wraps your app and provides theme functionality to all child components.
 * 
 * 📚 LEARNING NOTE: This uses React Context to "broadcast" theme data to all
 * child components without prop drilling. Any component can access theme via
 * the useRelevntTheme() hook.
 */

import { createContext, useContext, useMemo, useCallback, useEffect, useState, ReactNode } from 'react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ThemeMode = 'Light' | 'Dark' | 'DarkAcademia'

interface ThemeColors {
  // Backgrounds
  background: string
  surface: string
  surfaceHover: string

  // Text
  text: string
  textSecondary: string
  mutedText: string

  // Borders & Dividers
  border: string
  borderLight: string

  // Interactive
  primary: string
  primaryHover: string
  secondary: string
  secondaryHover: string

  // Feedback
  success: string
  warning: string
  error: string
  info: string

  // Special
  overlay: string
  focus: string
}

interface RelevntThemeContextValue {
  // Mode
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void

  // Colors
  colors: ThemeColors

  // Utilities
  isDark: boolean
}

interface RelevntThemeProviderProps {
  children: ReactNode
  initialMode?: ThemeMode
}

// ============================================================================
// COLOR TOKENS
// ============================================================================

/**
 * 📚 LEARNING NOTE: These are your "design tokens" - the single source of truth
 * for all colors in your app. If you need to change a color, change it here
 * and it updates everywhere automatically.
 */

// Canonical Editorial Tokens
const BRAND_COLORS = {
  deepBlack: '#0D0D0D',   // Deepest ink
  softIvory: '#F5F1E8',   // Paper background
  surfaceIvory: '#FDFCF9', // Document surface
  champagne: '#C7A56A',   // Sacred accent
  champagneHover: '#B8965B',
  graphite: '#4A4A4A',    // Secondary text
  ink: '#1A1A1A',         // Primary text
} as const

// Light Mode Palette
const LIGHT_COLORS: ThemeColors = {
  // Backgrounds
  background: BRAND_COLORS.softIvory,
  surface: BRAND_COLORS.surfaceIvory,
  surfaceHover: '#F1ECE2',

  // Text
  text: BRAND_COLORS.ink,
  textSecondary: BRAND_COLORS.graphite,
  mutedText: '#8A8378',

  // Borders
  border: 'rgba(26, 26, 26, 0.08)',
  borderLight: 'rgba(26, 26, 26, 0.15)',

  // Interactive
  primary: BRAND_COLORS.champagne,
  primaryHover: BRAND_COLORS.champagneHover,
  secondary: BRAND_COLORS.graphite,
  secondaryHover: BRAND_COLORS.ink,

  // Feedback
  success: '#8A9B8E', // Muted sage
  warning: '#C5A059', // Gold-ish
  error: '#A05C5C',   // Muted clay
  info: BRAND_COLORS.graphite,

  // Special
  overlay: 'rgba(13, 13, 13, 0.5)',
  focus: 'rgba(199, 165, 106, 0.25)',
}

// Dark Mode Palette
const DARK_COLORS: ThemeColors = {
  // Backgrounds
  background: BRAND_COLORS.deepBlack,
  surface: '#161616',
  surfaceHover: '#1F1F1F',

  // Text
  text: '#F7F3EA',
  textSecondary: '#D7D0C5',
  mutedText: '#B8B0A2',

  // Borders
  border: 'rgba(247, 243, 234, 0.12)',
  borderLight: 'rgba(247, 243, 234, 0.24)',

  // Interactive
  primary: BRAND_COLORS.champagne,
  primaryHover: '#B8965B',
  secondary: '#D7D0C5',
  secondaryHover: '#F7F3EA',

  // Feedback
  success: '#7AA28F',
  warning: '#C48B73',
  error: '#C18686',
  info: '#B8B0A2',

  // Special
  overlay: 'rgba(13, 13, 13, 0.65)',
  focus: 'rgba(199, 165, 106, 0.3)',
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * 📚 LEARNING NOTE: createContext creates a Context object. Providers and consumers
 * must be the same Context type to work together.
 */
const RelevntThemeContext = createContext<RelevntThemeContextValue | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function RelevntThemeProvider({
  children,
  initialMode = 'Light',
}: RelevntThemeProviderProps) {
  // Initialize from localStorage or prop (defaults to Light)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return initialMode;

    // Migration: Clear old system theme key if it exists to prevent conflicts
    localStorage.removeItem('relevnt-theme');

    const stored = localStorage.getItem('relevnt-theme-mode');
    // If they have an explicit preference that is valid, use it
    if (stored === 'Dark' || stored === 'Light' || stored === 'DarkAcademia') return stored as ThemeMode;

    // Default to Light mode to show the Terracotta/Sage on Ink/Ivory design system
    return 'Light';
  });

  // Apply theme class to document when mode changes
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'dark-academia');

    if (mode === 'Dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (mode === 'DarkAcademia') {
      root.classList.add('dark-academia');
      root.setAttribute('data-theme', 'dark-academia');
    } else {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }

    // Persist to localStorage
    try {
      localStorage.setItem('relevnt-theme-mode', mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev: ThemeMode) => {
      // Cycle: Light → Dark → DarkAcademia → Light
      if (prev === 'Light') return 'Dark';
      if (prev === 'Dark') return 'DarkAcademia';
      return 'Light';
    });
  }, []);

  // Colors come from CSS variables now, so we provide computed defaults
  const colors = useMemo(() => (mode === 'Dark' || mode === 'DarkAcademia' ? DARK_COLORS : LIGHT_COLORS), [mode]);

  // ========================================================================
  // CREATE CONTEXT VALUE
  // ========================================================================

  const value: RelevntThemeContextValue = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
      colors,
      isDark: mode === 'Dark' || mode === 'DarkAcademia',
    }),
    [mode, setMode, toggleMode, colors]
  );

  // ========================================================================
  // RENDER PROVIDER
  // ========================================================================

  return (
    <RelevntThemeContext.Provider value={value}>
      {children}
    </RelevntThemeContext.Provider>
  );
}

// ============================================================================
// THEME HOOKS
// ============================================================================

/**
 * 📚 MAIN HOOK: Use this in any component to access theme
 * 
 * Example:
 * ```tsx
 * const { colors, mode, toggleMode } = useRelevntTheme()
 * return <div style={{ color: colors.text }}>Hello</div>
 * ```
 */
export function useRelevntTheme(): RelevntThemeContextValue {
  const context = useContext(RelevntThemeContext)

  if (!context) {
    throw new Error(
      '❌ useRelevntTheme() must be used inside <RelevntThemeProvider>. ' +
      'Make sure RelevntThemeProvider wraps your app in main.tsx or App.tsx'
    )
  }

  return context
}

/**
 * Convenience hook - quickly check if dark mode is active
 * 
 * Example:
 * ```tsx
 * const isDark = useIsDarkMode()
 * return <div style={{ background: isDark ? 'var(--color-bg)' : 'var(--color-surface)' }} />
 * ```
 */
export function useIsDarkMode(): boolean {
  const { isDark } = useRelevntTheme()
  return isDark
}

/**
 * Convenience hook - get colors directly
 * 
 * Example:
 * ```tsx
 * const colors = useThemeColors()
 * return <div style={{ color: colors.text }}>Hello</div>
 * ```
 */
export function useThemeColors(): ThemeColors {
  const { colors } = useRelevntTheme()
  return colors
}

/**
 * Convenience hook - toggle dark/light mode
 * 
 * Example:
 * ```tsx
 * const toggleTheme = useToggleTheme()
 * return <button onClick={toggleTheme}>Toggle Dark Mode</button>
 * ```
 */
export function useToggleTheme(): () => void {
  const { toggleMode } = useRelevntTheme()
  return toggleMode
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type { ThemeMode, ThemeColors, RelevntThemeContextValue, RelevntThemeProviderProps }
