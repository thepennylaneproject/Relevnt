// netlify/functions/utils/ingestionRouting.ts
/**
 * Ingestion Routing Utilities
 * 
 * Provides 24h call signature tracking to prevent duplicate API calls.
 * Ensures the same (source, keywords, location, params) combination is only called once per 24 hours.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Build a deterministic signature from source and parameters.
 * Sorts keys alphabetically to ensure consistent signatures regardless of insertion order.
 */
export function buildCallSignature(
  sourceSlug: string,
  params: Record<string, any>
): string {
  // Filter out undefined/null values and normalize
  const cleanParams: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      // Normalize string values (lowercase, trim)
      if (typeof value === 'string') {
        cleanParams[key] = value.toLowerCase().trim()
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        cleanParams[key] = value
      } else if (typeof value === 'object') {
        // Stringify objects/arrays for consistent hashing
        cleanParams[key] = JSON.stringify(value)
      } else {
        cleanParams[key] = String(value)
      }
    }
  }

  // Sort keys for deterministic output
  const sortedKeys = Object.keys(cleanParams).sort()
  const parts = sortedKeys.map(k => `${k}=${cleanParams[k]}`)
  
  // Combine with source
  return `${sourceSlug}:${parts.join('&')}`
}

/**
 * Check if this call signature was made recently (within specified hours).
 * Returns true if call should be SKIPPED (i.e., it was made recently).
 */
export async function hasCalledRecently(
  supabase: SupabaseClient,
  sourceSlug: string,
  signature: string,
  hours: number = 24
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  
  const { data, error } = await supabase
    .from('job_ingestion_calls')
    .select('id, called_at')
    .eq('source', sourceSlug)
    .eq('signature', signature)
    .gte('called_at', cutoff)
    .limit(1)
    .maybeSingle()

  if (error) {
    // On error, log but allow the call to proceed (fail open)
    console.warn(`[IngestionRouting] Error checking call history for ${sourceSlug}:`, error.message)
    return false
  }

  if (data) {
    console.log(`[IngestionRouting] Skipping ${sourceSlug} - called ${Math.round((Date.now() - new Date(data.called_at).getTime()) / 1000 / 60)}m ago with same params`)
    return true
  }

  return false
}

/**
 * Record that a call was made with the given signature.
 * Uses upsert so subsequent calls with same signature update the timestamp.
 */
export async function recordCall(
  supabase: SupabaseClient,
  sourceSlug: string,
  signature: string,
  resultCount: number = 0
): Promise<void> {
  const { error } = await supabase
    .from('job_ingestion_calls')
    .upsert({
      source: sourceSlug,
      signature,
      called_at: new Date().toISOString(),
      result_count: resultCount
    }, {
      onConflict: 'source,signature'
    })

  if (error) {
    console.warn(`[IngestionRouting] Failed to record call for ${sourceSlug}:`, error.message)
  }
}

/**
 * Check and record in one operation.
 * Returns true if the call should proceed, false if it should be skipped.
 */
export async function shouldMakeCall(
  supabase: SupabaseClient,
  sourceSlug: string,
  params: Record<string, any>,
  hoursWindow: number = 24
): Promise<{ shouldProceed: boolean; signature: string }> {
  const signature = buildCallSignature(sourceSlug, params)
  
  const wasCalledRecently = await hasCalledRecently(supabase, sourceSlug, signature, hoursWindow)
  
  return {
    shouldProceed: !wasCalledRecently,
    signature
  }
}

/**
 * Get stats on call history for monitoring.
 */
export async function getCallStats(
  supabase: SupabaseClient,
  sourceSlug?: string,
  hours: number = 24
): Promise<{ source: string; call_count: number; total_results: number }[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  
  let query = supabase
    .from('job_ingestion_calls')
    .select('source')
    .gte('called_at', cutoff)

  if (sourceSlug) {
    query = query.eq('source', sourceSlug)
  }

  // Note: This is a simplified version - production would use a GROUP BY RPC
  const { data, error } = await query

  if (error) {
    console.error('[IngestionRouting] Failed to get call stats:', error.message)
    return []
  }

  // Aggregate in JS (should use SQL aggregation for production scale)
  const counts = new Map<string, number>()
  for (const row of data || []) {
    counts.set(row.source, (counts.get(row.source) || 0) + 1)
  }

  return Array.from(counts.entries()).map(([source, call_count]) => ({
    source,
    call_count,
    total_results: 0 // Would need additional query
  }))
}
