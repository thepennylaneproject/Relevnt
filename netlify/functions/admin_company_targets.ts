// netlify/functions/admin_company_targets.ts
/**
 * Admin Company Targets API
 * 
 * GET /admin_company_targets - List company targets with filtering
 * POST /admin_company_targets - Update a company target
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

interface CompanyTarget {
  id: string
  platform: 'lever' | 'greenhouse'
  company_slug: string
  company_id: string | null
  status: 'active' | 'paused' | 'bad'
  last_success_at: string | null
  next_allowed_at: string | null
  min_interval_minutes: number
  priority: number
  fail_count: number
  last_error: string | null
  new_jobs_last: number
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
      const platform = params.platform || null

      let query = supabase
        .from('company_targets')
        .select('*', { count: 'exact' })
        .order('priority', { ascending: true })
        .order('last_success_at', { ascending: true, nullsFirst: true })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }
      if (platform) {
        query = query.eq('platform', platform)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('[admin_company_targets] GET error:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          targets: data,
          total: count,
          limit,
          offset,
        }),
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { id, status, min_interval_minutes, priority, reset_cooldown } = body

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
      if (priority !== undefined) {
        updates.priority = parseInt(priority, 10)
      }
      if (reset_cooldown === true) {
        updates.next_allowed_at = new Date().toISOString()
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
        .from('company_targets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[admin_company_targets] POST error:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        }
      }

      console.log(`[admin_company_targets] Updated ${id}:`, updates)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, target: data }),
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (err) {
    console.error('[admin_company_targets] Exception:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }),
    }
  }
}
