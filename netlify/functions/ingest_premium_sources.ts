// netlify/functions/ingest_premium_sources.ts
/**
 * Premium source ingestion (Greenhouse only)
 *
 * NOTE: Lever has been moved to ingest_lever-background.ts
 * because it requires a longer timeout (15 min) due to large job volumes
 *
 * Greenhouse completes in <30 seconds, so uses standard function timeout
 * Runs every 30 minutes via cron
 *
 * Expected duration: 5-30 seconds
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const workerId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(`[PremiumIngest:${workerId}] Starting premium source ingestion (Greenhouse only)`)

  try {
    // Run only Greenhouse here (Lever moved to background function)
    const results = await Promise.all([
      runIngestion('greenhouse', 'schedule'),
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
        sources: ['greenhouse'],
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
