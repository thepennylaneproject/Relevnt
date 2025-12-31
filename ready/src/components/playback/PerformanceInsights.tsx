/**
 * PerformanceInsights - Ready App
 * 
 * Dashboard component showing performance trends and readiness.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { usePerformance } from '../../hooks/usePerformance'
import { Icon } from '../ui/Icon'

export function PerformanceInsights() {
    const { performance, loading, error } = usePerformance()

    if (loading) {
        return (
            <div className="surface-card p-6 rounded-2xl animate-pulse">
                <div className="h-6 w-48 bg-surface rounded mb-4" />
                <div className="h-20 w-full bg-surface rounded" />
            </div>
        )
    }

    if (error || !performance) {
        return null
    }

    const { practice, skillGaps, assessments, readiness, whatsWorking } = performance

    return (
        <section className="performance-insights surface-card p-6 rounded-2xl border border-border/50">
            <div className="insights-header">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Icon name="stars" size="sm" className="text-accent" />
                        Your Progress
                    </h2>
                    <p className="text-xs text-muted">
                        Tracking your interview readiness journey
                    </p>
                </div>
                <Link to="/playback" className="text-xs font-bold text-accent hover:underline">
                    View Details
                </Link>
            </div>

            {/* Readiness Score */}
            <div className={`readiness-card ${readiness.isReady ? 'ready' : ''}`}>
                <div className="readiness-score">
                    <span className="score-value">{readiness.currentScore}</span>
                    <span className="score-label">Readiness</span>
                </div>
                <div className="readiness-info">
                    <span className="readiness-status">
                        {readiness.isReady ? '🎉 Interview Ready!' : 'Building momentum...'}
                    </span>
                    <span className="readiness-trend">
                        {readiness.trend === 'improving' && '📈 Improving'}
                        {readiness.trend === 'stable' && '➡️ Stable'}
                        {readiness.trend === 'declining' && '⚠️ Needs attention'}
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                <div className="metric-item">
                    <span className="metric-value">{practice.completedSessions}</span>
                    <span className="metric-label">Practice Sessions</span>
                    {practice.averageScore > 0 && (
                        <span className="metric-detail">Avg: {practice.averageScore}/10</span>
                    )}
                </div>
                <div className="metric-item">
                    <span className="metric-value">{skillGaps.addressedGaps}/{skillGaps.totalGaps}</span>
                    <span className="metric-label">Skills Addressed</span>
                    {skillGaps.totalGaps > 0 && (
                        <span className="metric-detail">{skillGaps.progressPercent}% complete</span>
                    )}
                </div>
                <div className="metric-item">
                    <span className="metric-value">{assessments.assessmentsCompleted}</span>
                    <span className="metric-label">Assessments</span>
                    <span className="metric-detail">LinkedIn, Portfolio</span>
                </div>
            </div>

            {/* What's Working */}
            {whatsWorking.length > 0 && (
                <div className="whats-working">
                    <span className="section-label">What's Working</span>
                    <div className="working-tags">
                        {whatsWorking.map((item, i) => (
                            <span key={i} className="working-tag">
                                <Icon name="check" size="sm" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <style>{performanceInsightsStyles}</style>
        </section>
    )
}

const performanceInsightsStyles = `
.performance-insights {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.readiness-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem;
  background: var(--surface);
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
}

.readiness-card.ready {
  border-color: #A8D5BA;
  background: rgba(168, 213, 186, 0.05);
}

.readiness-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 80px;
  background: var(--color-accent);
  color: var(--bg);
  border-radius: 50%;
}

.readiness-card.ready .readiness-score {
  background: #A8D5BA;
}

.score-value {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
}

.score-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.readiness-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.readiness-status {
  font-weight: 700;
  font-size: 1rem;
}

.readiness-trend {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-align: center;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-accent);
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.metric-detail {
  font-size: 0.625rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.section-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.whats-working {
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.working-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.working-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: rgba(168, 213, 186, 0.1);
  color: #A8D5BA;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}
`;
