/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASTHEAD NAVIGATION — Ledger System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Horizontal, text-only navigation replacing sidebar.
 * Active state: champagne dot (preferred) or thin underline.
 * 
 * Structure:
 * - Left: Relevnt wordmark
 * - Center: Dashboard | Jobs | Applications | Documents | Settings
 * - Right: Account dropdown (with Log out)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, ChevronDown } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/jobs', label: 'Jobs' },
  { path: '/applications', label: 'Applications' },
  { path: '/resumes', label: 'Documents' },
  { path: '/settings', label: 'Settings' },
];

export default function MastheadNav() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const active = (path: string) => pathname.startsWith(path);

  // Close mobile nav when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setAccountOpen(false);
    };
    
    if (accountOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [accountOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getDisplayName = () => {
    if (!user) return 'Account';

    // 1. Try full_name from extended User type
    if (user.full_name) return user.full_name;

    // 2. Try firstName/lastName from Supabase user_metadata
    const meta = user.user_metadata;
    if (meta?.firstName || meta?.lastName) {
      return [meta.firstName, meta.lastName].filter(Boolean).join(' ');
    }

    // 3. Fallback to email prefix with capitalization
    const emailPrefix = user.email?.split('@')[0] || 'Account';
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="masthead-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="masthead-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <header className={`masthead ${mobileOpen ? 'masthead--mobile-open' : ''}`}>
        <div className="masthead__container">
          {/* Wordmark */}
          <Link to="/dashboard" className="masthead__wordmark">
            Relevnt
          </Link>

          {/* Navigation */}
          <nav className="masthead__nav">
            <ul className="masthead__list">
              {NAV_ITEMS.map(({ path, label }) => {
                const isActive = active(path);
                return (
                  <li key={path}>
                    <Link
                      to={path}
                      className={`masthead__link ${isActive ? 'masthead__link--active' : ''}`}
                    >
                      {label}
                      {isActive && <span className="masthead__active-dot" aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Account dropdown */}
          {user && (
            <div className="masthead__account">
              <button
                className="masthead__account-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setAccountOpen(!accountOpen);
                }}
                aria-expanded={accountOpen}
              >
                {getDisplayName()}
                <ChevronDown size={14} />
              </button>

              {accountOpen && (
                <div className="masthead__account-menu">
                  <button
                    className="masthead__account-item"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
