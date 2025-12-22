// netlify/functions/ingest_jobs_worker-background.ts
/**
 * Background worker for job ingestion
 * This function has a 15-minute timeout limit (vs 10-26s for regular functions)
 * 
 * Triggered by:
 * - admin_ingest_trigger (manual admin trigger)
 * - Scheduled cron (via Netlify scheduled functions)
 * 
 * The -background suffix in the filename makes this a Netlify background function.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

interface WorkerPayload {
    triggeredBy?: 'admin' | 'schedule' | 'manual'
    source?: string | null
    sources?: string[]
}

export const handler: Handler = async (
    event: HandlerEvent,
    context: HandlerContext
) => {
    console.log('ingest_jobs_worker-background: started')

    try {
        // Parse the request body
        let payload: WorkerPayload = {}
        if (event.body) {
            try {
                payload = JSON.parse(event.body)
            } catch {
                console.warn('ingest_jobs_worker-background: failed to parse body, using defaults')
            }
        }

        const triggeredBy = payload.triggeredBy || 'manual'
        const requestedSource = payload.source || null

        console.log('ingest_jobs_worker-background: running ingestion', {
            triggeredBy,
            source: requestedSource,
        })

        // Run the ingestion (this is the long-running operation)
        const results = await runIngestion(requestedSource, triggeredBy)

        // Calculate summary
        const totalInserted = results.reduce((sum, r) => sum + r.count, 0)
        const totalNormalized = results.reduce((sum, r) => sum + r.normalized, 0)
        const failedCount = results.filter(r => r.status === 'failed').length

        console.log('ingest_jobs_worker-background: completed', {
            totalSources: results.length,
            totalInserted,
            totalNormalized,
            failedCount,
        })

        // Background functions return 202 Accepted immediately to the caller,
        // but this return is logged for debugging purposes
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Ingestion completed',
                results,
                summary: {
                    sources: results.length,
                    inserted: totalInserted,
                    normalized: totalNormalized,
                    failed: failedCount,
                },
            }),
        }
    } catch (err) {
        console.error('ingest_jobs_worker-background: fatal error', err)
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
            }),
        }
    }
}
