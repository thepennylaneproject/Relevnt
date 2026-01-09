// netlify/functions/adjust-intervals.ts
/**
 * Adjust Intervals - Daily Adaptive Scheduling
 *
 * Runs daily to adjust min_interval_minutes for search slices and company targets:
 * - Warm up: Reduce intervals for high-yield sources (found 5+ jobs)
 * - Cool down: Increase intervals for empty sources (3+ consecutive empty runs)
 *
 * This creates a feedback loop that prioritizes productive searches
 * while reducing load on unproductive ones.
 */
import type { Config } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

export default async () => {
  const startedAt = Date.now()
  const supabase = createAdminClient()

  console.log('[AdjustIntervals] Starting daily interval adjustment')

  try {
    // 1. Warm up high-yield slices (reduce interval)
    const { data: warmupResult, error: warmupError } = await supabase
      .rpc('warm_up_productive_slices')

    if (warmupError) {
      console.error('[AdjustIntervals] Warmup failed:', warmupError.message)
    } else if (warmupResult && warmupResult.length > 0) {
      const { slices_warmed, targets_warmed } = warmupResult[0]
      console.log(`[AdjustIntervals] Warmed up ${slices_warmed} slices, ${targets_warmed} company targets`)
    }

    // 2. Cool down empty slices (increase interval)
    const { data: cooldownResult, error: cooldownError } = await supabase
      .rpc('cool_down_empty_slices')

    if (cooldownError) {
      console.error('[AdjustIntervals] Cooldown failed:', cooldownError.message)
    } else if (cooldownResult && cooldownResult.length > 0) {
      const { slices_cooled, targets_cooled } = cooldownResult[0]
      console.log(`[AdjustIntervals] Cooled down ${slices_cooled} slices, ${targets_cooled} company targets`)
    }

    // 3. Log summary statistics
    const { data: stats } = await supabase.rpc('get_interval_stats')
    if (stats) {
      console.log('[AdjustIntervals] Current stats:', stats)
    }

    const durationMs = Date.now() - startedAt
    console.log(`[AdjustIntervals] Completed in ${durationMs}ms`)

    return new Response(JSON.stringify({
      success: true,
      durationMs,
      warmup: warmupResult?.[0] || {},
      cooldown: cooldownResult?.[0] || {}
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[AdjustIntervals] Failed:', err)
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startedAt
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Run daily at 3am UTC
export const config: Config = {
  schedule: '0 3 * * *'
}
