/**
 * ============================================================================
 * APPLICATIONS PAGE (FULLY REFACTORED - PHASE 6.1)
 * ============================================================================
 * 🎯 PURPOSE: Track and manage all job applications in one place
 * 
 * Sections:
 * - Status filters (Applied, In Progress, Rejected, Offer)
 * - Application cards with timeline/status
 * - Progress stats at top
 * 
 * Brand Integration:
 * - PageBackground wrapper
 * - PageHeader with illustration (v4)
 * - Status-coded cards (colors by application stage)
 * 
 * 🎓 LEARNING NOTE: Shows tier-aware feature display
 * ============================================================================
 */

import { CSSProperties, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/useTheme';
import { copy } from '../config/i18n.config';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { UsageStats } from '../components/shared/UsageStats';

type ApplicationStatus = 'applied' | 'in-progress' | 'rejected' | 'offer';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdate: string;
  notes?: string;
}

/**
 * ApplicationsPage Component
 */
export function ApplicationsPage(): JSX.Element {
  const { user } = useAuth();
  const { mode } = useTheme();

  const isDark = mode === 'Dark';

  // ============================================================
  // STATE
  // ============================================================

  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');

  // 🔗 HOOK PLACEHOLDER: useExtractJobs for application data
  // Mock data - replace with real data from Supabase in Phase 6.2
  const [applications] = useState<Application[]>([
    {
      id: '1',
      jobTitle: 'Senior Frontend Engineer',
      company: 'Tech Corp',
      status: 'applied',
      appliedDate: '2025-11-10',
      lastUpdate: '2025-11-10',
    },
    {
      id: '2',
      jobTitle: 'Full Stack Developer',
      company: 'StartUp Inc',
      status: 'in-progress',
      appliedDate: '2025-11-08',
      lastUpdate: '2025-11-11',
      notes: 'Phone screen scheduled for Nov 15',
    },
    {
      id: '3',
      jobTitle: 'React Developer',
      company: 'Design Studios',
      status: 'offer',
      appliedDate: '2025-10-20',
      lastUpdate: '2025-11-09',
      notes: 'Offer received: $155k/year',
    },
    {
      id: '4',
      jobTitle: 'Product Manager',
      company: 'Old Company',
      status: 'rejected',
      appliedDate: '2025-10-15',
      lastUpdate: '2025-10-28',
      notes: 'Position filled internally',
    },
  ]);

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
  }), [isDark]);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied':
        return { bg: isDark ? '#1a2a3a' : '#e0f2fe', text: '#0369a1', icon: '📤' };
      case 'in-progress':
        return { bg: isDark ? '#2a2a1a' : '#fef3c7', text: '#92400e', icon: '⏳' };
      case 'offer':
        return { bg: isDark ? '#1a3a1a' : '#d1fae5', text: '#065f46', icon: '🎉' };
      case 'rejected':
        return { bg: isDark ? '#3a1a1a' : '#fee2e2', text: '#991b1b', icon: '✗' };
      default:
        return { bg: themeColors.surface, text: themeColors.textSecondary, icon: '•' };
    }
  };

  const filteredApplications = applications.filter(app => 
    filterStatus === 'all' || app.status === filterStatus
  );

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    inProgress: applications.filter(a => a.status === 'in-progress').length,
    offers: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
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
  // STATS SECTION
  // ─────────────────────────────────────────────────────────

  const statsGridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '40px',
  };

  const statCardStyles: CSSProperties = {
    padding: '20px',
    backgroundColor: themeColors.surface,
    borderRadius: '8px',
    border: `1px solid ${themeColors.border}`,
    textAlign: 'center',
  };

  const statNumberStyles: CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: themeColors.accent,
    marginBottom: '4px',
  };

  const statLabelStyles: CSSProperties = {
    fontSize: '12px',
    color: themeColors.textSecondary,
    fontWeight: 500,
  };

  // ─────────────────────────────────────────────────────────
  // FILTER TABS
  // ─────────────────────────────────────────────────────────

  const filterTabsStyles: CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    borderBottom: `1px solid ${themeColors.border}`,
    overflow: 'auto',
    paddingBottom: '12px',
  };

  const filterButtonStyles = (isActive: boolean): CSSProperties => ({
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: isActive ? themeColors.accent : themeColors.textSecondary,
    border: 'none',
    borderBottom: isActive ? `3px solid ${themeColors.accent}` : 'none',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  });

  // ─────────────────────────────────────────────────────────
  // APPLICATION CARDS
  // ─────────────────────────────────────────────────────────

  const applicationsContainerStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  };

  const appCardStyles = (status: ApplicationStatus): CSSProperties => {
    const statusColor = getStatusColor(status);
    return {
      padding: '24px',
      backgroundColor: statusColor.bg,
      borderRadius: '12px',
      border: `2px solid ${statusColor.text}`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    };
  };

  const appHeaderStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
  };

  const appTitleStyles: CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: themeColors.text,
    marginBottom: '4px',
  };

  const appCompanyStyles: CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: themeColors.textSecondary,
    marginBottom: '12px',
  };

  const appStatusBadgeStyles = (status: ApplicationStatus): CSSProperties => {
    const statusColor = getStatusColor(status);
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      backgroundColor: statusColor.bg,
      color: statusColor.text,
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'capitalize',
    };
  };

  const appDatesStyles: CSSProperties = {
    fontSize: '13px',
    color: themeColors.textSecondary,
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: `1px solid ${themeColors.border}`,
  };

  const appNotesStyles: CSSProperties = {
    fontSize: '13px',
    color: themeColors.textSecondary,
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderRadius: '6px',
    fontStyle: 'italic',
  };

  const emptyStateStyles: CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: themeColors.surface,
    borderRadius: '12px',
    border: `1px solid ${themeColors.border}`,
  };

  const emptyStateIconStyles: CSSProperties = {
    fontSize: '64px',
    marginBottom: '16px',
  };

  const emptyStateTitleStyles: CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: themeColors.text,
    marginBottom: '8px',
  };

  const emptyStateTextStyles: CSSProperties = {
    fontSize: '14px',
    color: themeColors.textSecondary,
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!user) {
    return (
      <PageBackground>
        <div style={containerStyles}>
          <div style={emptyStateStyles}>
            <h2 style={emptyStateTitleStyles}>Loading...</h2>
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
          title="Application Tracker"
          subtitle="Track every application from submission to decision"
          illustrationVersion="v4"
          illustrationPosition="left"
        />

        {/* USAGE STATS */}
        <UsageStats variant="compact" customStyles={{ marginBottom: '32px' }} />

        {/* ═══════════════════════════════════════════════════════════ */
        /* STATS CARDS */
        /* ═══════════════════════════════════════════════════════════ */}

        <div style={statsGridStyles}>
          <div style={statCardStyles}>
            <div style={statNumberStyles}>{stats.total}</div>
            <div style={statLabelStyles}>Total Applications</div>
          </div>
          <div style={statCardStyles}>
            <div style={statNumberStyles}>{stats.applied}</div>
            <div style={statLabelStyles}>Just Applied</div>
          </div>
          <div style={statCardStyles}>
            <div style={statNumberStyles}>{stats.inProgress}</div>
            <div style={statLabelStyles}>In Progress</div>
          </div>
          <div style={statCardStyles}>
            <div style={statNumberStyles}>{stats.offers}</div>
            <div style={statLabelStyles}>Offers</div>
          </div>
          <div style={statCardStyles}>
            <div style={statNumberStyles}>{stats.rejected}</div>
            <div style={statLabelStyles}>Rejected</div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */
        /* FILTER TABS */
        /* ═══════════════════════════════════════════════════════════ */}

        <div style={filterTabsStyles}>
          <button
            style={filterButtonStyles(filterStatus === 'all')}
            onClick={() => setFilterStatus('all')}
          >
            All Applications
          </button>
          <button
            style={filterButtonStyles(filterStatus === 'applied')}
            onClick={() => setFilterStatus('applied')}
          >
            📤 Just Applied ({stats.applied})
          </button>
          <button
            style={filterButtonStyles(filterStatus === 'in-progress')}
            onClick={() => setFilterStatus('in-progress')}
          >
            ⏳ In Progress ({stats.inProgress})
          </button>
          <button
            style={filterButtonStyles(filterStatus === 'offer')}
            onClick={() => setFilterStatus('offer')}
          >
            🎉 Offers ({stats.offers})
          </button>
          <button
            style={filterButtonStyles(filterStatus === 'rejected')}
            onClick={() => setFilterStatus('rejected')}
          >
            ✗ Rejected ({stats.rejected})
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */
        /* APPLICATIONS LIST OR EMPTY STATE */
        /* ═══════════════════════════════════════════════════════════ */}

        {filteredApplications.length === 0 ? (
          <div style={emptyStateStyles}>
            <div style={emptyStateIconStyles}>
              {filterStatus === 'offer' ? '🎯' : '📋'}
            </div>
            <h2 style={emptyStateTitleStyles}>
              {copy.emptyState.noApplications}
            </h2>
            <p style={emptyStateTextStyles}>
              {filterStatus === 'all' 
                ? 'When you apply for jobs, they\'ll appear here.' 
                : 'No applications in this category yet.'}
            </p>
          </div>
        ) : (
          <div style={applicationsContainerStyles}>
            {filteredApplications.map((app) => {
              const statusColor = getStatusColor(app.status);
              return (
                <div
                  key={app.id}
                  style={appCardStyles(app.status)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = `0 12px 24px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* HEADER */}
                  <div style={appHeaderStyles}>
                    <div style={{ flex: 1 }}>
                      <h3 style={appTitleStyles}>{app.jobTitle}</h3>
                      <p style={appCompanyStyles}>{app.company}</p>
                    </div>
                    <span style={{ fontSize: '24px' }}>{statusColor.icon}</span>
                  </div>

                  {/* STATUS BADGE */}
                  <div style={appStatusBadgeStyles(app.status)}>
                    {app.status === 'applied' && '📤 Just Applied'}
                    {app.status === 'in-progress' && '⏳ In Progress'}
                    {app.status === 'offer' && '🎉 Offer'}
                    {app.status === 'rejected' && '✗ Rejected'}
                  </div>

                  {/* DATES */}
                  <div style={appDatesStyles}>
                    <div>Applied: {new Date(app.appliedDate).toLocaleDateString()}</div>
                    <div>Last update: {new Date(app.lastUpdate).toLocaleDateString()}</div>
                  </div>

                  {/* NOTES */}
                  {app.notes && (
                    <div style={appNotesStyles}>
                      💬 {app.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RESULTS COUNT */}
        {filteredApplications.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '32px', color: themeColors.textSecondary }}>
            <p style={{ fontSize: '14px' }}>
              Showing {filteredApplications.length} of {applications.length} applications
            </p>
          </div>
        )}
      </div>
    </PageBackground>
  );
}

export default ApplicationsPage;