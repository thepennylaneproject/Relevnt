// netlify/functions/ingest_aggregators.ts
/**
 * High-volume aggregator source ingestion
 * Runs: remotive, himalayas, arbeitnow, findwork, jooble, themuse, reed_uk, careeronestop
 * These sources have significant job volumes
 * Runs every 2 hours via cron
 *
 * Expected duration: 3-6 minutes
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

const AGGREGATOR_SOURCES = [
  'remotive',
  'himalayas',
  'arbeitnow',
  'findwork',
  'jooble',
  'themuse',
  'reed_uk',
  'careeronestop',
]

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const workerId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(`[AggregatorIngest:${workerId}] Starting aggregator source ingestion (${AGGREGATOR_SOURCES.length} sources)`)

  try {
    // Run aggregator sources in parallel for faster completion
    const results = await Promise.all(
      AGGREGATOR_SOURCES.map(source => runIngestion(source, 'schedule'))
    )

    const flatResults = results.flat()
    const totalInserted = flatResults.reduce((sum, r) => sum + r.count, 0)
    const totalDuplicates = flatResults.reduce((sum, r) => sum + r.duplicates, 0)
    const failedCount = flatResults.filter(r => r.status === 'failed').length
    const duration = Date.now() - startTime

    console.log(
      `[AggregatorIngest:${workerId}] Completed in ${duration}ms - Inserted: ${totalInserted}, Duplicates: ${totalDuplicates}, Failed: ${failedCount}`
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Aggregator source ingestion completed',
        sources: AGGREGATOR_SOURCES,
        totalInserted,
        totalDuplicates,
        failedCount,
        durationMs: duration,
      }),
    }
  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`[AggregatorIngest:${workerId}] Fatal error after ${duration}ms:`, err)
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
