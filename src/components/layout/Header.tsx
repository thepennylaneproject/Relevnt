/**
 * 🎨 HEADER COMPONENT
 * 
 * Main navigation header with theme toggle.
 * Integrated with RelevntThemeProvider for light/dark mode support.
 * 
 * 📚 LEARNING NOTE: This component demonstrates how to properly use
 * the new theme system - destructure toggleMode from the hook!
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { useRelevntTheme } from '../../contexts/RelevntThemeProvider'

export interface HeaderProps {
    userInitial?: string
    onLogout?: () => void
}

export function Header({ userInitial = 'U', onLogout }: HeaderProps) {
    // ============================================================================
    // GET THEME
    // ============================================================================

    /**
     * 📚 KEY FIX: Destructure toggleMode from the theme hook!
     * This was missing, causing "toggleMode is not defined" error
     */
    const { colors, mode, toggleMode, isDark } = useRelevntTheme()

    // ============================================================================
    // STYLES
    // ============================================================================

    const styles: Record<string, React.CSSProperties> = {
        header: {
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        } as React.CSSProperties,

        logoSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
        } as React.CSSProperties,

        logo: {
            fontSize: '20px',
            fontWeight: 700,
            color: colors.primary,
            textDecoration: 'none',
        } as React.CSSProperties,

        nav: {
            display: 'flex',
            gap: '32px',
            alignItems: 'center',
            background: 'none',
        } as React.CSSProperties,

        navLink: {
            color: colors.text,
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'color 0.2s ease',
            cursor: 'pointer',
        } as React.CSSProperties,

        rightSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
        } as React.CSSProperties,

        themeToggle: {
            background: 'none',
            border: `1px solid ${colors.border}`,
            color: colors.text,
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        } as React.CSSProperties,

        userBadge: {
            background: colors.primary,
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 600,
        } as React.CSSProperties,

        logoutButton: {
            background: colors.error,
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'opacity 0.2s ease',
        } as React.CSSProperties,
    }

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <header style={styles.header}>
            {/* Logo Section */}
            <div style={styles.logoSection}>
                <Link to="/" style={styles.logo}>
                    ✨ Relevnt
                </Link>

                {/* Navigation Links */}
                <nav style={styles.nav}>
                    {[
                        { label: 'Jobs', href: '/jobs' },
                        { label: 'Resumes', href: '/resumes' },
                        { label: 'Applications', href: '/applications' },
                    ].map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            style={styles.navLink}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Right Section */}
            <div style={styles.rightSection}>
                {/* Theme Toggle Button - FIXED */}
                <button
                    onClick={toggleMode}
                    style={styles.themeToggle}
                    title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                    aria-label="Toggle dark mode"
                >
                    {isDark ? '☀️' : '🌙'}
                    <span>{mode}</span>
                </button>

                {/* User Badge */}
                <div style={styles.userBadge} title={`User: ${userInitial}`}>
                    {userInitial.toUpperCase()}
                </div>

                {/* Logout Button */}
                {onLogout && (
                    <button
                        onClick={onLogout}
                        style={styles.logoutButton}
                        title="Log out"
                    >
                        Logout
                    </button>
                )}
            </div>
        </header>
    )
}

// ============================================================================
// USAGE
// ============================================================================

/**
 * 📚 HOW TO USE:
 * 
 * Basic usage:
 * ```tsx
 * import { Header } from '@/components/layout/Header'
 * 
 * <Header userInitial="S" />
 * ```
 * 
 * With logout handler:
 * ```tsx
 * <Header
 *   userInitial="Sarah"
 *   onLogout={() => {
 *     // Handle logout
 *     localStorage.removeItem('auth_token')
 *     navigate('/login')
 *   }}
 * />
 * ```
 * 
 * The component automatically:
 * - ✅ Gets theme colors from RelevntThemeProvider
 * - ✅ Provides theme toggle button
 * - ✅ Switches between Light/Dark mode
 * - ✅ Shows current mode emoji (☀️ or 🌙)
 * - ✅ Saves preference to localStorage
 */