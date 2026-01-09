// netlify/functions/admin_config.ts
/**
 * Admin Config API
 * 
 * GET /admin_config - Get all config values
 * POST /admin_config - Update a config value
 */

import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

interface ConfigRow {
  key: string
  value: any
  description: string | null
  updated_at: string
}

export const handler: Handler = async (event) => {
  const supabase = createAdminClient()

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  // Auth check: require admin secret or admin user
  const adminSecret = process.env.ADMIN_SECRET
  const providedSecret = event.headers['x-admin-secret']
  
  if (!adminSecret || providedSecret !== adminSecret) {
    // TODO: Also check if user is admin via JWT
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get all config values
      const { data, error } = await supabase
        .from('admin_config')
        .select('key, value, description, updated_at')
        .order('key')

      if (error) {
        console.error('[admin_config] GET error:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ config: data }),
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { key, value } = body

      if (!key) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required field: key' }),
        }
      }

      // Update or insert config value
      const { data, error } = await supabase
        .from('admin_config')
        .upsert(
          {
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
        .select('key, value, description, updated_at')
        .single()

      if (error) {
        console.error('[admin_config] POST error:', error)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message }),
        }
      }

      console.log(`[admin_config] Updated ${key} = ${JSON.stringify(value)}`)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, config: data }),
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (err) {
    console.error('[admin_config] Exception:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }),
    }
  }
}
