// netlify/functions/generate-search-slices.ts
/**
 * Generate Search Slices
 *
 * Creates search_queue entries from title_families and aggregator_sources.
 * Respects source capabilities (is_remote_only for location filtering).
 *
 * This function:
 * 1. Gets active sources from aggregator_sources
 * 2. Gets active title families from title_families
 * 3. Generates search slices for each combination (respecting source capabilities)
 * 4. Upserts to search_queue
 *
 * Run manually or scheduled weekly to refresh the search deck.
 */
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

interface AggregatorSource {
  slug: string
  name: string
  supports_location_filter: boolean
  is_remote_only: boolean
  is_active: boolean
}

interface TitleFamily {
  id: string
  family_name: string
  keywords: string[]
  is_active: boolean
}

interface SearchSlice {
  source_slug: string
  keywords: string
  location: string
  min_interval_minutes: number
  priority: number
  status: string
}

// Locations for geo-aware sources
const GEO_LOCATIONS = ['US', 'UK', 'Canada', 'remote']

export const handler: Handler = async (event) => {
  const startedAt = Date.now()
  const supabase = createAdminClient()

  console.log('[GenerateSearchSlices] Starting slice generation')

  try {
    // 1. Get active sources
    const { data: sources, error: sourcesError } = await supabase
      .from('aggregator_sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`)
    }

    if (!sources || sources.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No active sources found',
          created: 0,
          skipped: 0
        })
      }
    }

    console.log(`[GenerateSearchSlices] Found ${sources.length} active sources`)

    // 2. Get title families
    const { data: families, error: familiesError } = await supabase
      .from('title_families')
      .select('*')
      .eq('is_active', true)

    if (familiesError) {
      throw new Error(`Failed to fetch title families: ${familiesError.message}`)
    }

    if (!families || families.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No active title families found',
          created: 0,
          skipped: 0
        })
      }
    }

    console.log(`[GenerateSearchSlices] Found ${families.length} title families with ${families.reduce((sum, f) => sum + (f.keywords?.length || 0), 0)} keywords`)

    // 3. Generate slices
    const slices: SearchSlice[] = []
    let skipped = 0

    for (const source of sources as AggregatorSource[]) {
      // Determine locations based on source capabilities
      const locations = source.is_remote_only ? ['remote'] : GEO_LOCATIONS

      for (const family of families as TitleFamily[]) {
        for (const keyword of family.keywords || []) {
          for (const location of locations) {
            slices.push({
              source_slug: source.slug,
              keywords: keyword,
              location: location,
              min_interval_minutes: 720, // 12 hours default
              priority: 50,
              status: 'pending'
            })
          }
        }
      }
    }

    console.log(`[GenerateSearchSlices] Generated ${slices.length} potential slices`)

    // 4. Batch upsert to search_queue
    // Process in chunks to avoid hitting Supabase limits
    const CHUNK_SIZE = 500
    let created = 0

    for (let i = 0; i < slices.length; i += CHUNK_SIZE) {
      const chunk = slices.slice(i, i + CHUNK_SIZE)

      const { error: upsertError, count } = await supabase
        .from('search_queue')
        .upsert(chunk, {
          onConflict: 'source_slug,keywords,location',
          ignoreDuplicates: true,
          count: 'exact'
        })

      if (upsertError) {
        console.error(`[GenerateSearchSlices] Upsert chunk failed:`, upsertError.message)
        skipped += chunk.length
      } else {
        created += count || 0
        skipped += chunk.length - (count || 0)
      }
    }

    // 5. Get final count
    const { count: totalCount } = await supabase
      .from('search_queue')
      .select('*', { count: 'exact', head: true })

    const durationMs = Date.now() - startedAt
    console.log(`[GenerateSearchSlices] Completed: ${created} created, ${skipped} skipped, ${totalCount} total slices in queue`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        durationMs,
        created,
        skipped,
        totalInQueue: totalCount,
        sourcesProcessed: sources.length,
        familiesProcessed: families.length
      })
    }

  } catch (err) {
    console.error('[GenerateSearchSlices] Fatal error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }
}
