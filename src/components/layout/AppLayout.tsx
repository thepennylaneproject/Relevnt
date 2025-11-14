/**
 * 🎨 APP LAYOUT COMPONENT
 * 
 * Main layout wrapper that provides consistent page structure with Header, Footer, and content area.
 * Fully integrated with RelevntThemeProvider for theme support.
 * 
 * 📚 LEARNING NOTE: This demonstrates proper theme integration - get theme from hook,
 * apply colors to all styled elements, and pass down to child components.
 */

import React, { ReactNode } from 'react'
import { useRelevntTheme } from '../../contexts/RelevntThemeProvider'
import { Footer } from './Footer'
import { Header, HeaderProps } from './Header'
// ============================================================================
// TYPES
// ============================================================================

export interface AppLayoutProps {
    /** Page content */
    children: ReactNode

    /** Header props (optional) */
    headerProps?: HeaderProps

    /** Show footer (default: true) */
    showFooter?: boolean

    /** Custom className */
    className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AppLayout({
    children,
    headerProps,
    showFooter = true,
    className = '',
}: AppLayoutProps) {
    // ============================================================================
    // GET THEME - KEY FIX!
    // ============================================================================

    /**
     * 📚 KEY FIX: Get theme from hook!
     * This was missing, causing "Cannot read properties of undefined (reading 'colors')"
     */
    const { colors } = useRelevntTheme()

    // ============================================================================
    // STYLES
    // ============================================================================

    const styles: Record<string, React.CSSProperties> = {
        container: {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.background,
            color: colors.text,
            transition: 'all 0.3s ease',
        } as React.CSSProperties,

        header: {
            flexShrink: 0,
            borderBottom: `1px solid ${colors.border}`,
        } as React.CSSProperties,

        main: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '32px 24px',
            boxSizing: 'border-box',
        } as React.CSSProperties,

        contentWrapper: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
        } as React.CSSProperties,

        footer: {
            flexShrink: 0,
            borderTop: `1px solid ${colors.border}`,
            marginTop: 'auto',
        } as React.CSSProperties,
    }

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <div
            style={styles.container}
            className={className}
            role="main"
            aria-label="Application layout"
        >
            {/* Header */}
            <header style={styles.header}>
                <Header {...(headerProps || {})} />
            </header>

            {/* Main Content */}
            <main style={styles.main}>
                <div style={styles.contentWrapper}>
                    {children}
                </div>
            </main>

            {/* Footer */}
            {showFooter && (
                <footer style={styles.footer}>
                    <Footer />
                </footer>
            )}
        </div>
    )
}

// ============================================================================
// USAGE
// ============================================================================

/**
 * 📚 HOW TO USE:
 * 
 * Basic usage - wrap your page content:
 * ```tsx
 * import { AppLayout } from '@/components/layout/AppLayout'
 * 
 * export function MyPage() {
 *   return (
 *     <AppLayout>
 *       <div>Your page content here</div>
 *     </AppLayout>
 *   )
 * }
 * ```
 * 
 * With custom header:
 * ```tsx
 * <AppLayout headerProps={{ userInitial: 'S' }}>
 *   Your content
 * </AppLayout>
 * ```
 * 
 * Without footer:
 * ```tsx
 * <AppLayout showFooter={false}>
 *   Your content
 * </AppLayout>
 * ```
 * 
 * Features:
 * - ✅ Automatically includes Header with theme toggle
 * - ✅ Automatically includes Footer
 * - ✅ Full-height layout (100vh minimum)
 * - ✅ Theme colors applied to all elements
 * - ✅ Responsive design
 * - ✅ Accessible markup
 * - ✅ Dark mode support
 */