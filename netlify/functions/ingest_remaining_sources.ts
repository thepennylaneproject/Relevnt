// netlify/functions/ingest_remaining_sources.ts
/**
 * Remaining/low-volume source ingestion
 * Runs: usajobs, fantastic, jobdatafeeds, careerjet, whatjobs, theirstack
 * These are lower-volume sources that don't need frequent updates
 * Runs every 6 hours via cron
 *
 * Expected duration: 2-5 minutes
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

const REMAINING_SOURCES = [
  'usajobs',
  'fantastic',
  'jobdatafeeds',
  'careerjet',
  'whatjobs',
  'theirstack',
]

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const workerId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(
    `[RemainingIngest:${workerId}] Starting remaining source ingestion (${REMAINING_SOURCES.length} sources)`
  )

  try {
    // Run remaining sources in parallel for faster completion
    const results = await Promise.all(
      REMAINING_SOURCES.map(source => runIngestion(source, 'schedule'))
    )

    const flatResults = results.flat()
    const totalInserted = flatResults.reduce((sum, r) => sum + r.count, 0)
    const totalDuplicates = flatResults.reduce((sum, r) => sum + r.duplicates, 0)
    const failedCount = flatResults.filter(r => r.status === 'failed').length
    const duration = Date.now() - startTime

    console.log(
      `[RemainingIngest:${workerId}] Completed in ${duration}ms - Inserted: ${totalInserted}, Duplicates: ${totalDuplicates}, Failed: ${failedCount}`
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Remaining source ingestion completed',
        sources: REMAINING_SOURCES,
        totalInserted,
        totalDuplicates,
        failedCount,
        durationMs: duration,
      }),
    }
  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`[RemainingIngest:${workerId}] Fatal error after ${duration}ms:`, err)
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
