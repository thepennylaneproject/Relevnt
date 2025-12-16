import type { Handler } from '@netlify/functions'
import { createAdminClient, createResponse, handleCORS, verifyToken } from './utils/supabase'

const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
const FOUNDER_EMAILS = (process.env.FOUNDER_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function isFounder(email: string | null, secretHeader?: string | null) {
  if (secretHeader && ADMIN_SECRET && secretHeader === ADMIN_SECRET) return true
  if (!email) return false
  return FOUNDER_EMAILS.includes(email.toLowerCase())
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS()
  }

  if (event.httpMethod !== 'GET') {
    return createResponse(405, { success: false, error: 'Method not allowed' })
  }

  try {
    const authHeader = (event.headers.authorization || event.headers.Authorization) as string | undefined
    const secretHeader = (event.headers['x-founder-secret'] ||
      event.headers['x-admin-secret'] ||
      event.queryStringParameters?.admin_secret) as string | undefined

    if (!authHeader && !secretHeader) {
      return createResponse(401, { success: false, error: 'Missing Authorization' })
    }

    const supabase = createAdminClient()

    let userEmail: string | null = null
    if (authHeader) {
      const { userId, error } = await verifyToken(authHeader)
      if (error || !userId) {
        return createResponse(401, { success: false, error: error || 'Unauthorized' })
      }
      const { data, error: userErr } = await supabase.auth.getUser(userId)
      if (userErr || !data?.user) {
        return createResponse(401, { success: false, error: 'Unable to resolve user from token' })
      }
      userEmail = data.user.email ?? null
    }

    if (!isFounder(userEmail, secretHeader || null)) {
      return createResponse(403, { success: false, error: 'Founder-only endpoint' })
    }

    const lookbackHours = Math.max(
      1,
      Math.min(720, Number(event.queryStringParameters?.hours || 24))
    )
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

    const { data: invocations, error: fetchError } = await supabase
      .from('ai_invocations')
      .select('provider,model,task_name,tier,cost_estimate,success,cache_hit,latency_ms,error_code')
      .gte('created_at', since)

    if (fetchError) {
      return createResponse(500, { success: false, error: 'Failed to load telemetry' })
    }

    const totals = {
      calls: invocations?.length || 0,
      successes: invocations?.filter((i) => i.success).length || 0,
      failures: invocations?.filter((i) => !i.success).length || 0,
      total_cost: (invocations || []).reduce((sum, i) => sum + Number(i.cost_estimate || 0), 0),
      avg_latency_ms:
        (invocations || []).reduce((sum, i) => sum + Number(i.latency_ms || 0), 0) /
        Math.max(invocations?.length || 1, 1),
      cache_hit_rate:
        (invocations?.filter((i) => i.cache_hit).length || 0) /
        Math.max(invocations?.length || 1, 1),
    }

    const providers = (invocations || []).reduce<Record<string, { count: number; cost: number; failures: number }>>(
      (acc, row) => {
        const key = row.provider || 'unknown'
        if (!acc[key]) acc[key] = { count: 0, cost: 0, failures: 0 }
        acc[key].count += 1
        acc[key].cost += Number(row.cost_estimate || 0)
        acc[key].failures += row.success ? 0 : 1
        return acc
      },
      {}
    )

    const tasks = (invocations || []).reduce<Record<string, { count: number; cost: number; failures: number }>>(
      (acc, row) => {
        const key = row.task_name || 'unknown'
        if (!acc[key]) acc[key] = { count: 0, cost: 0, failures: 0 }
        acc[key].count += 1
        acc[key].cost += Number(row.cost_estimate || 0)
        acc[key].failures += row.success ? 0 : 1
        return acc
      },
      {}
    )

    const errorCodes = (invocations || []).reduce<Record<string, number>>((acc, row) => {
      if (!row.error_code) return acc
      acc[row.error_code] = (acc[row.error_code] || 0) + 1
      return acc
    }, {})

    const { count: cacheCount } = await supabase
      .from('ai_cache')
      .select('cache_key', { count: 'exact', head: true })

    return createResponse(200, {
      success: true,
      data: {
        window_hours: lookbackHours,
        totals,
        providers,
        tasks,
        errors: errorCodes,
        schema: {
          ai_invocations_rows: invocations?.length || 0,
          ai_cache_rows: cacheCount || 0,
          migrations: ['20241213_ai_routing_layer.sql', '20241214_ai_rls.sql'],
        },
      },
    })
  } catch (err) {
    console.error('ai_ops failed', err)
    return createResponse(500, {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    })
  }
}
