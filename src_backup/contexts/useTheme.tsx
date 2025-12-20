

import { useRelevntTheme, useIsDarkMode, useThemeColors, useToggleTheme } from './RelevntThemeProvider'


export const useTheme = useRelevntTheme

/**
 *  OLD NAME: useIsDarkMode()
 *  STILL: useIsDarkMode()
 * 
 * This one didn't change - exporting directly.
 */
export { useIsDarkMode }

/**
 *  OLD NAME: useThemeColors()
 *  STILL: useThemeColors()
 * 
 * This one didn't change - exporting directly.
 */
export { useThemeColors }

/**
 * OLD NAME: useToggleTheme()
 * STILL: useToggleTheme()
 * 
 * This one didn't change - exporting directly.
 */
export { useToggleTheme }

// ============================================================================
// RE-EXPORT TYPES FOR OLD IMPORTS
// ============================================================================

export type { ThemeMode, ThemeColors, RelevntThemeContextValue } from '@/contexts/RelevntThemeProvider'

// ============================================================================
// USAGE
// ============================================================================

/**
 * Your existing components can continue to use:
 * 
 * ```tsx
 * import { useTheme, useIsDarkMode } from '@/contexts/useTheme'
 * 
 * const { colors } = useTheme()  // Still works!
 * const isDark = useIsDarkMode()  // Still works!
 * ```
 * 
 * This file automatically redirects to the new RelevntThemeProvider,
 * so your components don't need any changes.
 */