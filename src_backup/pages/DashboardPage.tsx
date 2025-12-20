/**
 * ============================================================================
 * DASHBOARD PAGE (REFACTORED - PHASE 6.2)
 * ============================================================================
 * 🎯 PURPOSE: User's main hub after login - quick access to all features
 *
 * Layout:
 * - Welcome banner with user name + tier badge
 * - Real-time stats from backend (resumes, jobs, applications)
 * - Feature cards linking to main pages (Resumes, Jobs, Applications)
 * - Getting started guide
 *
 * Backend Integration:
 * - useResumes hook for resume count
 * - useJobs hook for job count
 * - useApplications hook for application count
 *
 * Theme Integration:
 * - useRelevntColors for centralized color system
 * - useTierColors for tier badge styling
 * - PageBackground wrapper
 * - PageHeader with illustration (v2)
 * ============================================================================
 */

import { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { copy } from '../config/i18n.config';
import { TIERS } from '../config/tiers';
import { supabase } from '../lib/supabase';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { UsageStats } from '../components/shared/UsageStats';
import { useRelevntColors, useTierColors } from '../hooks';
import { useResumes, useJobs, useApplications } from '../hooks';

/**
 * DashboardPage Component
 */
export function DashboardPage(): JSX.Element {
  const { user } = useAuth();
  const colors = useRelevntColors();
  const userTier = (user?.user_metadata?.tier as string) || 'starter';
  const tierColors = useTierColors(userTier);

  // For theme-dependent logic (like hover shadows)
  const isDark = colors.background === '#1A1A1A';

  // ============================================================
  // BACKEND DATA HOOKS
  // ============================================================

  const { resumes, loading: resumesLoading } = useResumes(user!);
  const { totalCount: jobsCount, loading: jobsLoading } = useJobs({ limit: 1 });
  const { totalCount: applicationsCount, loading: appsLoading } = useApplications({ limit: 1 });

  // ============================================================
  // STATS
  // ============================================================

  const stats = {
    resumesCount: resumes.length,
    jobsCount,
    applicationsCount,
  };

  const isLoading = resumesLoading || jobsLoading || appsLoading;

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px',
    color: colors.text,
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
    color: colors.text,
  };

  const welcomeSubtitleStyles: CSSProperties = {
    fontSize: '16px',
    color: colors.textSecondary,
    marginBottom: '16px',
  };

  const tierBadgeStyles: CSSProperties = {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: tierColors.bg,
    color: tierColors.text,
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 600,
    border: `1px solid ${tierColors.text}`,
  };

  const signOutButtonStyles: CSSProperties = {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: colors.accent,
    border: `2px solid ${colors.accent}`,
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
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
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
    color: colors.text,
  };

  const cardDescriptionStyles: CSSProperties = {
    fontSize: '14px',
    color: colors.textSecondary,
    marginBottom: '12px',
  };

  const cardCountStyles: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: colors.accent,
  };

  // ─────────────────────────────────────────────────────────
  // GETTING STARTED SECTION
  // ─────────────────────────────────────────────────────────

  const gettingStartedStyles: CSSProperties = {
    padding: '32px',
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  };

  const gettingStartedTitleStyles: CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: colors.text,
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
    color: colors.textSecondary,
    borderBottom: `1px solid ${colors.border}`,
  };

  const stepNumberStyles: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    minWidth: '24px',
    backgroundColor: colors.accent,
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
            <h2 style={{ fontSize: '24px', color: colors.text }}>Loading...</h2>
          </div>
        </div>
      </PageBackground>
    );
  }

  if (isLoading) {
    return (
      <PageBackground>
        <div style={containerStyles}>
          <PageHeader
            title="Your Career Dashboard"
            subtitle="Loading your data..."
            
            textPosition="left"
          />
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '18px', color: colors.textSecondary }}>
              Fetching your resumes, jobs, and applications...
            </div>
          </div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div style={containerStyles}>
        {/* PAGE HEADER */}
        <PageHeader
          title="Your Career Dashboard"
          subtitle="All your job search tools in one place"
          textPosition="left"
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
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.accent;
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
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
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
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
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
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <span style={cardIconStyles}>📊</span>
              <h2 style={cardTitleStyles}>Applications</h2>
              <p style={cardDescriptionStyles}>Monitor your application status</p>
              <div style={cardCountStyles}>{stats.applicationsCount}</div>
            </div>
          </Link>

          <Link to="/settings/voice" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={cardStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
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
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
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
            <li style={{ ...stepItemStyles, borderBottom: `1px solid ${colors.border}` }}>
              <span style={stepNumberStyles}>1</span>
              <span>Create or upload your first resume</span>
            </li>
            <li style={{ ...stepItemStyles, borderBottom: `1px solid ${colors.border}` }}>
              <span style={stepNumberStyles}>2</span>
              <span>Analyze your resume for ATS compatibility</span>
            </li>
            <li style={{ ...stepItemStyles, borderBottom: `1px solid ${colors.border}` }}>
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