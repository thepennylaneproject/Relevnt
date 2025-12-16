// netlify/functions/auto_apply_mark_submitted.ts
/**
 * AUTO-APPLY MARK SUBMITTED ENDPOINT
 * 
 * Allows users to manually mark a queue item as submitted after
 * completing the application on the external site.
 * 
 * POST /.netlify/functions/auto_apply_mark_submitted
 * 
 * Request Body:
 * {
 *   queue_item_id: string,      // UUID of auto_apply_queue entry
 *   notes?: string,              // Optional proof notes
 *   screenshot_url?: string      // Optional screenshot link
 * }
 * 
 * Security:
 * - Requires JWT authentication
 * - Validates queue item belongs to authenticated user
 * - Prevents double-submission by checking current status
 * 
 * State Transitions:
 * - ready_to_submit → submitted
 * - requires_review → submitted
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { requireAuth } from './utils/auth'

type MarkSubmittedRequest = {
    queue_item_id: string
    notes?: string
    screenshot_url?: string
}

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
        const body: MarkSubmittedRequest = event.body ? JSON.parse(event.body) : {}
        const { queue_item_id, notes, screenshot_url } = body

        if (!queue_item_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'queue_item_id is required' }),
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

        // 2. Validate current status (prevent double submission)
        const validStatuses = ['ready_to_submit', 'requires_review']
        if (!validStatuses.includes(queueItem.status)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Invalid state transition. Current status: ${queueItem.status}. Expected: ready_to_submit or requires_review`,
                }),
            }
        }

        // 3. Check if already applied to this job
        const { data: existingApp, error: existingError } = await supabase
            .from('applications')
            .select('id, status')
            .eq('user_id', userId)
            .eq('job_id', queueItem.job_id)
            .neq('status', 'withdrawn')
            .maybeSingle()

        if (existingApp) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Application already exists for this job with status: ${existingApp.status}`,
                    application_id: existingApp.id,
                }),
            }
        }

        // 4. Create application record
        const job = Array.isArray((queueItem as any).jobs)
            ? (queueItem as any).jobs[0]
            : (queueItem as any).jobs

        const { data: application, error: appError } = await supabase
            .from('applications')
            .insert({
                user_id: userId,
                job_id: queueItem.job_id,
                persona_id: queueItem.persona_id,
                rule_id: queueItem.rule_id,
                status: 'submitted',
                submission_method: 'external_link',
                attempt_count: 1,
                last_attempt_at: new Date().toISOString(),
                trace_id: queueItem.metadata?.trace_id || null,
                metadata: {
                    proof_notes: notes || null,
                    screenshot_url: screenshot_url || null,
                    queue_item_id: queue_item_id,
                    submitted_at: new Date().toISOString(),
                    match_score: queueItem.metadata?.match_score || null,
                },
            })
            .select()
            .single()

        if (appError) {
            console.error('Error creating application:', appError)
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to create application record' }),
            }
        }

        // 5. Update queue item to completed
        const { error: queueUpdateError } = await supabase
            .from('auto_apply_queue')
            .update({
                status: 'completed',
                processed_at: new Date().toISOString(),
                metadata: {
                    ...(queueItem.metadata || {}),
                    completed_at: new Date().toISOString(),
                    application_id: application.id,
                },
            })
            .eq('id', queue_item_id)

        if (queueUpdateError) {
            console.error('Error updating queue item:', queueUpdateError)
            // Don't fail the request, application was created successfully
        }

        // 6. Log to auto_apply_logs
        const { error: logError } = await supabase
            .from('auto_apply_logs')
            .insert({
                user_id: userId,
                rule_id: queueItem.rule_id,
                job_id: queueItem.job_id,
                persona_id: queueItem.persona_id,
                status: 'submitted',
                submission_url: job?.external_url || null,
                error_message: null,
                trace_id: queueItem.metadata?.trace_id || null,
                attempt_count: 1,
                artifacts: {
                    application_id: application.id,
                    proof_notes: notes || null,
                    screenshot_url: screenshot_url || null,
                },
            })

        if (logError) {
            console.error('Error creating log entry:', logError)
            // Don't fail the request
        }

        // 7. Track analytics event
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
                            event_name: 'auto_apply_marked_submitted',
                            properties: {
                                queue_item_id: queue_item_id,
                                job_id: queueItem.job_id,
                                has_proof: !!(notes || screenshot_url),
                                has_notes: !!notes,
                                has_screenshot: !!screenshot_url,
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

        console.log(`✅ Application marked as submitted: ${application.id}`)

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                application_id: application.id,
                job_title: job?.title || 'Unknown',
                company: job?.company || 'Unknown',
                message: 'Application marked as submitted successfully',
            }),
        }
    } catch (error) {
        console.error('Unexpected error in auto_apply_mark_submitted:', error)

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
