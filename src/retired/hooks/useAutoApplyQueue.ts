// src/hooks/useAutoApplyQueue.ts
/**
 * Hook for fetching and managing auto-apply queue items
 * 
 * Features:
 * - Real-time queue updates via Supabase subscriptions
 * - Loading and error states
 * - Actions to mark items as submitted/failed
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { analytics } from '../lib/analytics'

export type QueueStatus =
    | 'pending'
    | 'processing'
    | 'ready_to_submit'
    | 'requires_review'
    | 'completed'
    | 'failed'
    | 'cancelled'

export type QueueItem = {
    id: string
    user_id: string
    persona_id: string | null
    job_id: string
    rule_id: string
    status: QueueStatus
    priority: number
    metadata: any
    created_at: string
    scheduled_for: string
    processed_at: string | null
    job: {
        id: string
        title: string
        company: string
        location: string | null
        external_url: string | null
        salary_min: number | null
        salary_max: number | null
        remote_type: string | null
    }
}

export type ArtifactType = {
    id: string
    artifact_type: 'resume' | 'cover_letter' | 'questionnaire'
    content: string
    format: string
    generated_at: string
}

export function useAutoApplyQueue() {
    const { user } = useAuth()
    const [queueItems, setQueueItems] = useState<QueueItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Fetch queue items
    const fetchQueueItems = useCallback(async () => {
        if (!user) {
            setQueueItems([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('auto_apply_queue')
                .select(`
                    *,
                    jobs(
                        id,
                        title,
                        company,
                        location,
                        external_url,
                        salary_min,
                        salary_max,
                        remote_type
                    )
                `)
                .eq('user_id', user.id)
                .in('status', ['pending', 'processing', 'ready_to_submit', 'requires_review'])
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            setQueueItems((data as any) || [])
        } catch (err) {
            console.error('Error fetching queue items:', err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }, [user])

    // Fetch artifacts for a specific job
    const fetchArtifacts = useCallback(
        async (jobId: string): Promise<ArtifactType[]> => {
            if (!user) return []

            try {
                const { data, error: fetchError } = await supabase
                    .from('job_application_artifacts')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('job_id', jobId)
                    .order('generated_at', { ascending: false })

                if (fetchError) throw fetchError

                return (data as any) || []
            } catch (err) {
                console.error('Error fetching artifacts:', err)
                return []
            }
        },
        [user]
    )

    // Mark item as submitted
    const markSubmitted = useCallback(
        async (queueItemId: string, notes?: string, screenshotUrl?: string) => {
            if (!user) throw new Error('Not authenticated')

            try {
                // Track opening link event
                analytics.track('auto_apply_marked_submitted', {
                    queue_item_id: queueItemId,
                    has_proof: !!(notes || screenshotUrl),
                })

                const { data: session } = await supabase.auth.getSession()
                const accessToken = session?.session?.access_token

                const response = await fetch('/.netlify/functions/auto_apply_mark_submitted', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        queue_item_id: queueItemId,
                        notes,
                        screenshot_url: screenshotUrl,
                    }),
                })

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to mark as submitted')
                }

                // Refresh queue items
                await fetchQueueItems()

                return result
            } catch (err) {
                console.error('Error marking as submitted:', err)
                throw err
            }
        },
        [user, fetchQueueItems]
    )

    // Mark item as failed
    const markFailed = useCallback(
        async (queueItemId: string, errorMessage: string, shouldRetry: boolean = false) => {
            if (!user) throw new Error('Not authenticated')

            try {
                analytics.track('auto_apply_marked_failed', {
                    queue_item_id: queueItemId,
                    should_retry: shouldRetry,
                })

                const { data: session } = await supabase.auth.getSession()
                const accessToken = session?.session?.access_token

                const response = await fetch('/.netlify/functions/auto_apply_mark_failed', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        queue_item_id: queueItemId,
                        error_message: errorMessage,
                        should_retry: shouldRetry,
                    }),
                })

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to mark as failed')
                }

                // Refresh queue items
                await fetchQueueItems()

                return result
            } catch (err) {
                console.error('Error marking as failed:', err)
                throw err
            }
        },
        [user, fetchQueueItems]
    )

    // Track link opened
    const trackLinkOpened = useCallback(
        (queueItemId: string, jobId: string) => {
            analytics.track('auto_apply_opened_link', {
                queue_item_id: queueItemId,
                job_id: jobId,
            })
        },
        []
    )

    // Initial fetch
    useEffect(() => {
        fetchQueueItems()
    }, [fetchQueueItems])

    // Set up real-time subscription
    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel('auto_apply_queue_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'auto_apply_queue',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // Refresh queue items on any change
                    fetchQueueItems()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, fetchQueueItems])

    return {
        queueItems,
        loading,
        error,
        fetchArtifacts,
        markSubmitted,
        markFailed,
        trackLinkOpened,
        refresh: fetchQueueItems,
    }
}
