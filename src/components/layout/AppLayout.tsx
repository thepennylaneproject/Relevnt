// src/components/layout/AppLayout.tsx
import React, { ReactNode } from 'react'
import { Footer } from './Footer'

export interface AppLayoutProps {
  children: ReactNode
  showFooter?: boolean
}

/**
 * AppLayout — Main content wrapper.
 * Navigation is handled by MastheadNav in App.tsx (single global nav).
 * This component provides the main content area + optional Footer.
 */
export function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  const container: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg)',
    position: 'relative',
  }

  return (
    <div style={container}>
      <main style={mainStyle}>{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}

