// netlify/functions/utils/ingestionRotation.ts
/**
 * Ingestion Rotation Utilities
 *
 * Provides functions for selecting and updating rotation targets:
 * - company_targets: ATS companies (Lever/Greenhouse) with per-company scheduling
 * - search_slices: Aggregator queries with adaptive cooling/warming
 *
 * Core principle: "high frequency, low repetition"
 * - Scheduler runs frequently (every 15 min)
 * - Each run pulls from a ROTATING QUEUE, not "all sources again"
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export interface CompanyTarget {
  id: string
  platform: 'lever' | 'greenhouse' | 'ashby' | 'smartrecruiters' | 'workday' | 'recruitee' | 'breezyhr' | 'jazzhr' | 'personio'
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
  consecutive_empty_runs: number
  total_jobs_found: number
}

export interface SearchSlice {
  id: string
  source: string
  query_hash: string
  params_json: {
    keywords?: string
    location?: string
    days_back?: number
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
}

// =============================================================================
// COMPANY TARGETS (ATS: Lever/Greenhouse)
// =============================================================================

/**
 * Get eligible company targets for ingestion.
 * Returns companies where:
 *   - status = 'active'
 *   - next_allowed_at is NULL or <= now()
 * Ordered by priority (lower = higher priority), then staleness.
 */
export async function getEligibleCompanyTargets(
  supabase: SupabaseClient,
  maxTargets: number,
  platform?: CompanyTarget['platform']
): Promise<CompanyTarget[]> {
  try {
    let query = supabase
      .from('company_targets')
      .select('*')
      .eq('status', 'active')
      .or('next_allowed_at.is.null,next_allowed_at.lte.now()')
      .order('priority', { ascending: true })
      .order('last_success_at', { ascending: true, nullsFirst: true })
      .limit(maxTargets)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) {
      console.error('[IngestionRotation] Error fetching company targets:', error.message)
      return []
    }

    console.log(`[IngestionRotation] Found ${data?.length ?? 0} eligible company targets${platform ? ` for ${platform}` : ''}`)
    return (data as CompanyTarget[]) || []
  } catch (err) {
    console.error('[IngestionRotation] Exception in getEligibleCompanyTargets:', err)
    return []
  }
}

/**
 * Update a company target after successful ingestion.
 * Uses the SQL RPC function for atomic update with cooling/warming.
 */
export async function updateCompanyTargetSuccess(
  supabase: SupabaseClient,
  targetId: string,
  newJobsCount: number
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('update_company_target_success', {
      p_target_id: targetId,
      p_new_jobs_count: newJobsCount,
    })

    if (error) {
      console.warn(`[IngestionRotation] Failed to update target success for ${targetId}:`, error.message)
      return
    }

    if (data && data.length > 0) {
      const result = data[0]
      console.log(
        `[IngestionRotation] Updated target ${targetId}: ${newJobsCount} new jobs, ` +
        `interval=${result.new_interval_minutes}m, consecutive_empty=${result.new_consecutive_empty}`
      )
    } else {
      console.log(`[IngestionRotation] Updated target ${targetId} success: ${newJobsCount} new jobs`)
    }
  } catch (err) {
    console.error(`[IngestionRotation] Exception updating target success:`, err)
  }
}

/**
 * Update a company target after failed ingestion.
 * Applies exponential backoff via SQL RPC.
 */
export async function updateCompanyTargetFailure(
  supabase: SupabaseClient,
  targetId: string,
  errorMessage: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_company_target_failure', {
      p_target_id: targetId,
      p_error_message: errorMessage.slice(0, 500), // Truncate long errors
    })

    if (error) {
      console.warn(`[IngestionRotation] Failed to update target failure for ${targetId}:`, error.message)
      return
    }

    console.log(`[IngestionRotation] Updated target ${targetId} failure: ${errorMessage.slice(0, 100)}`)
  } catch (err) {
    console.error(`[IngestionRotation] Exception updating target failure:`, err)
  }
}

// =============================================================================
// SEARCH SLICES (Aggregators)
// =============================================================================

/**
 * Get eligible search slices for ingestion.
 * Returns slices where:
 *   - status = 'active'
 *   - next_allowed_at is NULL or <= now()
 * Ordered by staleness (oldest first).
 */
export async function getEligibleSearchSlices(
  supabase: SupabaseClient,
  maxSlices: number,
  source?: string
): Promise<SearchSlice[]> {
  try {
    let query = supabase
      .from('search_slices')
      .select('*')
      .eq('status', 'active')
      .or('next_allowed_at.is.null,next_allowed_at.lte.now()')
      .order('last_success_at', { ascending: true, nullsFirst: true })
      .limit(maxSlices)

    if (source) {
      query = query.eq('source', source)
    }

    const { data, error } = await query

    if (error) {
      console.error('[IngestionRotation] Error fetching search slices:', error.message)
      return []
    }

    console.log(`[IngestionRotation] Found ${data?.length ?? 0} eligible search slices${source ? ` for ${source}` : ''}`)
    return (data as SearchSlice[]) || []
  } catch (err) {
    console.error('[IngestionRotation] Exception in getEligibleSearchSlices:', err)
    return []
  }
}

