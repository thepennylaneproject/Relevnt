/**
 * ============================================================================
 * JOBS PAGE (REFACTORED - PHASE 6.2)
 * ============================================================================
 * 🎯 PURPOSE: Job discovery and tracking hub with match scoring
 *
 * Features:
 * - Browse job listings from multiple sources
 * - View match scores with explanations
 * - Save/bookmark jobs
 * - Filter by salary, location, remote, match score
 * - Sort by relevance, date, salary
 *
 * Backend Integration:
 * - useJobs hook for fetching jobs from Supabase
 * - Real-time match scores
 * - Job saving/bookmarking
 *
 * Theme Integration:
 * - useRelevntColors for centralized color system
 * - PageBackground wrapper
 * - PageHeader with illustration
 * ============================================================================
 */

import { useState, CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { useRelevntColors } from '../hooks';
import { useJobs } from '../hooks';

/**
 * JobsPage Component
 */
export function JobsPage(): JSX.Element {
  const { user } = useAuth();
  const colors = useRelevntColors();

  // ============================================================
  // STATE
  // ============================================================

  const [filters, setFilters] = useState({
    minMatchScore: 0,
    minSalary: 0,
    location: '',
    remote: undefined as boolean | undefined,
    savedOnly: false,
  });

  // ============================================================
  // BACKEND DATA HOOKS
  // ============================================================

  const { jobs, loading, error, saveJob, unsaveJob, totalCount } = useJobs({
    minMatchScore: filters.minMatchScore || undefined,
    minSalary: filters.minSalary || undefined,
    location: filters.location || undefined,
    remote: filters.remote,
    savedOnly: filters.savedOnly,
  });

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleSaveJob = async (jobId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        await unsaveJob(jobId);
      } else {
        await saveJob(jobId);
      }
    } catch (err) {
      console.error('Error toggling job save:', err);
      alert('Failed to save job. Please try again.');
    }
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

  const filtersContainerStyles: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '2rem',
    padding: '1.5rem',
    background: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  };

  const filterInputStyles: CSSProperties = {
    padding: '0.75rem 1rem',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontSize: '14px',
    minWidth: '150px',
  };

  const jobsGridStyles: CSSProperties = {
    display: 'grid',
    gap: '1.5rem',
  };

  const jobCardStyles: CSSProperties = {
    padding: '1.5rem',
    background: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.2s ease',
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!user) {
    return (
      <PageBackground>
        <div style={containerStyles}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', color: colors.text }}>Please log in to view jobs</h2>
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
          title="Job Opportunities"
          subtitle="Find roles that match your skills and preferences"
          textPosition="left"
        />

        {/* CAREER DEVELOPMENT TOOLS */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}>
          <Link
            to="/skills-gap"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: colors.surface,
              color: colors.text,
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              border: `1px solid ${colors.border}`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.backgroundColor = colors.surface;
              e.currentTarget.style.color = colors.text;
            }}
          >
            📊 Analyze Skills Gap
          </Link>
          <Link
            to="/learning-paths"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: colors.surface,
              color: colors.text,
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              border: `1px solid ${colors.border}`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.backgroundColor = colors.surface;
              e.currentTarget.style.color = colors.text;
            }}
          >
            🎯 Explore Learning Paths
          </Link>
        </div>

        {/* FILTERS */}
        <div style={filtersContainerStyles}>
          <input
            type="text"
            placeholder="Location..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            style={filterInputStyles}
          />

          <input
            type="number"
            placeholder="Min Salary"
            value={filters.minSalary || ''}
            onChange={(e) => setFilters({ ...filters, minSalary: parseInt(e.target.value) || 0 })}
            style={filterInputStyles}
          />

          <select
            value={filters.minMatchScore}
            onChange={(e) => setFilters({ ...filters, minMatchScore: parseInt(e.target.value) })}
            style={filterInputStyles}
          >
            <option value={0}>All Match Scores</option>
            <option value={50}>50%+ Match</option>
            <option value={70}>70%+ Match</option>
            <option value={85}>85%+ Match</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.text }}>
            <input
              type="checkbox"
              checked={filters.remote || false}
              onChange={(e) => setFilters({ ...filters, remote: e.target.checked || undefined })}
            />
            Remote Only
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.text }}>
            <input
              type="checkbox"
              checked={filters.savedOnly}
              onChange={(e) => setFilters({ ...filters, savedOnly: e.target.checked })}
            />
            Saved Jobs Only
          </label>
        </div>

        {/* JOBS COUNT */}
        <div style={{ marginBottom: '1.5rem', color: colors.textSecondary }}>
          {loading ? 'Loading...' : `${totalCount} jobs found`}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div
            style={{
              padding: '1.5rem',
              background: colors.error + '20',
              borderRadius: '12px',
              color: colors.error,
              marginBottom: '1.5rem',
            }}
          >
            Error loading jobs: {error}
          </div>
        )}

        {/* JOBS LIST */}
        <div style={jobsGridStyles}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: colors.textSecondary }}>
              Loading jobs...
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                background: colors.surface,
                borderRadius: '12px',
              }}
            >
              <p style={{ fontSize: '1.2rem', color: colors.text, marginBottom: '0.5rem' }}>
                No jobs found
              </p>
              <p style={{ color: colors.textSecondary }}>
                Try adjusting your filters or check back later for new opportunities
              </p>
            </div>
          )}

          {!loading &&
            jobs.map((job) => (
              <div
                key={job.id}
                style={jobCardStyles}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 16px rgba(0,0,0,0.1)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: colors.text }}>
                      {job.title}
                    </h3>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: colors.primary, fontWeight: 600 }}>
                      {job.company}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem', color: colors.textSecondary }}>
                      {job.location && <span>📍 {job.location}</span>}
                      {job.remote_ok && <span>🏠 Remote</span>}
                      {(job.salary_min || job.salary_max) && (
                        <span>
                          💰 ${job.salary_min?.toLocaleString() || '?'} - ${job.salary_max?.toLocaleString() || '?'}
                        </span>
                      )}
                      {job.job_type && <span>🕐 {job.job_type}</span>}
                    </div>

                    {/* Match Score */}
                    {job.match_score !== undefined && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              color:
                                job.match_score >= 85
                                  ? colors.success
                                  : job.match_score >= 70
                                  ? colors.warning
                                  : colors.textSecondary,
                            }}
                          >
                            {job.match_score}%
                          </div>
                          <div style={{ fontSize: '0.85rem', color: colors.textSecondary }}>Match Score</div>
                        </div>
                        {job.missing_skills && job.missing_skills.length > 0 && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: colors.textSecondary }}>
                            Missing: {job.missing_skills.slice(0, 3).join(', ')}
                            {job.missing_skills.length > 3 && ` +${job.missing_skills.length - 3} more`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => handleSaveJob(job.id, job.is_saved || false)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: job.is_saved ? colors.accent : 'transparent',
                        border: `2px solid ${colors.accent}`,
                        borderRadius: '8px',
                        color: job.is_saved ? '#000' : colors.accent,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {job.is_saved ? '⭐ Saved' : '☆ Save'}
                    </button>

                    {job.apply_url && (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem 1rem',
                          background: colors.primary,
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Apply →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </PageBackground>
  );
}

export default JobsPage;
