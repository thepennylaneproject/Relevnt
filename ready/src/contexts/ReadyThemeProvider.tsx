/**
 * 🎨 READY THEME PROVIDER
 * 
 * Theme system providing Light/Dark mode with Pro tier as default.
 * Uses centralized color tokens optimized for interview readiness UI.
 */

import { createContext, useContext, useMemo, useCallback, useEffect, useState, ReactNode } from 'react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ThemeMode = 'Light' | 'Dark'

interface ThemeColors {
  background: string
  surface: string
  surfaceHover: string
  text: string
  textSecondary: string
  mutedText: string
  border: string
  borderLight: string
  primary: string
  primaryHover: string
  secondary: string
  secondaryHover: string
  success: string
  warning: string
  error: string
  info: string
  ready: string // Ready state color
  overlay: string
  focus: string
}

interface ReadyThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  colors: ThemeColors
  isDark: boolean
  heroImage: string
  textureImage: string
}

interface ReadyThemeProviderProps {
  children: ReactNode
  initialMode?: ThemeMode
}

// ============================================================================
// PRO TIER COLOR TOKENS
// ============================================================================

// Pro Light Mode (Ready default)
const LIGHT_COLORS: ThemeColors = {
  background: '#E8EBE8',
  surface: '#FDFCFA',
  surfaceHover: '#F5F3F0',
  text: '#1A2024',
  textSecondary: '#4A5560',
  mutedText: '#6B7280',
  border: 'rgba(0, 0, 0, 0.1)',
  borderLight: 'rgba(0, 0, 0, 0.06)',
  primary: '#4E808D',
  primaryHover: '#3D6A75',
  secondary: '#A8C3A2',
  secondaryHover: '#8FB08A',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#4E808D',
  ready: '#A8C3A2', // Sage green for "ready" state
  overlay: 'rgba(26, 32, 36, 0.5)',
  focus: 'rgba(78, 128, 141, 0.25)',
}

// Pro Dark Mode
const DARK_COLORS: ThemeColors = {
  background: '#0C0F12',
  surface: '#1A2024',
  surfaceHover: '#242A2F',
  text: '#F7F8F7',
  textSecondary: '#B8C0C8',
  mutedText: '#8A9299',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  primary: '#81B5B6',
  primaryHover: '#6A9AA6',
  secondary: '#A8C3A2',
  secondaryHover: '#B8D4B3',
  success: '#7AA28F',
  warning: '#D4A574',
  error: '#C18686',
  info: '#81B5B6',
  ready: '#A8C3A2',
  overlay: 'rgba(12, 15, 18, 0.75)',
  focus: 'rgba(129, 181, 182, 0.3)',
}

// Pro tier Cloudinary images
const IMG = {
  light: {
    hero: 'https://res.cloudinary.com/dhjzgilub/image/upload/v1759800603/hero_16-9_v01_didync.png',
    texture: 'https://res.cloudinary.com/dhjzgilub/image/upload/v1759800604/background-texture_9-16_v01_m3ybtx.png',
  },
  dark: {
    hero: 'https://res.cloudinary.com/dhjzgilub/image/upload/v1759800606/hero_16-9_v01_tulbci.png',
    texture: 'https://res.cloudinary.com/dhjzgilub/image/upload/v1759800606/background-texture_9-16_v01_lrfeza.png',
  },
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ReadyThemeContext = createContext<ReadyThemeContextValue | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function ReadyThemeProvider({
  children,
  initialMode = 'Light',
}: ReadyThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return initialMode

    const stored = localStorage.getItem('ready-theme-mode')
    if (stored === 'Dark' || stored === 'Light') return stored as ThemeMode

    // Check system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'Dark'
    }

    return 'Light'
  })

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(mode === 'Dark' ? 'dark' : 'light')
    root.setAttribute('data-theme', mode === 'Dark' ? 'dark' : 'light')

    try {
      localStorage.setItem('ready-theme-mode', mode)
    } catch (error) {
      console.error('Failed to save theme mode:', error)
    }
  }, [mode])

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'Light' ? 'Dark' : 'Light'))
  }, [])

  const colors = useMemo(() => (mode === 'Dark' ? DARK_COLORS : LIGHT_COLORS), [mode])
  const images = useMemo(() => (mode === 'Dark' ? IMG.dark : IMG.light), [mode])

  const value: ReadyThemeContextValue = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
      colors,
      isDark: mode === 'Dark',
      heroImage: images.hero,
      textureImage: images.texture,
    }),
    [mode, setMode, toggleMode, colors, images]
  )

  return (
    <ReadyThemeContext.Provider value={value}>
      {children}
    </ReadyThemeContext.Provider>
  )
}

// ============================================================================
// THEME HOOKS
// ============================================================================

export function useReadyTheme(): ReadyThemeContextValue {
  const context = useContext(ReadyThemeContext)

  if (!context) {
    throw new Error(
      '❌ useReadyTheme() must be used inside <ReadyThemeProvider>. ' +
      'Make sure ReadyThemeProvider wraps your app in main.tsx or App.tsx'
    )
  }

  return context
}

export function useIsDarkMode(): boolean {
  const { isDark } = useReadyTheme()
  return isDark
}

export function useThemeColors(): ThemeColors {
  const { colors } = useReadyTheme()
  return colors
}

export function useToggleTheme(): () => void {
  const { toggleMode } = useReadyTheme()
  return toggleMode
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type { ThemeMode, ThemeColors, ReadyThemeContextValue, ReadyThemeProviderProps }
