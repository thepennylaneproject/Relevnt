// netlify/functions/admin_ingestion_runs.ts
/**
 * Admin Ingestion Runs API
 * 
 * GET /admin_ingestion_runs - Get recent ingestion runs with details
 * Query params: limit, status, source, from, to
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

interface RunSourceDetail {
  source: string
  status: string
  total_normalized: number
  total_inserted: number
  total_duplicates: number
  error_summary: string | null
  started_at: string
  finished_at: string | null
}

interface RunSummary {
  id: string
  started_at: string
  finished_at: string | null
  duration_seconds: number
  status: 'running' | 'success' | 'partial' | 'failed'
  triggered_by: 'schedule' | 'manual' | 'admin'
  total_normalized: number
  total_inserted: number
  total_duplicates: number
  failed_source_count: number
  error_summary: string | null
  sources: RunSourceDetail[]
}

export const handler: Handler = async (event) => {
  const supabase = createAdminClient()

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  // Auth check
  const adminSecret = process.env.ADMIN_SECRET
  const providedSecret = event.headers['x-admin-secret']
  
  if (!adminSecret || providedSecret !== adminSecret) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const params = event.queryStringParameters || {}
    const limit = Math.min(parseInt(params.limit || '50', 10), 100)
    const status = params.status || null
    const source = params.source || null
    const from = params.from || null
    const to = params.to || null

    // Build query for runs
    let runsQuery = supabase
      .from('job_ingestion_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit)

    if (status) {
      runsQuery = runsQuery.eq('status', status)
    }
    if (from) {
      runsQuery = runsQuery.gte('started_at', from)
    }
    if (to) {
      runsQuery = runsQuery.lte('started_at', to)
    }

    const { data: runs, error: runsError } = await runsQuery

    if (runsError) {
      console.error('[admin_ingestion_runs] Runs query error:', runsError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: runsError.message }),
      }
    }

    if (!runs || runs.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ runs: [] }),
      }
    }

    // Get source details for these runs
    const runIds = runs.map((r: any) => r.id)
    
    let sourcesQuery = supabase
      .from('job_ingestion_run_sources')
      .select('*')
      .in('run_id', runIds)
      .order('started_at', { ascending: true })

    if (source) {
      sourcesQuery = sourcesQuery.eq('source', source)
    }

    const { data: sources, error: sourcesError } = await sourcesQuery

    if (sourcesError) {
      console.error('[admin_ingestion_runs] Sources query error:', sourcesError)
      // Continue without sources
    }

    // Group sources by run_id
    const sourcesByRunId: Record<string, RunSourceDetail[]> = {}
    if (sources) {
      for (const s of sources) {
        if (!sourcesByRunId[s.run_id]) {
          sourcesByRunId[s.run_id] = []
        }
        sourcesByRunId[s.run_id].push({
          source: s.source,
          status: s.status,
          total_normalized: s.total_normalized || 0,
          total_inserted: s.total_inserted || 0,
          total_duplicates: s.total_duplicates || 0,
          error_summary: s.error_summary,
          started_at: s.started_at,
          finished_at: s.finished_at,
        })
      }
    }

    // Build response
    const result: RunSummary[] = runs.map((run: any) => {
      const runSources = sourcesByRunId[run.id] || []
      const durationSeconds = run.finished_at
        ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)
        : Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000)

      return {
        id: run.id,
        started_at: run.started_at,
        finished_at: run.finished_at,
        duration_seconds: durationSeconds,
        status: run.status,
        triggered_by: run.triggered_by || 'schedule',
        total_normalized: run.total_normalized || 0,
        total_inserted: run.total_inserted || 0,
        total_duplicates: run.total_duplicates || 0,
        failed_source_count: run.total_failed_sources || 0,
        error_summary: run.error_summary,
        sources: runSources,
      }
    })

    // If filtering by source, only return runs that have that source
    const filteredResult = source
      ? result.filter(r => r.sources.length > 0)
      : result

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        runs: filteredResult,
        total: filteredResult.length,
      }),
    }
  } catch (err) {
    console.error('[admin_ingestion_runs] Exception:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }),
    }
  }
}
