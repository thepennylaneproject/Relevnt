// src/components/layout/Header.tsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRelevntTheme } from '../../contexts/RelevntThemeProvider'
import { useRelevntColors } from '../../hooks'
import { useAuth } from '../../contexts/AuthContext'

export interface HeaderProps {
  userInitial?: string
}

export function Header({ userInitial }: HeaderProps) {
  const { isDark, toggleMode } = useRelevntTheme()
  const colors = useRelevntColors()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const initial =
    userInitial ||
    (user?.email ? user.email.charAt(0).toUpperCase() : 'R')

  const wrapper: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  }

  const left: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  }

  const brandDot: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: '999px',
    background: colors.surfaceHover,
    border: `1px solid ${colors.borderLight}`,
  }

  const brandText: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }

  const right: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const pillButton: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textSecondary,
    fontSize: 13,
    cursor: 'pointer',
  }

  const primaryButton: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 999,
    border: 'none',
    background: colors.primary,
    color: colors.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const avatar: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: colors.focus,
    color: colors.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
  }

  const iconButton: React.CSSProperties = {
    padding: 6,
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    background: colors.surface,
    cursor: 'pointer',
    fontSize: 14,
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={wrapper}>
      <div style={left}>
        <Link to="/" style={{ textDecoration: 'none', color: colors.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={brandDot} />
            <div style={brandText}>relevnt</div>
          </div>
        </Link>
      </div>

      <div style={right}>
        <button type="button" onClick={toggleMode} style={iconButton}>
          {isDark ? '☾' : '☼'}
        </button>

        {user ? (
          <>
            <div style={avatar}>{initial}</div>
            <button type="button" onClick={handleLogout} style={pillButton}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              style={pillButton}
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
            <button
              type="button"
              style={primaryButton}
              onClick={() => navigate('/signup')}
            >
              Get started
            </button>
          </>
        )}
      </div>
    </div>
  )
}
