// netlify/functions/ingest_premium_sources.ts
/**
 * Premium source ingestion (Greenhouse + Lever)
 * These are high-value sources that need frequent updates
 * Runs every 1 hour via cron
 *
 * Expected duration: 1-3 minutes
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const workerId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(`[PremiumIngest:${workerId}] Starting premium source ingestion (Greenhouse + Lever)`)

  try {
    // Run only premium sources (Greenhouse + Lever)
    // These are run separately to avoid timeout issues
    const results = await Promise.all([
      runIngestion('greenhouse', 'schedule'),
      runIngestion('lever', 'schedule'),
    ])

    const flatResults = results.flat()
    const totalInserted = flatResults.reduce((sum, r) => sum + r.count, 0)
    const duration = Date.now() - startTime

    console.log(`[PremiumIngest:${workerId}] Completed in ${duration}ms - Inserted: ${totalInserted} jobs`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Premium source ingestion completed',
        sources: ['greenhouse', 'lever'],
        totalInserted,
        durationMs: duration,
      }),
    }
  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`[PremiumIngest:${workerId}] Fatal error after ${duration}ms:`, err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        durationMs: duration,
      }),
    }
  }
}
