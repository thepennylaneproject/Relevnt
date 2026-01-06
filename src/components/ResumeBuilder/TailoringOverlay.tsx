// src/components/ResumeBuilder/TailoringOverlay.tsx
/**
 * Sidebar overlay that displays AI-generated resume tailoring suggestions
 * for a specific job. Shows job context and actionable suggestions.
 */

import { useState } from 'react'
import type { TailoringContext, TailoringSuggestion } from '../../types/tailoring'
import { Icon } from '../ui/Icon'

interface TailoringOverlayProps {
  context: TailoringContext
  onAcceptSuggestion: (suggestion: TailoringSuggestion) => void
  onDismissSuggestion: (suggestionId: string) => void
  onClose: () => void
}

export function TailoringOverlay({
  context,
  onAcceptSuggestion,
  onDismissSuggestion,
  onClose,
}: TailoringOverlayProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visibleSuggestions = context.suggestions.filter(
    (s) => !dismissedIds.has(s.id)
  )

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id))
    onDismissSuggestion(id)
  }

  if (visibleSuggestions.length === 0) {
    return null
  }

  return (
    <div className="tailoring-overlay">
      {/* Header */}
      <div className="tailoring-overlay__header">
        <div className="tailoring-overlay__job-info">
          <h3 className="tailoring-overlay__title">Tailoring for</h3>
          <p className="tailoring-overlay__job-title">{context.jobTitle}</p>
          <p className="tailoring-overlay__company">{context.company}</p>
        </div>
        <button
          onClick={onClose}
          className="tailoring-overlay__close"
          aria-label="Close suggestions"
        >
          <Icon name="x" size="sm" />
        </button>
      </div>

      {/* Suggestions List */}
      <div className="tailoring-overlay__content">
        <h4 className="tailoring-overlay__suggestions-title">
          Suggested Tweaks ({visibleSuggestions.length})
        </h4>

        {visibleSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => onAcceptSuggestion(suggestion)}
            onDismiss={() => handleDismiss(suggestion.id)}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Suggestion Card Component
// =============================================================================

interface SuggestionCardProps {
  suggestion: TailoringSuggestion
  onAccept: () => void
  onDismiss: () => void
}

function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  return (
    <div className="suggestion-card">
      {/* Reasoning */}
      <p className="suggestion-card__reasoning">
        <Icon name="wand" size="sm" />
        {suggestion.reasoning}
      </p>

      {/* Text Comparison */}
      <div className="suggestion-card__text">
        {/* Current text (strikethrough) */}
        <div className="suggestion-card__current">
          <span className="suggestion-card__label">Current:</span>
          <p>{truncateText(suggestion.currentText, 100)}</p>
        </div>

        {/* Suggested text (highlighted) */}
        <div className="suggestion-card__suggested">
          <span className="suggestion-card__label">Suggested:</span>
          <p>{suggestion.suggestedText}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="suggestion-card__actions">
        <button onClick={onDismiss} className="suggestion-card__btn-dismiss">
          Dismiss
        </button>
        <button onClick={onAccept} className="suggestion-card__btn-apply">
          <Icon name="check" size="sm" />
          Apply
        </button>
      </div>

      {/* Confidence Indicator (if low) */}
      {suggestion.confidence < 0.8 && (
        <div className="suggestion-card__confidence">
          <Icon name="alert-triangle" size="xs" />
          Confidence: {Math.round(suggestion.confidence * 100)}%
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
