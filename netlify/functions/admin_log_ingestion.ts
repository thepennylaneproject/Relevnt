import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

/**
 * Logs ingestion run activity and updates source performance metrics
 * Called by ingest_jobs.ts after each ingestion run
 *
 * Request body:
 * {
 *   sources_requested: ['greenhouse', 'lever', ...],
 *   trigger_type: 'scheduled' | 'manual' | 'retry',
 *   status: 'success' | 'partial' | 'failed',
 *   total_inserted: number,
 *   total_duplicates: number,
 *   total_failed_sources: number,
 *   started_at: ISO string,
 *   finished_at: ISO string,
 *   error_message?: string,
 *   run_details?: object
 * }
 */

interface LogRequest {
  sources_requested: string[]
  trigger_type: 'scheduled' | 'manual' | 'retry'
  status: 'success' | 'partial' | 'failed' | 'running'
  total_inserted: number
  total_duplicates: number
  total_failed_sources: number
  started_at: string
  finished_at?: string
  error_message?: string
  progress_percent?: number
  run_details?: Record<string, any>
  // Structured failure classification
  failure_stage?: 'fetch' | 'normalize' | 'dedup' | 'upsert' | 'post-filter'
  failure_type?: 'timeout' | 'schema_mismatch' | 'duplicate_key' | 'validation' | 'rate_limit' | 'auth' | 'unknown'
  failure_batch_context?: { job_count?: number; stale_count?: number; insert_attempts?: number }
}

interface LogResponse {
  success: boolean
  activity_id?: string
  error?: string
}

const handler: Handler = async (event) => {
  const adminSecret = event.headers['x-admin-secret'] || process.env.ADMIN_SECRET
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    console.error('admin_log_ingestion: missing or invalid ADMIN_SECRET')
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}') as LogRequest

    const supabase = createAdminClient()

    // 1. Log activity
    const durationSeconds = body.finished_at
      ? Math.round(
          (new Date(body.finished_at).getTime() - new Date(body.started_at).getTime()) /
            1000
        )
      : undefined

    const { data: activity, error: logError } = await supabase
      .from('ingestion_activity_log')
      .insert({
        sources_requested: body.sources_requested,
        trigger_type: body.trigger_type,
        status: body.status,
        total_inserted: body.total_inserted,
        total_duplicates: body.total_duplicates,
        total_failed: body.total_failed_sources,
        started_at: body.started_at,
        finished_at: body.finished_at,
        duration_seconds: durationSeconds,
        error_message: body.error_message,
        progress_percent: body.progress_percent || 0,
      })
      .select('id')
      .single()

    if (logError) {
      console.error('admin_log_ingestion: failed to log activity', logError)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to log activity', details: logError }),
      }
    }

    // 2. Update source health for each source
    for (const source of body.sources_requested) {
      if (body.status === 'success' || body.status === 'partial') {
        await supabase
          .from('job_source_health')
          .upsert(
            {
              source: source,
              is_healthy: body.status === 'success',
              is_degraded: body.status === 'partial',
              consecutive_failures: 0,
              last_success_at: body.finished_at || new Date().toISOString(),
              success_count_24h: 1, // This should be updated via aggregation
              updated_at: new Date().toISOString(),
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: 'source' }
          )
      } else if (body.status === 'failed') {
        const { data: currentHealth } = await supabase
          .from('job_source_health')
          .select('consecutive_failures')
          .eq('source', source)
          .single()

        const failureCount = (currentHealth?.consecutive_failures || 0) + 1

        // Create alert if consecutive failures exceed threshold
        if (failureCount >= 3) {
          await supabase.from('admin_alerts').insert({
            alert_type: 'source_failure',
            severity: failureCount >= 5 ? 'critical' : 'high',
            title: `${source} has ${failureCount} consecutive failures`,
            description: body.error_message,
            source_slug: source,
            triggered_at: new Date().toISOString(),
          })
        }

        await supabase
          .from('job_source_health')
          .upsert(
            {
              source: source,
              is_healthy: false,
              is_degraded: true,
              consecutive_failures: failureCount,
              last_failure_at: body.finished_at || new Date().toISOString(),
              last_failure_reason: body.error_message,
              // Structured failure classification
              failure_stage: body.failure_stage || null,
              failure_type: body.failure_type || 'unknown',
              failure_batch_context: body.failure_batch_context || null,
              updated_at: new Date().toISOString(),
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: 'source' }
          )
      }
    }

    // 3. Log overall ingestion metrics
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    await supabase
      .from('daily_ingestion_metrics')
      .upsert(
        {
          date: today,
          total_runs: 1,
          total_inserted: body.total_inserted,
          total_duplicates: body.total_duplicates,
          total_failed: body.total_failed_sources,
          success_rate: body.status === 'success' ? 100 : body.status === 'partial' ? 50 : 0,
          avg_duration_seconds: durationSeconds || 0,
        },
        {
          onConflict: 'date',
        }
      )
      .then(() => {
        // If upsert, we need to aggregate - but for now, just insert new
      })

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        activity_id: activity?.id,
      } as LogResponse),
    }
  } catch (error) {
    console.error('admin_log_ingestion: unexpected error', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

export { handler }
