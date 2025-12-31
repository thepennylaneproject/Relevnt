// ready/src/components/layout/Header.tsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, Settings as SettingsIcon, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { Icon, type IconName } from '../ui/Icon'
import './header.css'

export interface HeaderProps {
  userInitial?: string
  readinessScore?: number
}

interface NavItem {
  path: string
  label: string
  description: string
  icon: IconName
}

const NAV_LINKS: NavItem[] = [
  { 
    path: '/mirror', 
    label: 'Mirror', 
    description: 'Assess yourself',
    icon: 'compass' 
  },
  { 
    path: '/practice', 
    label: 'Practice', 
    description: 'Interview prep',
    icon: 'microphone' 
  },
  { 
    path: '/learn', 
    label: 'Learn', 
    description: 'Close skill gaps',
    icon: 'book' 
  },
  { 
    path: '/coaching', 
    label: 'Coaching', 
    description: 'Get unstuck',
    icon: 'lighthouse' 
  },
  { 
    path: '/playback', 
    label: 'Playback', 
    description: 'Track progress',
    icon: 'gauge' 
  }
]

export function Header({ userInitial, readinessScore = 78 }: HeaderProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initial =
    userInitial ||
    (user?.email ? user.email.charAt(0).toUpperCase() : 'U')

  const handleLogout = async () => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
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
            <div className="header-logo-icon">
                <Icon name="zap" size="sm" hideAccent />
            </div>
            <span className="header-logo-text">Ready</span>
          </Link>

          {user && (
            <nav className="header-desktop-nav">
              {NAV_LINKS.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`header-nav-link ${location.pathname.startsWith(link.path) ? 'active' : ''}`}
                >
                  <div className="nav-link-content">
                    <span className="nav-link-label">{link.label}</span>
                    <span className="nav-link-desc">{link.description}</span>
                  </div>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="header-right">
          {user ? (
            <>
              {/* Readiness Indicator */}
              <Link to="/" className="readiness-indicator-header" title="Your Readiness Score">
                <div className="readiness-ring">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path className="circle"
                      strokeDasharray={`${readinessScore}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="readiness-value">{readinessScore}</span>
                </div>
              </Link>

              {/* User Menu */}
              <div className="user-menu-container">
                <button 
                  className="header-user-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="header-avatar">{initial}</div>
                  <ChevronDown size={14} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}>
                      <SettingsIcon size={16} />
                      Settings
                    </button>
                    <hr />
                    <button onClick={handleLogout} className="logout-btn">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>

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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => navigate('/signup')}
              >
                Get started
              </Button>
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
                    <div className="mobile-link-icon">
                        <Icon name={link.icon} size="sm" hideAccent />
                    </div>
                    <div className="mobile-link-text">
                        <span className="label">{link.label}</span>
                        <span className="desc">{link.description}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mobile-nav-footer">
              <button 
                className="mobile-nav-footer-btn"
                onClick={() => { handleNavClick('/settings'); }}
              >
                <SettingsIcon size={18} />
                Settings
              </button>
              <button 
                className="mobile-nav-footer-btn logout"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Log out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
