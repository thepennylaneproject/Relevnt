/**
 * APP LAYOUT COMPONENT
 *
 * Main layout wrapper that provides consistent page structure with Header, Footer, and content area.
 * Uses CSS tokens for theming.
 */

import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Footer } from './Footer';
import { Header, HeaderProps } from './Header';

// ============================================================================
// TYPES
// ============================================================================

export interface AppLayoutProps {
  /** Page content */
  children: ReactNode;

  /** Header props (optional) */
  headerProps?: HeaderProps;

  /** Show footer (default: true) */
  showFooter?: boolean;

  /** Custom className */
  className?: string;
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
  const navigate = useNavigate();

  // ============================================================================
  // LOGOUT HANDLER
  // ============================================================================

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ============================================================================
  // STYLES
  // ============================================================================

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
      transition: 'all 0.3s ease',
    } as React.CSSProperties,

    header: {
      flexShrink: 0,
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
      borderTop: '1px solid var(--border-subtle)',
      marginTop: 'auto',
    } as React.CSSProperties,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={styles.container} className={className} role="main" aria-label="Application layout">
      {/* Header */}
      <header style={styles.header}>
        <Header {...(headerProps || {})} onLogout={handleLogout} />
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.contentWrapper}>{children}</div>
      </main>

      {/* Footer */}
      {showFooter && (
        <footer style={styles.footer}>
          <Footer />
        </footer>
      )}
    </div>
  );
}
