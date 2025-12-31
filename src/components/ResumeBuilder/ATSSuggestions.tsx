// src/components/ResumeBuilder/ATSSuggestions.tsx
// Prioritized, actionable ATS improvement suggestions

import React, { useState } from 'react'
import { Icon, IconName } from '../ui/Icon'
import type { ATSSuggestion } from './ATSScoreCard'

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    suggestions: ATSSuggestion[]
    onApplyFix?: (suggestion: ATSSuggestion) => void
    onDismiss?: (suggestionId: string) => void
}

// ============================================================================
// HELPERS
// ============================================================================

function getCategoryIcon(category: ATSSuggestion['category']): IconName {
    switch (category) {
        case 'keywords': return 'key'
        case 'formatting': return 'scroll'
        case 'content': return 'stars'
        case 'structure': return 'lighthouse'
        default: return 'compass'
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ATSSuggestions: React.FC<Props> = ({ suggestions, onApplyFix, onDismiss }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    // Sort by priority
    const sortedSuggestions = [...suggestions]
        .filter(s => !dismissedIds.has(s.id))
        .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]))
        onDismiss?.(id)
    }

    if (sortedSuggestions.length === 0) {
        return (
            <div className="ats-suggestions ats-suggestions--empty">
                <Icon name="stars" size="md" />
                <p className="text-sm font-semibold">Looking good! 🎉</p>
                <p className="text-xs muted">No more suggestions at this time.</p>
            </div>
        )
    }

    return (
        <div className="ats-suggestions">
            <div className="ats-suggestions-header">
                <h3 className="text-sm font-semibold">Improvement Suggestions</h3>
            </div>

            <div className="ats-suggestions-list">
                {sortedSuggestions.map((suggestion) => {
                    const isExpanded = expandedId === suggestion.id
                    return (
                        <div
                            key={suggestion.id}
                            className={`ats-suggestion ${isExpanded ? 'ats-suggestion--expanded' : ''}`}
                        >
                            <button
                                type="button"
                                className="ats-suggestion-header"
                                onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                            >
                                <div className="ats-suggestion-icon">
                                    <Icon name={getCategoryIcon(suggestion.category)} size="sm" />
                                </div>
                                <div className="ats-suggestion-main">
                                    <span className="ats-suggestion-title text-sm font-medium">
                                        {suggestion.title}
                                    </span>
                                </div>
                                <span className={`ats-suggestion-chevron ${isExpanded ? 'rotated' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {isExpanded && (
                                <div className="ats-suggestion-body">
                                    <p className="text-xs" style={{ marginBottom: 12 }}>
                                        {suggestion.description}
                                    </p>
                                    <div className="ats-suggestion-impact">
                                        <Icon name="lighthouse" size="sm" />
                                        <span className="text-xs muted">
                                            <strong>Impact:</strong> {suggestion.impact}
                                        </span>
                                    </div>
                                    <div className="ats-suggestion-actions">
                                        {onApplyFix && suggestion.priority !== 'low' && (
                                            <button
                                                type="button"
                                                onClick={() => onApplyFix(suggestion)}
                                                className="primary-button button-xs"
                                            >
                                                <Icon name="stars" size="sm" />
                                                Apply Fix
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDismiss(suggestion.id)}
                                            className="ghost-button button-xs"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <p className="text-xs muted" style={{ marginTop: 12, textAlign: 'center' }}>
                💡 Addressing high-priority items can increase your ATS score by 15-25 points
            </p>
        </div>
    )
}

export default ATSSuggestions
