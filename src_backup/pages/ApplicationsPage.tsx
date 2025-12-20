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

import { CSSProperties, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { copy } from '../config/i18n.config';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { UsageStats } from '../components/shared/UsageStats';
import { useRelevntColors, useStatusColors } from '../hooks';
import { useApplications, type ApplicationStatus } from '../hooks';

/**
 * ApplicationsPage Component
 */
export function ApplicationsPage(): JSX.Element {
  const { user } = useAuth();
  const colors = useRelevntColors();

  // ============================================================
  // STATE
  // ============================================================

  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');

  // ============================================================
  // BACKEND DATA HOOKS
  // ============================================================

  const { applications, loading, error: _error, statusCounts, updateStatus: _updateStatus, addNote: _addNote } = useApplications({
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const getStatusColor = (status: ApplicationStatus) => {
    const statusColors = useStatusColors(status);
    const icons = {
      applied: '📤',
      'in-progress': '⏳',
      offer: '🎉',
      rejected: '✗',
      accepted: '🎉',
      withdrawn: '↩️',
    };
    return { ...statusColors, icon: icons[status] || '•' };
  };

  const stats = {
    total: statusCounts.applied + statusCounts['in-progress'] + statusCounts.offer + statusCounts.rejected + statusCounts.accepted + statusCounts.withdrawn,
    applied: statusCounts.applied,
    inProgress: statusCounts['in-progress'],
    offers: statusCounts.offer,
    rejected: statusCounts.rejected,
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
    backgroundColor: colors.surface,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
  };

  const statNumberStyles: CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.accent,
    marginBottom: '4px',
  };

  const statLabelStyles: CSSProperties = {
    fontSize: '12px',
    color: colors.textSecondary,
    fontWeight: 500,
  };

  // ─────────────────────────────────────────────────────────
  // FILTER TABS
  // ─────────────────────────────────────────────────────────

  const filterTabsStyles: CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    borderBottom: `1px solid ${colors.border}`,
    overflow: 'auto',
    paddingBottom: '12px',
  };

  const filterButtonStyles = (isActive: boolean): CSSProperties => ({
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: isActive ? colors.accent : colors.textSecondary,
    border: 'none',
    borderBottom: isActive ? `3px solid ${colors.accent}` : 'none',
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
    color: colors.text,
    marginBottom: '4px',
  };

  const appCompanyStyles: CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: `1px solid ${colors.border}`,
  };

  const appNotesStyles: CSSProperties = {
    fontSize: '13px',
    color: colors.textSecondary,
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: colors.background === '#1A1A1A' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderRadius: '6px',
    fontStyle: 'italic',
  };

  const emptyStateStyles: CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  };

  const emptyStateIconStyles: CSSProperties = {
    fontSize: '64px',
    marginBottom: '16px',
  };

  const emptyStateTitleStyles: CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '8px',
  };

  const emptyStateTextStyles: CSSProperties = {
    fontSize: '14px',
    color: colors.textSecondary,
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
    <PageBackground>
      <div style={containerStyles}>
        {/* PAGE HEADER */}
        <PageHeader
          title="Application Tracker"
          subtitle="Track every application from submission to decision"
          textPosition="left"
        />

        {/* TOOL LINK */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <Link
            to="/application-helper"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: colors.accent,
              color: '#000',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            💬 Need help answering application questions? →
          </Link>
        </div>

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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: colors.textSecondary }}>
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
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
            {applications.map((app) => {
              const statusColor = getStatusColor(app.status);
              return (
                <div
                  key={app.id}
                  style={appCardStyles(app.status)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = `0 12px 24px ${colors.background === '#1A1A1A' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* HEADER */}
                  <div style={appHeaderStyles}>
                    <div style={{ flex: 1 }}>
                      <h3 style={appTitleStyles}>{app.job?.title || 'Unknown Position'}</h3>
                      <p style={appCompanyStyles}>{app.job?.company || 'Unknown Company'}</p>
                    </div>
                    <span style={{ fontSize: '24px' }}>{statusColor.icon}</span>
                  </div>

                  {/* STATUS BADGE */}
                  <div style={appStatusBadgeStyles(app.status)}>
                    {app.status === 'applied' && '📤 Just Applied'}
                    {app.status === 'in-progress' && '⏳ In Progress'}
                    {app.status === 'offer' && '🎉 Offer'}
                    {app.status === 'rejected' && '✗ Rejected'}
                    {app.status === 'accepted' && '✅ Accepted'}
                    {app.status === 'withdrawn' && '↩️ Withdrawn'}
                  </div>

                  {/* DATES */}
                  <div style={appDatesStyles}>
                    <div>Applied: {new Date(app.applied_date).toLocaleDateString()}</div>
                    <div>Last update: {new Date(app.last_update).toLocaleDateString()}</div>
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
        {applications.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '32px', color: colors.textSecondary }}>
            <p style={{ fontSize: '14px' }}>
              Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </PageBackground>
  );
}

export default ApplicationsPage;