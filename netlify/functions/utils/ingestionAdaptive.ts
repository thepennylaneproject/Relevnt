/**
 * ingestionAdaptive.ts - Adaptive cooldown logic for job sources
 *
 * Sources that repeatedly produce high noop ratios (jobs already in DB)
 * get progressively longer cooldowns to reduce wasted API calls.
 */

import { createClient as createAdminClient } from './supabaseAdmin'

/**
 * Threshold for considering a run "high noop"
 * If more than 60% of jobs are noop, cooldown increases
 */
const HIGH_NOOP_THRESHOLD = 0.6

/**
 * Calculate adaptive cooldown multiplier based on run performance.
 * This is a pure function for local calculation without DB.
 *
 * @returns multiplier (1.0 = normal, up to 3.0 = triple cooldown)
 */
export function calculateCooldownMultiplier(
  inserted: number,
  updated: number,
  noop: number
): number {
  const total = inserted + updated + noop
  if (total === 0) return 1.0

  const noopRatio = noop / total

  // If mostly new jobs, use normal cooldown
  if (noopRatio <= 0.4) return 1.0
  // If 40-60% noop, slight increase
  if (noopRatio <= HIGH_NOOP_THRESHOLD) return 1.25
  // If 60-80% noop, moderate increase
  if (noopRatio <= 0.8) return 1.5
  // If 80%+ noop, significant increase
  return 2.0
}

/**
 * Get the effective cooldown for a source, considering adaptive multiplier.
 */
export async function getEffectiveCooldownMinutes(
  sourceSlug: string,
  baseCooldownMinutes: number | undefined
): Promise<number> {
  if (!baseCooldownMinutes) return 0

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('job_ingestion_state')
      .select('cooldown_multiplier')
      .eq('source', sourceSlug)
      .maybeSingle()

    if (error || !data) {
      return baseCooldownMinutes
    }

    const multiplier = data.cooldown_multiplier ?? 1.0
    return Math.round(baseCooldownMinutes * multiplier)
  } catch {
    return baseCooldownMinutes
  }
}

/**
 * Update adaptive cooldown state after an ingestion run.
 * Calls the database RPC to track consecutive high-noop runs.
 */
export async function updateAdaptiveState(
  sourceSlug: string,
  inserted: number,
  updated: number,
  noop: number
): Promise<{ multiplier: number; consecutiveHighNoop: number }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('update_ingestion_adaptive_state', {
      p_source: sourceSlug,
      p_inserted: inserted,
      p_updated: updated,
      p_noop: noop,
    })

    if (error) {
      console.warn(`ingestionAdaptive: RPC failed for ${sourceSlug}:`, error.message)
      // Fall back to local calculation
      return {
        multiplier: calculateCooldownMultiplier(inserted, updated, noop),
        consecutiveHighNoop: 0,
      }
    }

    if (data && data.length > 0) {
      const result = data[0]
      console.log(
        `ingestionAdaptive: ${sourceSlug} updated - multiplier=${result.new_cooldown_multiplier}, consecutive=${result.new_consecutive_high_noop}`
      )
      return {
        multiplier: result.new_cooldown_multiplier,
        consecutiveHighNoop: result.new_consecutive_high_noop,
      }
    }

    return { multiplier: 1.0, consecutiveHighNoop: 0 }
  } catch (err) {
    console.warn(`ingestionAdaptive: failed to update adaptive state for ${sourceSlug}`, err)
    return {
      multiplier: calculateCooldownMultiplier(inserted, updated, noop),
      consecutiveHighNoop: 0,
    }
  }
}

/**
 * Check if a source should be skipped due to adaptive cooldown.
 * Uses the multiplied cooldown period instead of the base.
 */
export async function shouldSkipDueToAdaptiveCooldown(
  sourceSlug: string,
  baseCooldownMinutes: number | undefined,
  lastRunAt: Date | null
): Promise<boolean> {
  if (!baseCooldownMinutes || !lastRunAt) return false

  const effectiveCooldown = await getEffectiveCooldownMinutes(sourceSlug, baseCooldownMinutes)
  const cooldownMs = effectiveCooldown * 60 * 1000
  const timeSinceLastRun = Date.now() - lastRunAt.getTime()

  if (timeSinceLastRun < cooldownMs) {
    const minutesRemaining = Math.round((cooldownMs - timeSinceLastRun) / 60000)
    console.log(
      `ingestionAdaptive: ${sourceSlug} in adaptive cooldown (${minutesRemaining}m remaining, effective=${effectiveCooldown}m)`
    )
    return true
  }

  return false
}

/**
 * Calculate source quality score based on recent performance.
 * Higher score = higher quality source that should run more frequently.
 *
 * @returns score 0-100
 */
export function calculateSourceScore(
  inserted: number,
  updated: number,
  noop: number,
  successRate: number = 1.0
): number {
  const total = inserted + updated + noop
  if (total === 0) return 50 // Neutral score for no data

  // Freshness ratio: what % of jobs are truly new
  const freshnessRatio = inserted / total

  // Uniqueness ratio: new + updated (changed data) vs noop
  const uniquenessRatio = (inserted + updated) / total

  // Weighted score:
  // - Freshness is most important (60%)
  // - Uniqueness matters (25%)
  // - Success rate matters (15%)
  const score =
    freshnessRatio * 60 + uniquenessRatio * 25 + successRate * 15

  return Math.round(Math.min(100, Math.max(0, score)))
}
