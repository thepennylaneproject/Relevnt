// src/components/layout/Header.tsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export interface HeaderProps {
  userInitial?: string
}

export function Header({ userInitial }: HeaderProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const initial =
    userInitial ||
    (user?.email ? user.email.charAt(0).toUpperCase() : 'R')

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-soft)', border: '1px solid var(--border)' }} />
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>relevnt</div>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-accent-glow)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>{initial}</div>
            <button type="button" onClick={handleLogout} className="ghost-button button-sm">
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="ghost-button button-sm"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
            <button
              type="button"
              className="primary-button button-sm"
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
