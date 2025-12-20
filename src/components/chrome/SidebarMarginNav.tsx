import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Icon, IconName } from '../ui/Icon'
import { copy } from '../../lib/copy'
import NotificationCenter from './NotificationCenter'

// Map navigation items to our custom hand-drawn icons
const NAV_ITEMS: Array<{ path: string; label: string; icon: IconName }> = [
  { path: '/dashboard', label: copy.nav.dashboard, icon: 'compass' },
  { path: '/jobs', label: copy.nav.jobs, icon: 'briefcase' },
  { path: '/applications', label: copy.nav.applications, icon: 'paper-airplane' },
  { path: '/auto-apply/queue', label: copy.nav.autoApplyQueue, icon: 'scroll' },
  { path: '/resumes', label: copy.nav.resumes, icon: 'scroll' },
  { path: '/learn', label: copy.nav.learn, icon: 'book' },
  { path: '/personas', label: copy.nav.personas, icon: 'lighthouse' },
  { path: '/voice', label: copy.nav.voice, icon: 'microphone' },
  { path: '/linkedin-optimizer', label: 'LinkedIn Optimizer', icon: 'stars' },
  { path: '/portfolio-optimizer', label: 'Portfolio Optimizer', icon: 'lighthouse' },
  { path: '/interview-prep', label: 'Interview Prep', icon: 'microphone' },
  { path: '/settings', label: copy.nav.settings, icon: 'pocket-watch' },
]

const DOODLES: Record<string, string> = {
  '/dashboard': '/doodles/sidebar-roadmap.svg',
  '/jobs': '/doodles/sidebar-constellation.svg',
  '/applications': '/doodles/sidebar-notebook.svg',
  '/resumes': '/doodles/sidebar-tools.svg',
  '/learn': '/doodles/sidebar-wanderer.svg',
  '/personas': '/doodles/sidebar-lighthouse.svg',
  '/voice': '/doodles/sidebar-notes.svg',
  '/linkedin-optimizer': '/doodles/sidebar-constellation.svg',
  '/portfolio-optimizer': '/doodles/sidebar-lighthouse.svg',
  '/interview-prep': '/doodles/sidebar-notes.svg',
  '/settings': '/doodles/sidebar-phoenix.svg',
}

export default function SidebarMarginNav() {
  const { pathname } = useLocation()
  const active = (path: string) => pathname.startsWith(path)
  const doodle =
    DOODLES[Object.keys(DOODLES).find((p) => pathname.startsWith(p)) ?? '/dashboard']

  return (
    <aside className="margin-nav">
      <div className="margin-nav__doodle">
        <img src={doodle} alt="" />
      </div>

      <div className="margin-nav__notifications">
        <NotificationCenter />
      </div>

      <nav className="margin-nav__nav">
        <ul>
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
      </nav>
    </aside>
  )
}
