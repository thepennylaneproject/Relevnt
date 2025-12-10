import type { Handler } from '@netlify/functions'
import { runIngestion } from './ingest_jobs'

// Scheduled cron to run all ingestion sources automatically
export const config = {
  // Runs every 15 minutes; adjust as needed in Netlify if cadence changes
  schedule: '*/15 * * * *',
}

export const handler: Handler = async () => {
  const startedAt = Date.now()
  console.log('scheduled_ingest: cron triggered')

  try {
    const results = await runIngestion(null)
    const summary = results.reduce<Record<string, number>>((acc, result) => {
      acc[result.source] = result.count
      return acc
    }, {})

    console.log('scheduled_ingest: completed', {
      durationMs: Date.now() - startedAt,
      counts: summary,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results,
        summary,
        durationMs: Date.now() - startedAt,
      }),
    }
  } catch (err) {
    console.error('scheduled_ingest: ingestion error', err)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: false,
        error: 'scheduled_ingest encountered an error',
        details: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startedAt,
      }),
    }
  }
}
