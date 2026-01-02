/**
 * =============================================================================
 * Insights Empty State Component
 * =============================================================================
 * Shown when user doesn't have enough data for meaningful insights
 * =============================================================================
 */

import React from 'react'
import './InsightsEmptyState.css'

interface InsightsEmptyStateProps {
  currentCount: number
  requiredCount: number
}

export default function InsightsEmptyState({
  currentCount,
  requiredCount,
}: InsightsEmptyStateProps): JSX.Element {
  const progress = Math.min((currentCount / requiredCount) * 100, 100)

  return (
    <div className="insights-empty-state">
      <div className="empty-state-icon">📊</div>
      <h3>Building Your Insights</h3>
      <p className="muted">
        We need a bit more data to generate meaningful recommendations.
        Track at least {requiredCount} applications to unlock AI-powered insights.
      </p>

      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">
          {currentCount} / {requiredCount} applications
        </div>
      </div>

      <div className="empty-state-tips">
        <h4>What we'll analyze:</h4>
        <ul>
          <li>Interview rates by job type, company size, and industry</li>
          <li>Skills correlated with successful applications</li>
          <li>Timing patterns and response rates</li>
          <li>Specific improvements for your resume and targeting</li>
        </ul>
      </div>

      <div className="empty-state-cta">
        <a href="/jobs" className="btn btn-primary">
          Browse Jobs
        </a>
        <a href="/applications" className="btn btn-link">
          Log Applications
        </a>
      </div>
    </div>
  )
}
