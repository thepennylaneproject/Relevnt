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

// Brand Colors (from your design system)
const BRAND_COLORS = {
  deepBlack: '#0B0B0B',
  softChampagne: '#E7DCC8',
  warmNeutral: '#F3F1ED',
  accentGold: '#CDAA70',
  supportTeal: '#009B9B',
} as const

// Light Mode Palette
const LIGHT_COLORS: ThemeColors = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8F7F5',
  surfaceHover: '#F0EEEA',

  // Text
  text: BRAND_COLORS.deepBlack,
  textSecondary: '#4A4A4A',
  mutedText: '#999999',

  // Borders
  border: '#D9D6D1',
  borderLight: '#E9E6E1',

  // Interactive
  primary: BRAND_COLORS.accentGold,
  primaryHover: '#B89558',
  secondary: BRAND_COLORS.supportTeal,
  secondaryHover: '#007B7B',

  // Feedback
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: BRAND_COLORS.supportTeal,

  // Special
  overlay: 'rgba(11, 11, 11, 0.5)',
  focus: 'rgba(205, 170, 112, 0.2)',
}

// Dark Mode Palette
// Dark mode removed (light mode only)

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
  // Initialize from localStorage or prop
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return initialMode;
    const stored = localStorage.getItem('relevnt-theme-mode');
    if (stored === 'Light' || stored === 'Dark' || stored === 'DarkAcademia') return stored as ThemeMode;
    // Check system preference if no stored value
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'Dark';
    return initialMode;
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
  const colors = useMemo(() => LIGHT_COLORS, []);

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
 * return <div style={{ background: isDark ? '#000' : '#fff' }} />
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