/**
 * Update a search slice after successful ingestion.
 * Uses the SQL RPC for cooling/warming logic.
 */
export async function updateSearchSliceSuccess(
  supabase: SupabaseClient,
  sliceId: string,
  resultCount: number,
  newJobsCount: number
): Promise<{ newIntervalMinutes: number; consecutiveEmpty: number } | null> {
  try {
    // First update result_count_last
    await supabase
      .from('search_slices')
      .update({ result_count_last: resultCount })
      .eq('id', sliceId)

    // Then apply cooling/warming via RPC
    const { data, error } = await supabase.rpc('apply_slice_cooling_warming', {
      p_slice_id: sliceId,
      p_new_jobs_count: newJobsCount,
    })

    if (error) {
      console.warn(`[IngestionRotation] Failed to apply cooling/warming for slice ${sliceId}:`, error.message)
      return null
    }

    const result = data?.[0]
    if (result) {
      console.log(
        `[IngestionRotation] Slice ${sliceId}: ${newJobsCount} new jobs, interval now ${result.new_interval_minutes}min, consecutive empty: ${result.new_consecutive_empty}`
      )
      return {
        newIntervalMinutes: result.new_interval_minutes,
        consecutiveEmpty: result.new_consecutive_empty,
      }
    }

    return null
  } catch (err) {
    console.error(`[IngestionRotation] Exception updating slice success:`, err)
    return null
  }
}

/**
 * Update a search slice after failed ingestion.
 */
export async function updateSearchSliceFailure(
  supabase: SupabaseClient,
  sliceId: string,
  errorMessage: string
): Promise<void> {
  try {
    const { data: slice } = await supabase
      .from('search_slices')
      .select('fail_count, min_interval_minutes')
      .eq('id', sliceId)
      .single()

    if (!slice) return

    const failCount = (slice.fail_count || 0) + 1
    const backoffMultiplier = Math.min(Math.pow(2, Math.min(failCount - 1, 3)), 8)
    const nextAllowedAt = new Date(
      Date.now() + slice.min_interval_minutes * backoffMultiplier * 60 * 1000
    ).toISOString()

    const { error } = await supabase
      .from('search_slices')
      .update({
        fail_count: failCount,
        last_error: errorMessage.slice(0, 500),
        next_allowed_at: nextAllowedAt,
        status: failCount >= 5 ? 'bad' : 'active',
      })
      .eq('id', sliceId)

    if (error) {
      console.warn(`[IngestionRotation] Failed to update slice failure:`, error.message)
      return
    }

    console.log(`[IngestionRotation] Slice ${sliceId} failed (${failCount}x): ${errorMessage.slice(0, 100)}`)
  } catch (err) {
    console.error(`[IngestionRotation] Exception updating slice failure:`, err)
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Build a query hash from search parameters.
 * Used for creating new slices or matching existing ones.
 */
export function buildQueryHash(source: string, params: Record<string, any>): string {
  // Sort keys for determinism
  const sortedKeys = Object.keys(params).sort()
  const normalized = sortedKeys
    .map((k) => `${k}=${String(params[k] ?? '').toLowerCase().trim()}`)
    .join(':')

  // Simple hash (same logic as MD5 in SQL for consistency)
  let hash = 0
  const input = `${source}:${normalized}`
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Create or update a search slice.
 * Upserts based on (source, query_hash).
 */
export async function upsertSearchSlice(
  supabase: SupabaseClient,
  source: string,
  params: { keywords?: string; location?: string; [key: string]: any }
): Promise<string | null> {
  try {
    const queryHash = buildQueryHash(source, params)

    const { data, error } = await supabase
      .from('search_slices')
      .upsert(
        {
          source,
          query_hash: queryHash,
          params_json: params,
          status: 'active',
        },
        { onConflict: 'source,query_hash' }
      )
      .select('id')
      .single()

    if (error) {
      console.error('[IngestionRotation] Failed to upsert search slice:', error.message)
      return null
    }

    return data?.id ?? null
  } catch (err) {
    console.error('[IngestionRotation] Exception upserting search slice:', err)
    return null
  }
}

/**
 * Get summary statistics for monitoring.
 */
export async function getRotationStats(
  supabase: SupabaseClient
): Promise<{
  companyTargets: { total: number; active: number; bad: number }
  searchSlices: { total: number; active: number; cooling: number }
}> {
  const [targetStats, sliceStats] = await Promise.all([
    supabase.from('company_targets').select('status', { count: 'exact', head: false }),
    supabase.from('search_slices').select('status, consecutive_empty_runs', { count: 'exact', head: false }),
  ])

  const targets = targetStats.data || []
  const slices = sliceStats.data || []

  return {
    companyTargets: {
      total: targets.length,
      active: targets.filter((t) => t.status === 'active').length,
      bad: targets.filter((t) => t.status === 'bad').length,
    },
    searchSlices: {
      total: slices.length,
      active: slices.filter((s) => s.status === 'active').length,
      cooling: slices.filter((s) => (s as any).consecutive_empty_runs >= 3).length,
    },
  }
}
