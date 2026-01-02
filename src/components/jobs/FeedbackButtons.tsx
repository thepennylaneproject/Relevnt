/**
 * =============================================================================
 * FeedbackButtons Component
 * =============================================================================
 * 
 * Inline feedback buttons for job cards (thumbs up/down).
 * 
 * Features:
 * - ✗ (Not for me) and ✓ (Great match) buttons
 * - Active state indication
 * - Accessible with ARIA labels
 * - Mobile-friendly touch targets
 * 
 * =============================================================================
 */

import React from 'react'
import { useFeedback, type JobForFeedback } from '../../hooks/useFeedback'
import { Icon } from '../ui/Icon'

// =============================================================================
// TYPES
// =============================================================================

export interface FeedbackButtonsProps {
    /** Job to provide feedback on */
    job: JobForFeedback
    
    /** Optional className for positioning */
    className?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FeedbackButtons({ job, className = '' }: FeedbackButtonsProps) {
    const { submitFeedback, recentFeedback, isSubmitting } = useFeedback()
    
    const currentFeedback = recentFeedback.get(job.id)
    const isNegative = currentFeedback === 'negative'
    const isPositive = currentFeedback === 'positive'

    return (
        <div className={`feedback-buttons ${className}`}>
            {/* Not for me button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    submitFeedback(job, 'negative')
                }}
                disabled={isSubmitting}
                className={`feedback-button feedback-button--negative ${isNegative ? 'active' : ''}`}
                aria-label="Not relevant to me"
                title="Not for me"
            >
                <Icon name="x" size="sm" hideAccent />
            </button>

            {/* Great match button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    submitFeedback(job, 'positive')
                }}
                disabled={isSubmitting}
                className={`feedback-button feedback-button--positive ${isPositive ? 'active' : ''}`}
                aria-label="Great match for me"
                title="Great match"
            >
                <Icon name="check" size="sm" hideAccent />
            </button>

            <style>{feedbackButtonsStyles}</style>
        </div>
    )
}

// =============================================================================
// STYLES
// =============================================================================

const feedbackButtonsStyles = `
.feedback-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

.feedback-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    padding: 0;
    border-radius: 50%;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-ink-tertiary);
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.6;
}

.feedback-button:hover:not(:disabled) {
    opacity: 1;
    background: var(--color-bg-alt);
}

.feedback-button:disabled {
    cursor: not-allowed;
    opacity: 0.3;
}

/* Negative button states */
.feedback-button--negative.active {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--color-error);
    opacity: 1;
}

.feedback-button--negative:hover:not(:disabled):not(.active) {
    background: rgba(239, 68, 68, 0.05);
}

/* Positive button states */
.feedback-button--positive.active {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: var(--color-success);
    opacity: 1;
}

.feedback-button--positive:hover:not(:disabled):not(.active) {
    background: rgba(34, 197, 94, 0.05);
}

/* Mobile: Larger touch targets */
@media (max-width: 768px) {
    .feedback-button {
        width: 44px;
        height: 44px;
        min-width: 44px;
        min-height: 44px;
    }
}
`

export default FeedbackButtons
