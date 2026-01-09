// netlify/functions/admin_search_slices.ts
/**
 * Admin Search Slices API
 * 
 * GET /admin_search_slices - List search slices with filtering
 * POST /admin_search_slices - Update a search slice
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

interface SearchSlice {
  id: string
  source: string
  query_hash: string
  params_json: {
    keywords?: string
    location?: string
    [key: string]: any
  }
  status: 'active' | 'paused' | 'bad'
  last_success_at: string | null
  next_allowed_at: string | null
  min_interval_minutes: number
  result_count_last: number
  new_jobs_last: number
  consecutive_empty_runs: number
  fail_count: number
  last_error: string | null
  created_at: string
}

export const handler: Handler = async (event) => {
  const supabase = createAdminClient()

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  try {
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {}
      const limit = Math.min(parseInt(params.limit || '50', 10), 200)
      const offset = parseInt(params.offset || '0', 10)
      const status = params.status || null
      const source = params.source || null

      let query = supabase
        .from('search_slices')
        .select('*', { count: 'exact' })
        .order('last_success_at', { ascending: true, nullsFirst: true })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }
      if (source) {
        query = query.eq('source', source)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('[admin_search_slices] GET error:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        }
      }

      // Enrich with derived fields for UI
      const enrichedSlices = (data || []).map((slice: any) => ({
        ...slice,
        keywords: slice.params_json?.keywords || '',
        location: slice.params_json?.location || '',
        is_cooling: slice.consecutive_empty_runs >= 3,
        is_productive: slice.new_jobs_last > 10,
      }))

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          slices: enrichedSlices,
          total: count,
          limit,
          offset,
        }),
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { id, status, min_interval_minutes, params_json, reset_cooldown } = body

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required field: id' }),
        }
      }

      // Build update payload
      const updates: Record<string, any> = {}
      
      if (status !== undefined) {
        updates.status = status
      }
      if (min_interval_minutes !== undefined) {
        updates.min_interval_minutes = parseInt(min_interval_minutes, 10)
      }
      if (params_json !== undefined) {
        updates.params_json = params_json
        // Update query_hash if params changed
        const hashInput = `${updates.params_json.keywords || ''}:${updates.params_json.location || ''}`
        // Simple hash for now - matches the pattern in ingestionRotation.ts
        let hash = 0
        for (let i = 0; i < hashInput.length; i++) {
          const char = hashInput.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash
        }
        updates.query_hash = Math.abs(hash).toString(16).padStart(8, '0')
      }
      if (reset_cooldown === true) {
        updates.next_allowed_at = new Date().toISOString()
        updates.consecutive_empty_runs = 0
        updates.fail_count = 0
        updates.last_error = null
      }

      if (Object.keys(updates).length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No valid fields to update' }),
        }
      }

      const { data, error } = await supabase
        .from('search_slices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[admin_search_slices] POST error:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        }
      }

      console.log(`[admin_search_slices] Updated ${id}:`, updates)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, slice: data }),
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (err) {
    console.error('[admin_search_slices] Exception:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }),
    }
  }
}
