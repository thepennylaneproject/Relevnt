// netlify/functions/daily_summaries.ts
/**
 * Daily Analytics Summarization Job
 * Runs daily to aggregate analytics_events into analytics_daily_summaries
 * Scheduled via Netlify or can be called manually
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

export const config = {
    schedule: "0 2 * * *"  // Daily at 2am UTC
}

export const handler: Handler = async () => {
    const startedAt = Date.now()

    try {
        const supabase = createAdminClient()

        // Get yesterday's date range
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const dayString = yesterday.toISOString().split('T')[0]

        console.log(`daily_summaries: aggregating events for ${dayString}`)

        // Fetch all events from yesterday
        const { data: events, error: eventsError } = await supabase
            .from('analytics_events')
            .select('*')
            .gte('event_time', yesterday.toISOString())
            .lt('event_time', today.toISOString())

        if (eventsError) {
            console.error('daily_summaries: failed to fetch events', eventsError)
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to fetch events',
                }),
            }
        }

        const eventsList = events || []
        console.log(`daily_summaries: processing ${eventsList.length} events`)

        // Calculate metrics
        const uniqueUsers = new Set(eventsList.filter((e) => e.user_id).map((e) => e.user_id))
        const personaSwitches = eventsList.filter((e) => e.event_name === 'persona_switched')
        const resumeUploads = eventsList.filter((e) => e.event_name === 'resume_uploaded')
        const resumeExports = eventsList.filter((e) => e.event_name === 'resume_exported')
        const jobSaves = eventsList.filter((e) => e.event_name === 'job_saved')
        const jobDismissals = eventsList.filter((e) => e.event_name === 'job_dismissed')
        const aiActions = eventsList.filter((e) => e.event_name === 'ai_action_clicked')

        // Count AI actions by feature
        const aiActionsByFeature: Record<string, number> = {}
        aiActions.forEach((evt) => {
            const feature = evt.properties?.feature || 'unknown'
            aiActionsByFeature[feature] = (aiActionsByFeature[feature] || 0) + 1
        })

        // Build summary rows
        const summaries = [
            { day: dayString, metric_key: 'dau', metric_value: uniqueUsers.size },
            { day: dayString, metric_key: 'persona_switch_count', metric_value: personaSwitches.length },
            { day: dayString, metric_key: 'resume_upload_count', metric_value: resumeUploads.length },
            { day: dayString, metric_key: 'resume_export_count', metric_value: resumeExports.length },
            { day: dayString, metric_key: 'job_save_count', metric_value: jobSaves.length },
            { day: dayString, metric_key: 'job_dismiss_count', metric_value: jobDismissals.length },
            { day: dayString, metric_key: 'ai_action_count_total', metric_value: aiActions.length },
            {
                day: dayString,
                metric_key: 'ai_action_count_by_feature',
                metric_value: 0,
                meta: aiActionsByFeature,
            },
        ]

        // Upsert summaries
        const { error: upsertError } = await supabase
            .from('analytics_daily_summaries')
            .upsert(summaries, { onConflict: 'day,metric_key' })

        if (upsertError) {
            console.error('daily_summaries: failed to upsert summaries', upsertError)
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to store summaries',
                }),
            }
        }

        console.log(`daily_summaries: completed in ${Date.now() - startedAt}ms`)

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                day: dayString,
                summaries,
                durationMs: Date.now() - startedAt,
            }),
        }
    } catch (err) {
        console.error('daily_summaries: unexpected error', err)
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: err instanceof Error ? err.message : String(err),
            }),
        }
    }
}
