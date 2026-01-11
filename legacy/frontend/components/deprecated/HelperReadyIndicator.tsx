/**
 * HelperReadyIndicator
 *
 * Shows whether the AI helper is ready to run based on settings configuration.
 * When not ready, shows what's missing and provides quick actions to complete setup.
 *
 * Design principle: Helper only runs when required settings are present.
 * When blocked, it helps the user complete the missing configuration.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { useHelperSettingsSummary } from '../../hooks/useHelperSettingsSummary'
import { MISSING_SETTING_LABELS } from '../../types/helper'

interface HelperReadyIndicatorProps {
  /**
   * Size variant
   */
  variant?: 'inline' | 'badge'
  /**
   * Show details about what's missing
   */
  showDetails?: boolean
  /**
   * Additional class name
   */
  className?: string
}

export function HelperReadyIndicator({
  variant = 'inline',
  showDetails = false,
  className = '',
}: HelperReadyIndicatorProps) {
  const { summary, loading } = useHelperSettingsSummary()

  if (loading) {
    return (
      <span className={`helper-ready-indicator helper-ready-indicator--loading ${className}`}>
        <span className="type-meta">Checking...</span>
      </span>
    )
  }

  if (!summary) {
    return null
  }

  const isReady = summary.settings_configured

  if (variant === 'badge') {
    return (
      <span
        className={`helper-ready-indicator helper-ready-indicator--badge ${
          isReady ? 'helper-ready-indicator--ready' : 'helper-ready-indicator--blocked'
        } ${className}`}
        title={isReady ? 'AI helper is ready' : 'AI helper needs configuration'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.125rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--type-meta-size)',
          fontWeight: 500,
          background: isReady ? 'var(--surface-success)' : 'var(--surface-warning)',
          color: isReady ? 'var(--success)' : 'var(--warning)',
        }}
      >
        {isReady ? '●' : '○'} Helper {isReady ? 'ready' : 'not ready'}
      </span>
    )
  }

  // Inline variant
  if (isReady) {
    return (
      <span className={`helper-ready-indicator helper-ready-indicator--ready ${className}`}>
        <span className="type-meta" style={{ color: 'var(--success)' }}>
          AI helper ready
        </span>
      </span>
    )
  }

  // Not ready - show what's missing
  const missingLabels = (summary.missing ?? [])
    .map(key => MISSING_SETTING_LABELS[key])
    .filter(Boolean)

  return (
    <span className={`helper-ready-indicator helper-ready-indicator--blocked ${className}`}>
      <span className="type-meta" style={{ color: 'var(--warning)' }}>
        Helper not ready yet
        {showDetails && missingLabels.length > 0 && (
          <>
            {' - Missing: '}
            {missingLabels.join(', ')}
          </>
        )}
      </span>
      {showDetails && (
        <Link
          to="/settings#search-strategy"
          className="type-meta"
          style={{ marginLeft: '0.5rem', textDecoration: 'underline', color: 'var(--accent)' }}
        >
          Complete setup
        </Link>
      )}
    </span>
  )
}
