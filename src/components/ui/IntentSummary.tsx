/**
 * IntentSummary
 *
 * Displays a concise summary of the user's job search intent:
 * - Active persona name/title
 * - Target seniority levels
 * - Remote/onsite preference
 * - Primary locations
 * - Minimum salary and sponsorship rule
 *
 * This makes the "intent" explicit, inspectable, and editable.
 * Matching feels like a transparent lens, not a black box.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { useHelperSettingsSummary } from '../../hooks/useHelperSettingsSummary'

interface IntentSummaryProps {
  /**
   * Variant controls the display style:
   * - 'compact': Single-line inline display for headers
   * - 'detailed': Multi-line display with labels
   */
  variant?: 'compact' | 'detailed'
  /**
   * Show link to settings when intent is incomplete
   */
  showSettingsLink?: boolean
  /**
   * Additional class name
   */
  className?: string
}

export function IntentSummary({
  variant = 'compact',
  showSettingsLink = true,
  className = '',
}: IntentSummaryProps) {
  const { summary, loading } = useHelperSettingsSummary()

  if (loading) {
    return (
      <div className={`intent-summary intent-summary--loading ${className}`}>
        <span className="type-meta">Loading preferences...</span>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  // Check if settings are configured
  const isConfigured = summary.settings_configured
  const personaName = summary.persona.title || 'No persona selected'

  // Build the summary parts
  const parts: string[] = []

  // Seniority levels
  const seniority = summary.hard_constraints.seniority_levels
  if (seniority.length > 0) {
    parts.push(seniority.join(' / '))
  }

  // Remote preference
  const remote = summary.hard_constraints.remote_preference
  if (remote === 'remote') {
    parts.push('Remote only')
  } else if (remote === 'hybrid') {
    parts.push('Hybrid')
  } else if (remote === 'onsite') {
    parts.push('On-site')
  }

  // Minimum salary
  if (summary.hard_constraints.min_salary !== null) {
    const salaryK = Math.round(summary.hard_constraints.min_salary / 1000)
    parts.push(`$${salaryK}K+`)
  }

  // Sponsorship
  if (summary.hard_constraints.needs_sponsorship === true) {
    parts.push('Sponsorship required')
  }

  // Compact variant - single line
  if (variant === 'compact') {
    if (!isConfigured) {
      return (
        <div className={`intent-summary intent-summary--incomplete ${className}`}>
          <span className="type-meta" style={{ opacity: 0.7 }}>
            Search preferences not set
            {showSettingsLink && (
              <>
                {' · '}
                <Link to="/settings#search-strategy" style={{ textDecoration: 'underline' }}>
                  Configure
                </Link>
              </>
            )}
          </span>
        </div>
      )
    }

    const summaryText = parts.length > 0 ? parts.join(' · ') : 'All roles'

    return (
      <div className={`intent-summary intent-summary--compact ${className}`}>
        <span className="type-meta" style={{ opacity: 0.8 }}>
          <strong>{personaName}:</strong> {summaryText}
          {showSettingsLink && (
            <>
              {' · '}
              <Link to="/settings#search-strategy" style={{ textDecoration: 'underline', opacity: 0.7 }}>
                Edit
              </Link>
            </>
          )}
        </span>
      </div>
    )
  }

  // Detailed variant - multi-line with labels
  return (
    <div className={`intent-summary intent-summary--detailed ${className}`}>
      <h4 className="type-label" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
        Your Search Intent
      </h4>

      {!isConfigured && (
        <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'var(--surface-warning)', borderRadius: 'var(--radius-sm)' }}>
          <span className="type-meta">
            Some preferences are not set. Your matches will be broader.
            {showSettingsLink && (
              <>
                {' '}
                <Link to="/settings#search-strategy" style={{ textDecoration: 'underline' }}>
                  Complete setup
                </Link>
              </>
            )}
          </span>
        </div>
      )}

      <dl className="intent-summary__details" style={{ display: 'grid', gap: '0.25rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <dt style={{ color: 'var(--text-secondary)', minWidth: '6rem' }}>Persona:</dt>
          <dd style={{ fontWeight: 500 }}>{personaName}</dd>
        </div>

        {seniority.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <dt style={{ color: 'var(--text-secondary)', minWidth: '6rem' }}>Seniority:</dt>
            <dd>{seniority.join(', ')}</dd>
          </div>
        )}

        {remote && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <dt style={{ color: 'var(--text-secondary)', minWidth: '6rem' }}>Work style:</dt>
            <dd>{remote === 'remote' ? 'Remote only' : remote === 'hybrid' ? 'Hybrid' : 'On-site'}</dd>
          </div>
        )}

        {summary.hard_constraints.min_salary !== null && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <dt style={{ color: 'var(--text-secondary)', minWidth: '6rem' }}>Min salary:</dt>
            <dd>${Math.round(summary.hard_constraints.min_salary / 1000)}K+</dd>
          </div>
        )}

        {summary.hard_constraints.needs_sponsorship !== null && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <dt style={{ color: 'var(--text-secondary)', minWidth: '6rem' }}>Sponsorship:</dt>
            <dd>{summary.hard_constraints.needs_sponsorship ? 'Required' : 'Not required'}</dd>
          </div>
        )}

        {summary.soft_preferences.skill_emphasis.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <dt style={{ color: 'var(--text-secondary)', minWidth: '6rem' }}>Skills:</dt>
            <dd>{summary.soft_preferences.skill_emphasis.slice(0, 5).join(', ')}</dd>
          </div>
        )}
      </dl>

      {showSettingsLink && isConfigured && (
        <div style={{ marginTop: '0.75rem' }}>
          <Link to="/settings#search-strategy" className="type-meta" style={{ textDecoration: 'underline', opacity: 0.7 }}>
            Edit preferences
          </Link>
        </div>
      )}
    </div>
  )
}

/**
 * Builds a match reason string for a job based on current settings.
 * Used to show why a job is included in the results.
 */
export function buildMatchReason(
  job: {
    remote_type?: string | null
    salary_min?: number | null
    salary_max?: number | null
    match_score?: number | null
  },
  settings: {
    seniority_levels: string[]
    remote_preference: string | null
    min_salary: number | null
  }
): string | null {
  const parts: string[] = []

  // Check seniority match (simplified - would need job seniority data)
  if (settings.seniority_levels.length > 0) {
    // For now, just show the configured seniority levels
    parts.push(settings.seniority_levels[0])
  }

  // Check remote match
  if (settings.remote_preference === 'remote' && job.remote_type === 'remote') {
    parts.push('Remote')
  } else if (settings.remote_preference === 'hybrid' && job.remote_type === 'hybrid') {
    parts.push('Hybrid')
  }

  // Check salary match
  const jobSalary = job.salary_max || job.salary_min
  if (settings.min_salary !== null && jobSalary && jobSalary >= settings.min_salary) {
    const salaryK = Math.round(jobSalary / 1000)
    parts.push(`$${salaryK}K`)
  }

  // Include match score if available
  if (job.match_score !== null && job.match_score !== undefined && job.match_score > 0) {
    parts.push(`${Math.round(job.match_score)}% match`)
  }

  if (parts.length === 0) {
    return null
  }

  return `Matches: ${parts.join(' · ')}`
}
