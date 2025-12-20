
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { aggregateUserProfile, scoreJobBatch } from '../../src/lib/scoring'
import type { JobRow } from '../../src/shared/types'

export const config = {
    schedule: "0 9 * * *" // Daily at 9am UTC
}

export const handler: Handler = async () => {
    const startedAt = Date.now()
    const supabase = createAdminClient()

    try {
        // 1. Fetch users with job alerts enabled
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, email, notif_high_match')
            .eq('notif_high_match', true)

        if (usersError || !users) {
            console.error('[JobAlerts] Failed to fetch users:', usersError)
            return { statusCode: 500, body: 'Failed to fetch users' }
        }

        console.log(`[JobAlerts] Processing alerts for ${users.length} users`)

        // 2. Fetch fresh jobs (last 48h to be safe with timezones/delays)
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        const { data: freshJobs, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .gte('created_at', fortyEightHoursAgo)

        if (jobsError || !freshJobs) {
            console.error('[JobAlerts] Failed to fetch fresh jobs:', jobsError)
            return { statusCode: 500, body: 'Failed to fetch jobs' }
        }

        console.log(`[JobAlerts] Scanning ${freshJobs.length} fresh jobs`)

        let notificationsCreated = 0

        // 3. Process each user
        for (const user of users) {
            try {
                // Aggregate match profile
                const profile = await aggregateUserProfile(supabase, user.id)
                if (!profile) continue

                // Score jobs
                const matchResults = scoreJobBatch(freshJobs as unknown as JobRow[], profile, {
                    minScore: 80 // Only high-confidence matches
                })

                if (matchResults.length === 0) continue

                for (const result of matchResults) {
                    // Check if already alerted
                    const { data: existing, error: histError } = await supabase
                        .from('user_alert_history')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('job_id', result.job_id)
                        .eq('alert_type', 'high_match')
                        .maybeSingle()

                    if (histError) continue
                    if (existing) continue // Already notified

                    // Create Notification
                    const { error: notifError } = await supabase
                        .from('notifications')
                        .insert({
                            user_id: user.id,
                            title: 'New High-Confidence Match',
                            message: `We found a great fit: ${result.job.title} at ${result.job.company || 'Unknown'}. Match score: ${Math.round(result.score)}%`,
                            type: 'job_alert',
                            link: `/jobs?id=${result.job_id}`
                        })

                    if (notifError) {
                        console.error(`[JobAlerts] Failed to create notification for ${user.id}:`, notifError)
                        continue
                    }

                    // Record to history
                    await supabase
                        .from('user_alert_history')
                        .insert({
                            user_id: user.id,
                            job_id: result.job_id,
                            alert_type: 'high_match'
                        })

                    notificationsCreated++
                }
            } catch (userErr) {
                console.error(`[JobAlerts] Error processing user ${user.id}:`, userErr)
            }
        }

        console.log(`[JobAlerts] Completed. Created ${notificationsCreated} notifications. Duration: ${Date.now() - startedAt}ms`)

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                usersProcessed: users.length,
                notificationsCreated,
                durationMs: Date.now() - startedAt
            })
        }

    } catch (err: any) {
        console.error('[JobAlerts] Unexpected error:', err)
        return { statusCode: 500, body: err.message }
    }
}
