
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

        // Map to EnhancedJobRow for scoring engine (add default keywords if missing)
        const enhancedJobs = (freshJobs as any[]).map(job => ({
            ...job,
            keywords: job.keywords || [],
        }))

        let notificationsCreated = 0

        // 3. Process each user
        for (const user of users) {
            try {
                // Aggregate match profile
                const profile = await aggregateUserProfile(supabase, user.id)
                if (!profile) continue

                // Score jobs
                const matchResults = scoreJobBatch(enhancedJobs, profile, {
                    minScore: 80 // Only high-confidence matches
                })

                if (matchResults.length === 0) continue

                // Get user's max score history to detect "Highest Ever"
                const { data: maxScoreData } = await supabase
                    .from('user_alert_history')
                    .select('score')
                    .eq('user_id', user.id)
                    .order('score', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                const maxHistoricalScore = maxScoreData?.score || 0

                for (const result of matchResults) {
                    // Find the job object (result only has ID)
                    const job = freshJobs.find(j => j.id === result.job_id)
                    if (!job) continue

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

                    // Proactive Intelligence: Context
                    const isHighestEver = result.total_score > maxHistoricalScore
                    const isFresh = new Date(job.posted_date || job.created_at).getTime() > (Date.now() - 24 * 60 * 60 * 1000)

                    // Craft Message
                    let title = 'New High-Confidence Match'
                    let message = `We found a great fit: ${job.title} at ${job.company || 'Unknown'}. Match score: ${Math.round(result.total_score)}%`

                    if (isHighestEver) {
                        title = '🎯 Highest Match Found!'
                        message = `Incredible fit: ${job.title} matches ${Math.round(result.total_score)}% of your profile. This is your best match yet.`
                    } else if (isFresh) {
                        title = '⚡️ Fresh Opportunity'
                        message = `${job.title} was just posted. Be among the first to apply.`
                    }

                    // Create Notification with Metadata
                    const { error: notifError } = await supabase
                        .from('notifications')
                        .insert({
                            user_id: user.id,
                            title,
                            message,
                            type: 'job_alert',
                            link: `/jobs?id=${result.job_id}`,
                            metadata: {
                                score: result.total_score,
                                isHighestEver,
                                isFresh,
                                company: job.company,
                                matchReasons: result.top_reasons.slice(0, 2)
                            }
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
                            alert_type: 'high_match',
                            score: result.total_score,
                            meta: {
                                isHighestEver,
                                isFresh
                            }
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
