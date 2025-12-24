import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Icon, IconName } from '../ui/Icon'
import { copy } from '../../lib/copy'
import NotificationCenter from './NotificationCenter'

// Define nav groups with items
interface NavItem {
  path: string
  label: string
  icon: IconName
  description?: string
  badge?: 'AI' | 'New'
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Track',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: 'gauge', description: 'Your career hub' },
      { path: '/jobs', label: 'Jobs', icon: 'briefcase', description: 'AI-ranked opportunities' },
      { path: '/applications', label: 'Applications', icon: 'paper-airplane', description: 'Track your pipeline' },
    ],
  },
  {
    label: 'Optimize',
    items: [
      { path: '/resumes', label: 'Resume', icon: 'scroll', description: 'ATS-optimized builder' },
      { path: '/profile-analyzer', label: 'Profile Analyzer', icon: 'stars', description: 'LinkedIn & Portfolio feedback', badge: 'AI' },
    ],
  },
]



const DOODLES: Record<string, string> = {
  '/dashboard': '/doodles/sidebar-roadmap.svg',
  '/jobs': '/doodles/sidebar-constellation.svg',
  '/applications': '/doodles/sidebar-notebook.svg',
  '/resumes': '/doodles/sidebar-tools.svg',
  '/profile-analyzer': '/doodles/sidebar-constellation.svg',
  '/interview-prep': '/doodles/sidebar-notes.svg',
  '/settings': '/doodles/sidebar-phoenix.svg',
}

export default function SidebarMarginNav() {
  const { pathname } = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(NAV_GROUPS.map(g => g.label)) // All expanded by default
  )
  const active = (path: string) => pathname.startsWith(path)
  const doodle =
    DOODLES[Object.keys(DOODLES).find((p) => pathname.startsWith(p)) ?? '/dashboard']

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  return (
    <aside className="margin-nav">
      <div className="margin-nav__doodle">
        <img src={doodle} alt="" />
      </div>

      <div className="margin-nav__notifications">
        <NotificationCenter />
      </div>

      <nav className="margin-nav__nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="nav-group">
            <button
              className="nav-group__header"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={expandedGroups.has(group.label)}
            >
              <span className="nav-group__label">{group.label}</span>
              <span className={`nav-group__chevron ${expandedGroups.has(group.label) ? 'is-expanded' : ''}`}>
                ›
              </span>
            </button>
            {expandedGroups.has(group.label) && (
              <ul className="nav-group__items">
                {group.items.map(({ path, label, icon }) => {
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
            )}
          </div>
        ))}
        {/* Settings at bottom, separate from groups */}
        <div className="nav-group nav-group--settings">
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
  )
}
