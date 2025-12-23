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
    const workerId = Math.random().toString(36).substring(7)
    const startTime = Date.now()
    console.log(`[Worker:${workerId}] Starting background ingestion worker`)
    console.log(`[Worker:${workerId}] Environment check:`)
    console.log(`[Worker:${workerId}]   - CAREERJET_API_KEY: ${process.env.CAREERJET_API_KEY ? 'SET' : 'NOT SET'}`)
    console.log(`[Worker:${workerId}]   - Event headers:`, JSON.stringify(event.headers))

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

        console.log(`[Worker:${workerId}] Running ingestion with:`, {
            triggeredBy,
            source: requestedSource,
            timestamp: new Date().toISOString(),
        })

        // Run the ingestion (this is the long-running operation)
        const results = await runIngestion(requestedSource, triggeredBy)

        // Calculate summary
        const totalInserted = results.reduce((sum, r) => sum + r.count, 0)
        const totalNormalized = results.reduce((sum, r) => sum + r.normalized, 0)
        const totalByStatus = results.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const duration = Date.now() - startTime
        console.log(`[Worker:${workerId}] Ingestion completed in ${duration}ms`, {
            totalSources: results.length,
            totalInserted,
            totalNormalized,
            byStatus: totalByStatus,
            details: results.map(r => ({
                source: r.source,
                status: r.status,
                count: r.count,
                error: r.error,
            })),
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
                    byStatus: totalByStatus,
                    durationMs: duration,
                },
            }),
        }
    } catch (err) {
        const duration = Date.now() - startTime
        console.error(`[Worker:${workerId}] Fatal error after ${duration}ms:`, err)
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
            }),
        }
    }
}

