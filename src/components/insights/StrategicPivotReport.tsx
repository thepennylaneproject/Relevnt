/**
 * =============================================================================
 * Strategic Pivot Report Component
 * =============================================================================
 * Displays AI-driven insights about application patterns with actionable
 * recommendations to improve interview rates.
 * =============================================================================
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { StoredReport } from '../../services/strategicInsights.service'
import type { Recommendation } from '../../types/ai-responses.types'
import RecommendationCard from './RecommendationCard'
import { generateDeepLink } from '../../services/strategicInsights.service'
import './StrategicPivotReport.css'

interface StrategicPivotReportProps {
  report: StoredReport
  onApplyRecommendation: (recommendationId: string) => Promise<void>
  onDismissRecommendation: (recommendationId: string) => Promise<void>
}

export default function StrategicPivotReport({
  report,
  onApplyRecommendation,
  onDismissRecommendation,
}: StrategicPivotReportProps): JSX.Element {
  const navigate = useNavigate()
  const insights = report.insights || {}
  const overview = insights.overview || {}
  const patterns = insights.patterns || []
  const recommendations = (report.recommendations || []) as Recommendation[]
  const appliedIds = report.recommendations_applied || []
  const dismissedIds = report.recommendations_dismissed || []

  // Filter out dismissed recommendations
  const activeRecommendations = recommendations.filter(
    (rec) => !dismissedIds.includes(rec.id)
  )

  // Calculate week-over-week change
  const currentRate = report.interview_rate || 0
  const previousRate = overview.previousInterviewRate
  const trend = overview.trend || 'stable'

  const getTrendIcon = () => {
    if (trend === 'improving') return '📈'
    if (trend === 'declining') return '📉'
    return '➡️'
  }

  const getTrendColor = () => {
    if (trend === 'improving') return 'var(--color-success)'
    if (trend === 'declining') return 'var(--color-error)'
    return 'var(--color-text-muted)'
  }

  const handleRecommendationAction = async (
    rec: Recommendation,
    action: 'apply' | 'dismiss'
  ) => {
    if (action === 'apply') {
      await onApplyRecommendation(rec.id)
      // Navigate to linked section if available
      if (rec.linkedSection) {
        const link = generateDeepLink(rec.linkedSection)
        navigate(link)
      }
    } else {
      await onDismissRecommendation(rec.id)
    }
  }

  return (
    <div className="strategic-pivot-report">
      {/* Header */}
      <div className="report-header">
        <div className="report-title">
          <h2>Strategic Pivot Report</h2>
          <p className="report-period muted">
            {new Date(report.period_start).toLocaleDateString()} -{' '}
            {new Date(report.period_end).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="report-overview">
        <div className="stat-card">
          <div className="stat-value">{report.total_applications}</div>
          <div className="stat-label">Applications</div>
        </div>

   
        <div className="stat-card highlighted">
          <div className="stat-value">
            {currentRate.toFixed(1)}%
            <span className="trend-indicator" style={{ color: getTrendColor() }}>
              {getTrendIcon()}
            </span>
          </div>
          <div className="stat-label">Interview Rate</div>
          {previousRate !== undefined && (
            <div className="stat-change muted">
              {currentRate > previousRate ? '+' : ''}
              {(currentRate - previousRate).toFixed(1)}% from last period
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-value">{report.total_interviews}</div>
          <div className="stat-label">Interviews</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{report.total_offers}</div>
          <div className="stat-label">Offers</div>
        </div>
      </div>

      {/* Key Findings */}
      {patterns.length > 0 && (
        <section className="report-section">
          <h3>Key Findings</h3>
          <div className="findings-grid">
            {patterns.slice(0, 3).map((pattern: any, idx: number) => (
              <div
                key={idx}
                className={`finding-card finding-${pattern.impact || 'neutral'}`}
              >
                <div className="finding-pattern">{pattern.pattern}</div>
                <div className="finding-description muted">{pattern.description}</div>
                {pattern.statistic && (
                  <div className="finding-stat">{pattern.statistic}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {activeRecommendations.length > 0 && (
        <section className="report-section">
          <h3>
            Recommendations
            <span className="muted"> — {activeRecommendations.length} actions</span>
          </h3>
          <div className="recommendations-list">
            {activeRecommendations
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              })
              .map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  isApplied={appliedIds.includes(rec.id)}
                  onApply={() => handleRecommendationAction(rec, 'apply')}
                  onDismiss={() => handleRecommendationAction(rec, 'dismiss')}
                />
              ))}
          </div>
        </section>
      )}

      {activeRecommendations.length === 0 && (
        <div className="empty-state">
          <p>✨ Great work! No new recommendations at this time.</p>
          <p className="muted">Keep up your current application strategy.</p>
        </div>
      )}
    </div>
  )
}
