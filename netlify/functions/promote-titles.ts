// netlify/functions/promote-titles.ts
/**
 * Promote Titles
 *
 * Weekly function that promotes frequently-seen job titles to the search deck.
 * This creates a learning loop where the system discovers new search terms
 * from ingested jobs.
 *
 * Logic:
 * 1. Find titles in observed_titles with occurrence_count >= 10
 * 2. Filter out titles already in the search deck
 * 3. Add top 5 to search_queue for all active sources
 * 4. Mark them as promoted
 */
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'

const MIN_OCCURRENCES = 10
const MAX_TO_PROMOTE = 5

export const handler: Handler = async (event) => {
  const startedAt = Date.now()
  const supabase = createAdminClient()

  console.log('[PromoteTitles] Starting weekly title promotion')

  try {
    // Use the RPC function to promote titles
    const { data: promotedCount, error } = await supabase
      .rpc('promote_popular_titles_to_search_deck', {
        p_min_occurrences: MIN_OCCURRENCES,
        p_max_to_promote: MAX_TO_PROMOTE
      })

    if (error) {
      throw new Error(`RPC failed: ${error.message}`)
    }

    // Get some stats
    const { data: stats } = await supabase
      .from('observed_titles')
      .select('*')
      .gte('occurrence_count', MIN_OCCURRENCES)
      .order('occurrence_count', { ascending: false })
      .limit(10)

    const topTitles = stats?.map(t => ({
      title: t.normalized_title,
      count: t.occurrence_count,
      inDeck: t.is_in_search_deck
    })) || []

    const durationMs = Date.now() - startedAt
    console.log(`[PromoteTitles] Promoted ${promotedCount} titles in ${durationMs}ms`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        durationMs,
        promoted: promotedCount,
        topObservedTitles: topTitles
      })
    }

  } catch (err) {
    console.error('[PromoteTitles] Failed:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }
}

// Run weekly on Sunday at 4am UTC
export const config: Config = {
  schedule: '0 4 * * 0'
}
