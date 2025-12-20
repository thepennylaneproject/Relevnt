// netlify/functions/jobs_cron.ts
/**
 * Scheduled Job Ingestion Trigger
 * 
 * Runs hourly to trigger the background ingestion worker.
 * Uses a shared secret for authentication to avoid 403.
 */
import type { Config } from '@netlify/functions'

export default async () => {
    const baseUrl = process.env.URL || 'https://relevnt-fresh.netlify.app'
    const internalSecret = process.env.INTERNAL_FUNCTION_SECRET || 'default-internal-secret'

    console.log('jobs_cron: triggering background ingestion worker')

    try {
        // Trigger the background worker with auth header
        const response = await fetch(`${baseUrl}/.netlify/functions/ingest_jobs_worker-background`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Secret': internalSecret
            },
            body: JSON.stringify({ triggeredBy: 'schedule' })
        })

        // Background functions return 202 immediately
        console.log(`jobs_cron: worker triggered, status ${response.status}`)

        return new Response(JSON.stringify({
            triggered: true,
            workerStatus: response.status
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (err) {
        console.error('jobs_cron: failed to trigger worker', err)
        return new Response(JSON.stringify({
            error: 'Failed to trigger worker',
            message: err instanceof Error ? err.message : String(err)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

export const config: Config = {
    schedule: '@hourly'
}
