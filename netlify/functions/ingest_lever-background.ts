// netlify/functions/ingest_lever-background.ts
/**
 * Lever background ingestion function
 *
 * Runs as a Netlify background function (15-minute timeout)
 * Lever ingestion requires longer timeout due to:
 * - Large number of jobs per company (200-500+)
 * - Multi-company fetching via registry
 * - Extensive pagination and normalization
 *
 * Without background function, times out at 10-26 seconds.
 * With background function, has 15 minutes (900 seconds).
 */

import type { Handler, HandlerContext } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

export const handler: Handler = async (
  event: any,
  context: HandlerContext
) => {
  const workerId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(`[LeverIngestBg:${workerId}] Starting Lever background ingestion`)

  try {
    const result = await runIngestion('lever', 'schedule')
    const duration = Date.now() - startTime

    console.log(`[LeverIngestBg:${workerId}] Completed in ${duration}ms`, {
      count: result[0]?.count ?? 0,
      normalized: result[0]?.normalized ?? 0,
      duplicates: result[0]?.duplicates ?? 0,
      status: result[0]?.status ?? 'unknown',
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Lever ingestion completed',
        durationMs: duration,
        result: result[0],
      }),
    }
  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`[LeverIngestBg:${workerId}] Fatal error after ${duration}ms:`, err)
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
