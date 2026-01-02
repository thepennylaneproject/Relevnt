/**
 * =============================================================================
 * useFeedback Hook
 * =============================================================================
 * 
 * React hook for submitting job feedback and tracking feedback state.
 * 
 * Features:
 * - Submit positive/negative feedback on jobs
 * - Optimistic UI updates
 * - Toast notifications with undo action
 * - Error handling with state rollback
 * 
 * =============================================================================
 */

import { useState, useCallback } from 'react'
import { usePersonas } from './usePersonas'
import { useToast } from '../components/ui/Toast'
import { recordFeedback, removeFeedbackSignal } from '../services/feedbackService'
import type { RecordFeedbackInput } from '../services/feedbackService'

// =============================================================================
// TYPES
// =============================================================================

export interface JobForFeedback {
    id: string
    title: string
    company?: string | null
    industry?: string | null
    company_size?: string | null
    remote_type?: string | null
    location?: string | null
}

export type FeedbackType = 'positive' | 'negative'

export interface UseFeedbackReturn {
    /** Submit feedback for a job */
    submitFeedback: (job: JobForFeedback, type: FeedbackType) => Promise<void>
    
    /** Recent feedback state (job_id -> feedback type) */
    recentFeedback: Map<string, FeedbackType>
    
    /** Undo feedback for a job */
    undoFeedback: (jobId: string) => Promise<void>
    
    /** Whether feedback is being submitted */
    isSubmitting: boolean
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useFeedback(): UseFeedbackReturn {
    const { activePersona } = usePersonas()
    const { showToast } = useToast()
    
    const [recentFeedback, setRecentFeedback] = useState<Map<string, FeedbackType>>(new Map())
    const [isSubmitting, setIsSubmitting] = useState(false)

    // ---------------------------------------------------------------------------
    // SUBMIT FEEDBACK
    // ---------------------------------------------------------------------------

    const submitFeedback = useCallback(async (
        job: JobForFeedback,
        type: FeedbackType
    ) => {
        // Check for active persona
        if (!activePersona) {
            showToast(
                'Set up your preferences first',
                'warning',
                5000,
                {
                    label: 'Go to Settings',
                    onClick: () => {
                        window.location.href = '/settings?section=targeting'
                    }
                }
            )
            return
        }

        // Prevent rapid clicking
        if (isSubmitting) {
            return
        }

        setIsSubmitting(true)

        // Optimistic UI update
        const previousFeedback = recentFeedback.get(job.id)
        setRecentFeedback(prev => {
            const next = new Map(prev)
            next.set(job.id, type)
            return next
        })

        try {
            const input: RecordFeedbackInput = {
                personaId: activePersona.id,
                jobId: job.id,
                type,
                attributes: {
                    industry: job.industry,
                    company_size: job.company_size,
                    remote_type: job.remote_type,
                    location: job.location,
                }
            }

            await recordFeedback(input)

            // Show success toast with undo
            const message = type === 'negative'
                ? "Got it. You'll see fewer like this."
                : "Great! Finding more like this."

            showToast(
                message,
                'success',
                3000,
                {
                    label: 'Undo',
                    onClick: () => undoFeedback(job.id)
                }
            )
        } catch (error) {
            // Revert optimistic update on error
            setRecentFeedback(prev => {
                const next = new Map(prev)
                if (previousFeedback !== undefined) {
                    next.set(job.id, previousFeedback)
                } else {
                    next.delete(job.id)
                }
                return next
            })

            console.error('Feedback submission failed:', error)
            showToast(
                'Failed to record feedback. Please try again.',
                'error',
                4000
            )
        } finally {
            // Re-enable after short delay to prevent rapid clicks
            setTimeout(() => {
                setIsSubmitting(false)
            }, 500)
        }
    }, [activePersona, recentFeedback, isSubmitting, showToast])

    // ---------------------------------------------------------------------------
    // UNDO FEEDBACK
    // ---------------------------------------------------------------------------

    const undoFeedback = useCallback(async (jobId: string) => {
        if (!activePersona) {
            return
        }

        try {
            await removeFeedbackSignal(jobId, activePersona.id)
            
            // Remove from recent feedback
            setRecentFeedback(prev => {
                const next = new Map(prev)
                next.delete(jobId)
                return next
            })

            showToast('Feedback removed', 'info', 2000)
        } catch (error) {
            console.error('Failed to undo feedback:', error)
            showToast('Failed to undo feedback', 'error', 3000)
        }
    }, [activePersona, showToast])

    // ---------------------------------------------------------------------------
    // RETURN
    // ---------------------------------------------------------------------------

    return {
        submitFeedback,
        recentFeedback,
        undoFeedback,
        isSubmitting,
    }
}
