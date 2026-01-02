/**
 * =============================================================================
 * Recommendation Card Component
 * =============================================================================
 * Individual actionable recommendation with priority, type, and quick actions
 * =============================================================================
 */

import React from 'react'
import type { Recommendation } from '../../types/ai-responses.types'
import './RecommendationCard.css'

interface RecommendationCardProps {
  recommendation: Recommendation
  isApplied: boolean
  onApply: () => void
  onDismiss: () => void
}

export default function RecommendationCard({
  recommendation,
  isApplied,
  onApply,
  onDismiss,
}: RecommendationCardProps): JSX.Element {
  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'skill_gap':
        return '🎯'
      case 'targeting':
        return '🔍'
      case 'resume':
        return '📄'
      case 'strategy':
        return '💡'
      case 'timing':
        return '⏰'
      default:
        return '📌'
    }
  }

  const getTypeLabel = (type: Recommendation['type']) => {
    switch (type) {
      case 'skill_gap':
        return 'Skill Gap'
      case 'targeting':
        return 'Targeting'
      case 'resume':
        return 'Resume'
      case 'strategy':
        return 'Strategy'
      case 'timing':
        return 'Timing'
      default:
        return 'General'
    }
  }

  const priorityLabel =
    recommendation.priority.charAt(0).toUpperCase() +
    recommendation.priority.slice(1).toLowerCase()

  return (
    <div className={`recommendation-card priority-${recommendation.priority}`}>
      <div className="recommendation-header">
        <div className="recommendation-type">
          <span className="type-icon">{getTypeIcon(recommendation.type)}</span>
          <span className="type-label">{getTypeLabel(recommendation.type)}</span>
        </div>
        <span className={`priority-badge priority-${recommendation.priority}`}>
          {priorityLabel}
        </span>
      </div>

      <h4 className="recommendation-title">{recommendation.title}</h4>
      <p className="recommendation-description muted">{recommendation.description}</p>

      <div className="recommendation-action muted">
        <strong>Action:</strong> {recommendation.action}
      </div>

      {recommendation.confidence && (
        <div className="recommendation-confidence muted">
          {recommendation.confidence}% confidence
        </div>
      )}

      <div className="recommendation-actions">
        {!isApplied ? (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={onApply}
              title={recommendation.linkedSectionLabel || 'Apply recommendation'}
            >
              {recommendation.linkedSectionLabel || 'Apply'}
            </button>
            <button className="btn btn-link btn-sm" onClick={onDismiss}>
              Dismiss
            </button>
          </>
        ) : (
          <div className="applied-indicator">
            <span className="check-icon">✓</span> Applied
          </div>
        )}
      </div>
    </div>
  )
}
