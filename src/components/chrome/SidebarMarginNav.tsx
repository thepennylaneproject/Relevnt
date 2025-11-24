import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  DashboardIcon,
  JobsIcon,
  ApplicationsIcon,
  ResumeIcon,
  CoursesIcon,
  VoiceToneIcon,
  SettingsIcon,
} from '../../components/icons/HandDrawnIcons'
import { useRelevntColors } from '../../hooks'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dash', Icon: DashboardIcon },
  { path: '/jobs', label: 'Jobs', Icon: JobsIcon },
  { path: '/applications', label: 'Apps', Icon: ApplicationsIcon },
  { path: '/resumes', label: 'CVs', Icon: ResumeIcon },
  { path: '/learn', label: 'Learn', Icon: CoursesIcon },
  { path: '/voice', label: 'Voice', Icon: VoiceToneIcon },
  { path: '/settings', label: 'Prefs', Icon: SettingsIcon },
]

const DOODLES: Record<string, string> = {
  '/dashboard': '/doodles/sidebar-roadmap.svg',
  '/jobs': '/doodles/sidebar-constellation.svg',
  '/applications': '/doodles/sidebar-notebook.svg',
  '/resumes': '/doodles/sidebar-tools.svg',
  '/learn': '/doodles/sidebar-wanderer.svg',
  '/voice': '/doodles/sidebar-notes.svg',
  '/settings': '/doodles/sidebar-phoenix.svg',
}

export default function SidebarMarginNav() {
  const { pathname } = useLocation()
  const colors = useRelevntColors()
  const active = (path: string) => pathname.startsWith(path)
  const doodle =
    DOODLES[Object.keys(DOODLES).find((p) => pathname.startsWith(p)) ?? '/dashboard']

  return (
    <aside
      className="margin-nav"
      style={
        {
          '--nav-bg': colors.surface,
          '--nav-border': colors.borderLight,
          '--nav-ink': colors.text,
          '--nav-muted': colors.textSecondary,
          '--nav-accent': colors.primary,
          '--nav-hover-bg': colors.surfaceHover,
          '--nav-active-bg': colors.focus,
        } as React.CSSProperties
      }
    >
      <div className="margin-nav__doodle">
        <img src={doodle} alt="" />
      </div>

      <nav className="margin-nav__nav">
        <ul>
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const isActive = active(path)
            return (
              <li key={path}>
                <Link to={path} className={`margin-nav__item${isActive ? ' active' : ''}`}>
                  <span className="margin-nav__icon">
                    <Icon size={22} strokeWidth={1.7} color={colors.primary} />
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
