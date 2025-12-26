// src/components/layout/Header.tsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X } from 'lucide-react'
import './header.css'

export interface HeaderProps {
  userInitial?: string
}

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/jobs', label: 'Jobs' },
  { path: '/applications', label: 'Applications' },
  { path: '/resumes', label: 'Resume' },
  { path: '/interview-prep', label: 'Interview Prep' },
  { path: '/settings', label: 'Settings' },
]

export function Header({ userInitial }: HeaderProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initial =
    userInitial ||
    (user?.email ? user.email.charAt(0).toUpperCase() : 'R')

  const handleLogout = async () => {
    setMobileMenuOpen(false)
    await signOut()
    navigate('/login')
  }

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false)
    navigate(path)
  }

  return (
    <>
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <div className="header-logo-icon" />
            <span className="header-logo-text">relevnt</span>
          </Link>
        </div>

        <div className="header-right">
          {user ? (
            <>
              <div className="header-avatar">{initial}</div>
              <button type="button" onClick={handleLogout} className="ghost-button button-sm header-desktop-only">
                Log out
              </button>
              <button
                type="button"
                className="header-mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && user && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="mobile-nav-title">Menu</span>
              <button
                type="button"
                className="mobile-nav-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="mobile-nav-links">
              {NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <button
                    type="button"
                    className="mobile-nav-link"
                    onClick={() => handleNavClick(link.path)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mobile-nav-footer">
              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
