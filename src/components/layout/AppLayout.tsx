// src/components/layout/AppLayout.tsx
import React, { ReactNode } from 'react'
import { useRelevntTheme } from '../../contexts/RelevntThemeProvider'
import { Header } from './Header'
import { Footer } from './Footer'

export interface AppLayoutProps {
  children: ReactNode
  showFooter?: boolean
}

export function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  const { colors } = useRelevntTheme()

  const container: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    flexShrink: 0,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  }

  const footerStyle: React.CSSProperties = {
    flexShrink: 0,
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
  }

  return (
    <div style={container}>
      <header style={headerStyle}>
        <Header />
      </header>

      <main style={mainStyle}>{children}</main>

      {showFooter && (
        <footer style={footerStyle}>
          <Footer />
        </footer>
      )}
    </div>
  )
}