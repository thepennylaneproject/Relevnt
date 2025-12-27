import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Icon, IconName } from '../ui/Icon'
import { copy } from '../../lib/copy'
import NotificationCenter from './NotificationCenter'
import { Menu, X } from 'lucide-react'

// Flat nav items - no more category grouping
interface NavItem {
  path: string
  label: string
  icon: IconName
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'gauge' },
  { path: '/jobs', label: 'Jobs', icon: 'briefcase' },
  { path: '/applications', label: 'Apply', icon: 'paper-airplane' },
  { path: '/resumes', label: 'Resume', icon: 'scroll' },
  { path: '/profile-analyzer', label: 'Profile', icon: 'stars' },
  { path: '/interview-prep', label: 'Interview', icon: 'microphone' },
]

const DOODLES: Record<string, string> = {
  '/dashboard': '/doodles/sidebar-roadmap.svg',
  '/jobs': '/doodles/sidebar-constellation.svg',
  '/applications': '/doodles/sidebar-notebook.svg',
  '/resumes': '/doodles/sidebar-tools.svg',
  '/profile-analyzer': '/doodles/sidebar-constellation.svg',
  '/interview-prep': '/doodles/sidebar-microphone.svg',
  '/settings': '/doodles/sidebar-phoenix.svg',
}

export default function SidebarMarginNav() {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const active = (path: string) => pathname.startsWith(path)

  // Close mobile nav when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`margin-nav ${mobileOpen ? 'is-open' : ''}`}>
        <nav className="margin-nav__nav">
          <ul className="margin-nav__list">
            {NAV_ITEMS.map(({ path, label, icon }) => {
              const isActive = active(path)
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={`margin-nav__item nav-item${isActive ? ' nav-item--active active' : ''}`}
                  >
                    <span className="margin-nav__icon icon-nav">
                      <Icon
                        name={icon}
                        size="md"
                        hideAccent={!isActive}
                      />
                    </span>
                    <span className="margin-nav__label">{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Settings at bottom */}
          <div className="margin-nav__settings">
            <Link
              to="/settings"
              className={`margin-nav__item nav-item${active('/settings') ? ' nav-item--active active' : ''}`}
            >
              <span className="margin-nav__icon icon-nav">
                <Icon name="pocket-watch" size="md" hideAccent={!active('/settings')} />
              </span>
              <span className="margin-nav__label">{copy.nav.settings}</span>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}

