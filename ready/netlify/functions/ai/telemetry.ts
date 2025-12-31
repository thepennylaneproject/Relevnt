import { createAdminClient } from '../utils/supabase'
import type { AIQuality, UserTier } from '../../src/lib/ai/types'

type InvocationRow = {
  user_id?: string | null
  task_name: string
  tier: string
  provider: string
  model: string
  quality: AIQuality
  reason?: string
  input_size?: number
  output_size?: number
  latency_ms?: number
  cost_estimate?: number
  cache_hit?: boolean
  success: boolean
  error_code?: string
  error_message?: string
  trace_id?: string
}

const DEFAULT_DAILY_LIMITS: Record<UserTier, number> = {
  free: 25,
  pro: 200,
  premium: 1000,
  coach: 1200,
}

const DEFAULT_HIGH_LIMITS: Record<UserTier, number> = {
  free: 0,
  pro: 10,
  premium: 1000,
  coach: 1200,
}

const providerHealth: Record<string, { failures: number; openUntil?: number }> = {}

export async function logInvocation(row: InvocationRow): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('ai_invocations').insert({
      ...row,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn('Telemetry insert skipped', err instanceof Error ? err.message : err)
  }
}

function resolveLimitFromEnv(key: string, fallback: number) {
  const raw = process.env[key]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function checkTierCap(userId: string | null | undefined, tier: UserTier, quality: AIQuality) {
  if (!userId) return { allowed: true }
  const totalLimit = resolveLimitFromEnv(`AI_CAP_${tier.toUpperCase()}_DAILY`, DEFAULT_DAILY_LIMITS[tier])
  const highLimit = resolveLimitFromEnv(`AI_CAP_${tier.toUpperCase()}_HIGH_DAILY`, DEFAULT_HIGH_LIMITS[tier])

  try {
    const supabase = createAdminClient()
    const since = new Date()
    since.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('ai_invocations')
      .select('id, quality')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())

    if (error) throw error

    const totalCount = data?.length || 0
    if (totalCount >= totalLimit) {
      return { allowed: false, code: 'daily_cap', message: `Daily cap of ${totalLimit} reached` }
    }

    if (quality === 'high') {
      const highCount = data?.filter((row) => row.quality === 'high').length || 0
      if (highCount >= highLimit) {
        return { allowed: false, code: 'high_cap', message: `High-quality cap of ${highLimit} reached` }
      }
    }

    return { allowed: true }
  } catch (err) {
    console.warn('Cap check failed, allowing request', err instanceof Error ? err.message : err)
    return { allowed: true }
  }
}

export function recordProviderResult(provider: string, success: boolean) {
  const state = providerHealth[provider] || { failures: 0 }
  if (success) {
    providerHealth[provider] = { failures: 0 }
    return
  }

  const failures = state.failures + 1
  const openUntil = failures >= 3 ? Date.now() + 2 * 60_000 : state.openUntil
  providerHealth[provider] = { failures, openUntil }
}

export function isProviderCircuitOpen(provider: string) {
  const state = providerHealth[provider]
  if (!state?.openUntil) return false
  if (state.openUntil > Date.now()) return true
  providerHealth[provider] = { failures: 0 }
  return false
}

export const __testing = {
  providerHealth,
}
