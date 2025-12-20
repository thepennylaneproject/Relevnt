// netlify/functions/jobs_cron.ts
/**
 * Scheduled Job Ingestion Trigger
 * 
 * Runs hourly to trigger the background ingestion worker.
 * This function is lightweight (<30s) and just triggers the actual worker.
 */
import type { Config } from '@netlify/functions'

export default async (req: Request) => {
    const baseUrl = process.env.URL || 'https://relevnt-fresh.netlify.app'

    console.log('jobs_cron: triggering background ingestion worker')

    try {
        // Trigger the background worker which has 15-min timeout
        const response = await fetch(`${baseUrl}/.netlify/functions/ingest_jobs_worker-background`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
