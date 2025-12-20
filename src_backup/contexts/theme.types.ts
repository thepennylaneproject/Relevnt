/**
 * 🎨 THEME TYPE DEFINITIONS
 * 
 * Central location for all theme-related types.
 * Keeps your code organized and type-safe.
 * 
 * 📚 LEARNING NOTE: TypeScript types help catch errors at compile time
 * instead of runtime, making your code more reliable.
 */

// ============================================================================
// THEME MODE
// ============================================================================

/**
 * The theme mode - Light or Dark
 */
export type ThemeMode = 'Light' | 'Dark'

// ============================================================================
// THEME COLORS
// ============================================================================

/**
 * All color tokens used throughout the application
 * These are the actual color values used in components
 */
export interface ThemeColors {
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

// ============================================================================
// THEME CONTEXT
// ============================================================================

/**
 * The value exposed by RelevntThemeContext
 * Components access theme data through this interface
 */
export interface RelevntThemeContextValue {
  // Current mode
  mode: ThemeMode
  
  // Setter functions
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  
  // Color tokens for current mode
  colors: ThemeColors
  
  // Convenience flag
  isDark: boolean
}

// ============================================================================
// PROVIDER PROPS
// ============================================================================

/**
 * Props for RelevntThemeProvider component
 */
export interface RelevntThemeProviderProps {
  children: React.ReactNode
  initialMode?: ThemeMode
}

// ============================================================================
// COMPONENT THEME PROPS
// ============================================================================

/**
 * Props that components using theme should accept
 */
export interface ThemedComponentProps {
  /**
   * Custom CSS class name
   */
  className?: string
  
  /**
   * Custom inline styles
   */
  style?: React.CSSProperties
}

// ============================================================================
// CSS CUSTOM PROPERTIES (CSS VARIABLES)
// ============================================================================

/**
 * CSS custom property names for theme colors
 * Use these in CSS-in-JS or CSS files
 * 
 * Example:
 * ```css
 * :root {
 *   --theme-background: #ffffff;
 *   --theme-text: #0b0b0b;
 * }
 * ```
 */
export const THEME_CSS_VARS = {
  background: '--theme-background',
  surface: '--theme-surface',
  surfaceHover: '--theme-surface-hover',
  
  text: '--theme-text',
  textSecondary: '--theme-text-secondary',
  mutedText: '--theme-muted-text',
  
  border: '--theme-border',
  borderLight: '--theme-border-light',
  
  primary: '--theme-primary',
  primaryHover: '--theme-primary-hover',
  secondary: '--theme-secondary',
  secondaryHover: '--theme-secondary-hover',
  
  success: '--theme-success',
  warning: '--theme-warning',
  error: '--theme-error',
  info: '--theme-info',
  
  overlay: '--theme-overlay',
  focus: '--theme-focus',
} as const

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Helper to get a CSS variable for a color
 * 
 * Example:
 * ```tsx
 * const bgVar = getCSSVar('background')
 * // Returns: 'var(--theme-background)'
 * ```
 */
export function getCSSVar(colorKey: keyof typeof THEME_CSS_VARS): string {
  return `var(${THEME_CSS_VARS[colorKey]})`
}

/**
 * Helper to check if a string is a valid theme mode
 */
export function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'Light' || value === 'Dark'
}

/**
 * Helper to get the opposite theme mode
 */
export function getOppositeMode(mode: ThemeMode): ThemeMode {
  return mode === 'Light' ? 'Dark' : 'Light'
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * LocalStorage key for persisting theme preference
 */
export const THEME_STORAGE_KEY = 'relevnt-theme-mode'

/**
 * Data attribute name for theme mode on document element
 */
export const THEME_DATA_ATTRIBUTE = 'data-theme-mode'

export type FeatureName =
  | 'resume-optimization'
  | 'cover-letter-generation'
  | 'interview-preparation'
  | 'job-matching'
  | 'skill-gap-analysis';