/**
 * ============================================================================
 * DASHBOARD PAGE (FULLY REFACTORED - PHASE 6.1)
 * ============================================================================
 * 🎯 PURPOSE: User's main hub after login - quick access to all features
 * 
 * Layout:
 * - Welcome banner with user name + tier badge
 * - Quick stats card (resumes, jobs, applications)
 * - Feature cards linking to main pages (Resumes, Jobs, Applications)
 * - Getting started guide
 * 
 * Brand Integration:
 * - PageBackground wrapper
 * - PageHeader with illustration (v2)
 * - Tier-aware badge colors
 * - Theme-aware styling
 * 
 * 🎓 LEARNING NOTE: This page demonstrates:
 * - Tier badges (color-coded by tier)
 * - Card grid layout
 * - Link navigation with styling
 * - Interactive hover effects
 * ============================================================================
 */

import { CSSProperties, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/useTheme';
import { copy } from '../config/i18n.config';
import { TIERS } from '../config/tiers';
import { supabase } from '../lib/supabase';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { UsageStats } from '../components/shared/UsageStats';

/**
 * DashboardPage Component
 */
export function DashboardPage(): JSX.Element {
  const { user } = useAuth();
  const { mode } = useTheme();

  const isDark = mode === 'Dark';
  const userTier = (user?.user_metadata?.tier as string) || 'starter';

  // ============================================================
  // THEME COLORS
  // ============================================================

  const themeColors = useMemo(() => ({
    bg: isDark ? '#0f0f0f' : '#ffffff',
    surface: isDark ? '#1a1a1a' : '#f9fafb',
    text: isDark ? '#f5f5f5' : '#1a1a1a',
    textSecondary: isDark ? '#b0b0b0' : '#666666',
    border: isDark ? '#333333' : '#e5e7eb',
    primary: '#4E808D',
    accent: '#D4A574',
    tierStarter: { bg: isDark ? '#2a2a2a' : '#f5f5f5', text: isDark ? '#e0e0e0' : '#333' },
    tierPro: { bg: isDark ? '#0d3a3a' : '#e0f2f1', text: isDark ? '#4db8c4' : '#009b9b' },
    tierPremium: { bg: isDark ? '#3d3d1a' : '#fef9e7', text: isDark ? '#e6d580' : '#b8860b' },
  }), [isDark]);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'pro':
        return themeColors.tierPro;
      case 'premium':
        return themeColors.tierPremium;
      default:
        return themeColors.tierStarter;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // ============================================================
  // MOCK DATA (replace with real data from Supabase in Phase 6.2)
  // ============================================================

  const stats = {
    resumesCount: 1,
    jobsCount: 0,
    applicationsCount: 0,
  };

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px',
    color: themeColors.text,
  };

  // ─────────────────────────────────────────────────────────
  // HEADER WITH TIER BADGE
  // ─────────────────────────────────────────────────────────

  const headerStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '20px',
  };

  const welcomeSectionStyles: CSSProperties = {
    flex: 1,
    minWidth: '300px',
  };

  const welcomeTitleStyles: CSSProperties = {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
    color: themeColors.text,
  };

  const welcomeSubtitleStyles: CSSProperties = {
    fontSize: '16px',
    color: themeColors.textSecondary,
    marginBottom: '16px',
  };

  const tierBadgeStyles = useMemo(() => {
    const tierColors = getTierColors(userTier);
    return {
      display: 'inline-block',
      padding: '8px 16px',
      backgroundColor: tierColors.bg,
      color: tierColors.text,
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 600,
      border: `1px solid ${tierColors.text}`,
    } as CSSProperties;
  }, [userTier, themeColors]);

  const signOutButtonStyles: CSSProperties = {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: themeColors.accent,
    border: `2px solid ${themeColors.accent}`,
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  // ─────────────────────────────────────────────────────────
  // USAGE STATS SECTION
  // ─────────────────────────────────────────────────────────

  const usageStatsContainerStyles: CSSProperties = {
    marginBottom: '40px',
  };

  // ─────────────────────────────────────────────────────────
  // CARDS GRID
  // ─────────────────────────────────────────────────────────

  const cardsGridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  };

  const cardStyles: CSSProperties = {
    padding: '28px',
    backgroundColor: themeColors.surface,
    borderRadius: '12px',
    border: `1px solid ${themeColors.border}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  };

  const cardIconStyles: CSSProperties = {
    fontSize: '40px',
    marginBottom: '12px',
    display: 'block',
  };

  const cardTitleStyles: CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
    color: themeColors.text,
  };

  const cardDescriptionStyles: CSSProperties = {
    fontSize: '14px',
    color: themeColors.textSecondary,
    marginBottom: '12px',
  };

  const cardCountStyles: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: themeColors.accent,
  };

  // ─────────────────────────────────────────────────────────
  // GETTING STARTED SECTION
  // ─────────────────────────────────────────────────────────

  const gettingStartedStyles: CSSProperties = {
    padding: '32px',
    backgroundColor: themeColors.surface,
    borderRadius: '12px',
    border: `1px solid ${themeColors.border}`,
  };

  const gettingStartedTitleStyles: CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: themeColors.text,
  };

  const stepsListStyles: CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  const stepItemStyles: CSSProperties = {
    padding: '12px 0',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: themeColors.textSecondary,
    borderBottom: `1px solid ${themeColors.border}`,
  };

  const stepNumberStyles: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    minWidth: '24px',
    backgroundColor: themeColors.accent,
    color: '#000',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: 700,
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!user) {
    return (
      <PageBackground>
        <div style={containerStyles}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: themeColors.text }}>Loading...</h2>
          </div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground version="v2" overlayOpacity={0.15}>
      <div style={containerStyles}>
        {/* PAGE HEADER */}
        <PageHeader
          title="Your Career Dashboard"
          subtitle="All your job search tools in one place"
          illustrationVersion="v2"
          illustrationPosition="left"
        />

        {/* ═══════════════════════════════════════════════════════════ */
        /* HEADER WITH TIER */
        /* ═══════════════════════════════════════════════════════════ */}

        <div style={headerStyles}>
          <div style={welcomeSectionStyles}>
            <h1 style={welcomeTitleStyles}>
              Welcome back, {user.email?.split('@')[0]}! 👋
            </h1>
            <p style={welcomeSubtitleStyles}>
              {copy.onboarding.tagline}
            </p>
            <div style={tierBadgeStyles}>
              ✨ {TIERS[userTier as 'starter' | 'pro' | 'premium'].name} Plan
            </div>
          </div>

          <button
            style={signOutButtonStyles}
            onClick={handleSignOut}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.accent;
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = themeColors.accent;
            }}
          >
            Sign Out
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */
        /* USAGE STATS */
        /* ═══════════════════════════════════════════════════════════ */}

        <div style={usageStatsContainerStyles}>
          <UsageStats variant="expanded" />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */
        /* FEATURE CARDS GRID */
        /* ═══════════════════════════════════════════════════════════ */}

        <div style={cardsGridStyles}>
          {/* RESUMES CARD */}
          <Link to="/resumes" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={cardStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                e.currentTarget.style.borderColor = themeColors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = themeColors.border;
              }}
            >
              <span style={cardIconStyles}>📄</span>
              <h2 style={cardTitleStyles}>Resumes</h2>
              <p style={cardDescriptionStyles}>Create and manage your resumes</p>
              <div style={cardCountStyles}>{stats.resumesCount}</div>
            </div>
          </Link>

          {/* JOBS CARD */}
          <Link to="/jobs" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={cardStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                e.currentTarget.style.borderColor = themeColors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = themeColors.border;
              }}
            >
              <span style={cardIconStyles}>💼</span>
              <h2 style={cardTitleStyles}>Jobs</h2>
              <p style={cardDescriptionStyles}>Track job opportunities</p>
              <div style={cardCountStyles}>{stats.jobsCount}</div>
            </div>
          </Link>

          {/* APPLICATIONS CARD */}
          <Link to="/applications" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={cardStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                e.currentTarget.style.borderColor = themeColors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = themeColors.border;
              }}
            >
              <span style={cardIconStyles}>📊</span>
              <h2 style={cardTitleStyles}>Applications</h2>
              <p style={cardDescriptionStyles}>Monitor your application status</p>
              <div style={cardCountStyles}>{stats.applicationsCount}</div>
            </div>
          </Link>

          <Link to="/onboarding/voice" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={cardStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                e.currentTarget.style.borderColor = themeColors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = themeColors.border;
              }}
            >
              <span style={cardIconStyles}>🔈</span>
              <h2 style={cardTitleStyles}>Voice</h2>
              <p style={cardDescriptionStyles}>Keep your applications authentic.</p>
              <div style={cardCountStyles}>{stats.applicationsCount}</div>
            </div>
          </Link>

          <Link to="/auto-apply" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={cardStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                e.currentTarget.style.borderColor = themeColors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = themeColors.border;
              }}
            >
              <span style={cardIconStyles}>💥</span>
              <h2 style={cardTitleStyles}>Automate</h2>
              <p style={cardDescriptionStyles}>Apply for high confidence roles effortlessly.</p>
              <div style={cardCountStyles}>{stats.applicationsCount}</div>
            </div>
          </Link>
      </div>
        {/* ═══════════════════════════════════════════════════════════ */
        /* GETTING STARTED GUIDE */
        /* ═══════════════════════════════════════════════════════════ */}

        <div style={gettingStartedStyles}>
          <h2 style={gettingStartedTitleStyles}>🚀 Getting Started</h2>
          <ol style={stepsListStyles}>
            <li style={{ ...stepItemStyles, borderBottom: `1px solid ${themeColors.border}` }}>
              <span style={stepNumberStyles}>1</span>
              <span>Create or upload your first resume</span>
            </li>
            <li style={{ ...stepItemStyles, borderBottom: `1px solid ${themeColors.border}` }}>
              <span style={stepNumberStyles}>2</span>
              <span>Analyze your resume for ATS compatibility</span>
            </li>
            <li style={{ ...stepItemStyles, borderBottom: `1px solid ${themeColors.border}` }}>
              <span style={stepNumberStyles}>3</span>
              <span>Search for jobs that match your skills</span>
            </li>
            <li style={{ ...stepItemStyles, borderBottom: 'none' }}>
              <span style={stepNumberStyles}>4</span>
              <span>Track your applications and build momentum</span>
            </li>
          </ol>
        </div>
      </div>
    </PageBackground>
  );
}

export default DashboardPage;