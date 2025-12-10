// src/components/layout/AppLayout.tsx
import React, { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

export interface AppLayoutProps {
  children: ReactNode
  showFooter?: boolean
}

export function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  const container: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  }

  const headerStyle: React.CSSProperties = {
    flexShrink: 0,
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
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
      <header style={headerStyle}>
        <Header />
      </header>

      <main style={mainStyle}>{children}</main>

      {showFooter && <Footer />}
    </div>
  )
}
