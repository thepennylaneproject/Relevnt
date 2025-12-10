import type { Handler } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

export const handler: Handler = async () => {
  const startedAt = Date.now()

  try {
    const results = await runIngestion()
    const summary = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.source] = r.count
      return acc
    }, {})

    console.log('jobs_cron: ingestion succeeded', {
      durationMs: Date.now() - startedAt,
      counts: summary,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results,
        durationMs: Date.now() - startedAt,
      }),
    }
  } catch (err) {
    console.error('jobs_cron: ingestion failed', err)

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'jobs_cron failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      }),
    }
  }
}
