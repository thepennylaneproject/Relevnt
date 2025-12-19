import type { Handler } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

/**
 * Background Ingestion Cron
 * Runs hourly to ingest jobs from all sources.
 * Uses -background suffix for 15-minute timeout.
 */
export const config = {
    schedule: '0 * * * *',
}

export const handler: Handler = async () => {
    const startedAt = Date.now()
    console.log('jobs_cron-background: ingestion started')

    try {
        const results = await runIngestion(null, 'schedule')
        const summary = results.reduce<Record<string, number>>((acc, r) => {
            acc[r.source] = r.count
            return acc
        }, {})

        console.log('jobs_cron-background: ingestion succeeded', {
            durationMs: Date.now() - startedAt,
            counts: summary,
        })

        // Note: Background functions don't return meaningful data to Netlify, 
        // but we return 200 for internal consistency.
        return {
            statusCode: 200,
        }
    } catch (err) {
        console.error('jobs_cron-background: ingestion failed', err)
        return {
            statusCode: 500,
        }
    }
}
