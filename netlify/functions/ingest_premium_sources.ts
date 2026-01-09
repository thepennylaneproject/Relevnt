// netlify/functions/ingest_premium_sources.ts
/**
 * Premium source ingestion using rotation system
 *
 * Uses runRotationIngestion() which:
 * - Rotates through company_targets (Greenhouse/Lever)
 * - Implements per-company backoff (cooling after 3 empty runs)
 * - Processes search_slices with adaptive intervals
 *
 * NOTE: Lever has been moved to ingest_lever-background.ts
 * because it requires a longer timeout (15 min) due to large job volumes
 *
 * Greenhouse completes in <30 seconds via rotation queue
 * Runs every 30 minutes via cron
 *
 * Expected duration: 5-30 seconds
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { runRotationIngestion } from './ingest_jobs'

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const workerId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(`[PremiumIngest:${workerId}] Starting rotation-based ingestion`)

  try {
    // Use rotation system for intelligent company target selection
    const results = await runRotationIngestion('schedule')

    const totalInserted = results.reduce((sum, r) => sum + r.count, 0)
    const duration = Date.now() - startTime

    console.log(`[PremiumIngest:${workerId}] Completed in ${duration}ms - ${results.length} sources, ${totalInserted} jobs inserted`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Rotation ingestion completed',
        sources: results.map(r => r.source),
        totalInserted,
        durationMs: duration,
        results,
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
