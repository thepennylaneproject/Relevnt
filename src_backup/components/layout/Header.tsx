/**
 * HEADER COMPONENT
 *
 * Main navigation header with complete app navigation.
 * Uses new Relevnt icons with accent dots and CSS tokens.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRelevntTheme } from '../../contexts/RelevntThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import {
  DashboardIcon,
  JobsIcon,
  ResumeIcon,
  ApplicationsIcon,
  SettingsIcon,
  NavIconWrapper,
} from '../icons/RelevntIcons';

export interface HeaderProps {
  userInitial?: string;
  onLogout?: () => void;
}

export function Header({ userInitial, onLogout }: HeaderProps) {
  const { toggleMode, isDark } = useRelevntTheme();
  const { user } = useAuth();
  const location = useLocation();

  // Check if user is admin (check role or tier)
  const isAdmin =
    user?.user_metadata?.role === 'admin' ||
    user?.user_metadata?.tier === 'admin' ||
    user?.user_metadata?.tier === 'premium';

  // Get user initial from user email or prop
  const displayInitial = userInitial || user?.email?.charAt(0).toUpperCase() || 'U';

  // Check if current path matches link
  const isActive = (path: string) => location.pathname === path;

  // ============================================================================
  // STYLES
  // ============================================================================

  const styles: Record<string, React.CSSProperties> = {
    header: {
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,

    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '48px',
    } as React.CSSProperties,

    logo: {
      fontSize: '18px',
      fontWeight: 600,
      color: 'var(--text)',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      letterSpacing: '0.02em',
    } as React.CSSProperties,

    nav: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      background: 'none',
    } as React.CSSProperties,

    navLink: {
      color: 'var(--text-muted)',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      padding: '0.6rem 0.9rem',
      borderRadius: '999px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
    } as React.CSSProperties,

    navLinkActive: {
      backgroundColor: 'var(--accent-soft)',
      color: 'var(--text)',
    } as React.CSSProperties,

    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    } as React.CSSProperties,

    themeToggle: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-muted)',
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '18px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,

    userBadge: {
      background: 'var(--accent)',
      color: 'var(--bg)',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    } as React.CSSProperties,

    logoutButton: {
      background: 'transparent',
      color: 'var(--text)',
      border: '1px solid var(--border-subtle)',
      padding: '8px 16px',
      borderRadius: '999px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 500,
      transition: 'all 0.2s ease',
    } as React.CSSProperties,
  };

  // Navigation links - main app sections with new icons
  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', Icon: DashboardIcon },
    { label: 'Jobs', href: '/jobs', Icon: JobsIcon },
    { label: 'Resumes', href: '/resumes', Icon: ResumeIcon },
    { label: 'Applications', href: '/applications', Icon: ApplicationsIcon },
    { label: 'Settings', href: '/settings', Icon: SettingsIcon },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <header style={styles.header}>
      {/* Logo Section */}
      <div style={styles.logoSection}>
        <Link to="/dashboard" style={styles.logo}>
          <span>Relevnt</span>
        </Link>

        {/* Navigation Links */}
        <nav style={styles.nav}>
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const { Icon } = link;
            return (
              <Link
                key={link.label}
                to={link.href}
                style={{
                  ...styles.navLink,
                  ...(active ? styles.navLinkActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <NavIconWrapper>
                  <Icon size={20} strokeWidth={1.5} />
                </NavIconWrapper>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Section */}
      <div style={styles.rightSection}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleMode}
          style={styles.themeToggle}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle dark mode"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* User Badge */}
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <div
            style={styles.userBadge}
            title={`${user?.email || 'User'} - Click for settings`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {displayInitial}
          </div>
        </Link>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            style={styles.logoutButton}
            title="Log out"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-soft)';
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.borderColor = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
