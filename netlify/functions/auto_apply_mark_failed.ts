// netlify/functions/auto_apply_mark_failed.ts
/**
 * AUTO-APPLY MARK FAILED ENDPOINT
 * 
 * Allows users to mark a queue item as failed if they encounter
 * issues during manual submission.
 * 
 * POST /.netlify/functions/auto_apply_mark_failed
 * 
 * Request Body:
 * {
 *   queue_item_id: string,      // UUID of auto_apply_queue entry
 *   error_message: string,       // User-provided reason
 *   should_retry?: boolean       // If true, re-queue for retry (default: false)
 * }
 * 
 * Security:
 * - Requires JWT authentication
 * - Validates queue item belongs to authenticated user
 * 
 * State Transitions:
 * - ready_to_submit → failed
 * - requires_review → failed
 * - failed → pending (if should_retry && attempt_count < 3)
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { requireAuth } from './utils/auth'

type MarkFailedRequest = {
    queue_item_id: string
    error_message: string
    should_retry?: boolean
}

const MAX_RETRIES = 3

export const handler: Handler = async (event) => {
    try {
        // Only allow POST
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
            }
        }

        // Require authentication
        const user = await requireAuth(event)
        const userId = user.id

        // Parse request body
        const body: MarkFailedRequest = event.body ? JSON.parse(event.body) : {}
        const { queue_item_id, error_message, should_retry = false } = body

        if (!queue_item_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'queue_item_id is required' }),
            }
        }

        if (!error_message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'error_message is required' }),
            }
        }

        const supabase = createAdminClient()

        // 1. Fetch the queue item and validate ownership
        const { data: queueItem, error: queueError } = await supabase
            .from('auto_apply_queue')
            .select(`
                *,
                jobs(*)
            `)
            .eq('id', queue_item_id)
            .maybeSingle()

        if (queueError) {
            console.error('Error fetching queue item:', queueError)
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch queue item' }),
            }
        }

        if (!queueItem) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Queue item not found' }),
            }
        }

        // Validate ownership
        if (queueItem.user_id !== userId) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Forbidden: Queue item belongs to another user' }),
            }
        }

        const currentAttemptCount = queueItem.metadata?.attempt_count || 0
        const newAttemptCount = currentAttemptCount + 1

        // 2. Determine if we should retry
        const canRetry = should_retry && newAttemptCount < MAX_RETRIES
        const nextStatus = canRetry ? 'pending' : 'failed'

        // Calculate exponential backoff for retry: 2^attempt_count * 15 minutes
        let scheduledFor = new Date()
        if (canRetry) {
            const delayMinutes = Math.pow(2, newAttemptCount) * 15
            scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000)
        }

        // 3. Update queue item
        const { error: queueUpdateError } = await supabase
            .from('auto_apply_queue')
            .update({
                status: nextStatus,
                processed_at: new Date().toISOString(),
                scheduled_for: canRetry ? scheduledFor.toISOString() : queueItem.scheduled_for,
                metadata: {
                    ...(queueItem.metadata || {}),
                    attempt_count: newAttemptCount,
                    last_error: error_message,
                    last_error_at: new Date().toISOString(),
                    retry_scheduled_for: canRetry ? scheduledFor.toISOString() : null,
                },
            })
            .eq('id', queue_item_id)

        if (queueUpdateError) {
            console.error('Error updating queue item:', queueUpdateError)
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to update queue item' }),
            }
        }

        // 4. Create/update application record
        const job = Array.isArray((queueItem as any).jobs)
            ? (queueItem as any).jobs[0]
            : (queueItem as any).jobs

        const { data: existingApp } = await supabase
            .from('applications')
            .select('id, attempt_count')
            .eq('user_id', userId)
            .eq('job_id', queueItem.job_id)
            .maybeSingle()

        if (existingApp) {
            // Update existing application
            const { error: appUpdateError } = await supabase
                .from('applications')
                .update({
                    status: 'failed',
                    last_error: error_message,
                    last_attempt_at: new Date().toISOString(),
                    attempt_count: newAttemptCount,
                    metadata: {
                        queue_item_id: queue_item_id,
                        failed_at: new Date().toISOString(),
                        will_retry: canRetry,
                        retry_scheduled_for: canRetry ? scheduledFor.toISOString() : null,
                    },
                })
                .eq('id', existingApp.id)

            if (appUpdateError) {
                console.error('Error updating application:', appUpdateError)
            }
        } else {
            // Create new application record
            const { error: appError } = await supabase
                .from('applications')
                .insert({
                    user_id: userId,
                    job_id: queueItem.job_id,
                    persona_id: queueItem.persona_id,
                    rule_id: queueItem.rule_id,
                    status: 'failed',
                    submission_method: 'external_link',
                    last_error: error_message,
                    attempt_count: newAttemptCount,
                    last_attempt_at: new Date().toISOString(),
                    trace_id: queueItem.metadata?.trace_id || null,
                    metadata: {
                        queue_item_id: queue_item_id,
                        failed_at: new Date().toISOString(),
                        will_retry: canRetry,
                        retry_scheduled_for: canRetry ? scheduledFor.toISOString() : null,
                    },
                })

            if (appError) {
                console.error('Error creating application:', appError)
                // Don't fail the request, queue was updated successfully
            }
        }

        // 5. Log to auto_apply_logs
        const { error: logError } = await supabase
            .from('auto_apply_logs')
            .insert({
                user_id: userId,
                rule_id: queueItem.rule_id,
                job_id: queueItem.job_id,
                persona_id: queueItem.persona_id,
                status: 'failed',
                submission_url: job?.external_url || null,
                error_message: error_message,
                trace_id: queueItem.metadata?.trace_id || null,
                attempt_count: newAttemptCount,
                artifacts: {
                    will_retry: canRetry,
                    retry_scheduled_for: canRetry ? scheduledFor.toISOString() : null,
                },
            })

        if (logError) {
            console.error('Error creating log entry:', logError)
            // Don't fail the request
        }

        // 6. Track analytics event
        try {
            await fetch('/.netlify/functions/track_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': event.headers.authorization || '',
                },
                body: JSON.stringify({
                    events: [
                        {
                            event_name: 'auto_apply_marked_failed',
                            properties: {
                                queue_item_id: queue_item_id,
                                job_id: queueItem.job_id,
                                error_type: categorizeError(error_message),
                                attempt_count: newAttemptCount,
                                will_retry: canRetry,
                            },
                            event_time: new Date().toISOString(),
                        },
                    ],
                }),
            })
        } catch (analyticsError) {
            console.error('Error tracking analytics:', analyticsError)
            // Don't fail the request
        }

        console.log(
            `❌ Application marked as failed: ${queue_item_id} (attempt ${newAttemptCount}/${MAX_RETRIES})${canRetry ? ' - will retry' : ''}`
        )

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                queue_item_id: queue_item_id,
                status: nextStatus,
                job_title: job?.title || 'Unknown',
                company: job?.company || 'Unknown',
                attempt_count: newAttemptCount,
                will_retry: canRetry,
                retry_at: canRetry ? scheduledFor.toISOString() : null,
                message: canRetry
                    ? `Application marked as failed. Will retry at ${scheduledFor.toLocaleString()}`
                    : 'Application marked as failed',
            }),
        }
    } catch (error) {
        console.error('Unexpected error in auto_apply_mark_failed:', error)

        if ((error as Error).message === 'Unauthorized') {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' }),
            }
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: (error as Error).message,
            }),
        }
    }
}

/**
 * Categorize error message for analytics
 */
function categorizeError(errorMessage: string): string {
    const msg = errorMessage.toLowerCase()

    if (msg.includes('closed') || msg.includes('expired') || msg.includes('filled')) {
        return 'job_closed'
    }
    if (msg.includes('site') || msg.includes('page') || msg.includes('load')) {
        return 'site_error'
    }
    if (msg.includes('login') || msg.includes('account') || msg.includes('credentials')) {
        return 'auth_required'
    }
    if (msg.includes('resume') || msg.includes('cv') || msg.includes('upload')) {
        return 'upload_issue'
    }

    return 'other'
}
