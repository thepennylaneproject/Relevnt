// netlify/functions/utils/jobDiscovery.ts
/**
 * Job Discovery Utilities
 *
 * Functions for discovering new companies and tracking observed titles
 * from ingested jobs. These enable the "growth flywheel" where the system
 * learns from ingested data.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Extract domain from a URL
 */
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Normalize a job title for comparison
 * Strips common prefixes/suffixes and normalizes whitespace
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    // Remove seniority levels
    .replace(/\b(senior|sr\.?|junior|jr\.?|lead|staff|principal|chief|head of)\b/gi, '')
    // Remove roman numerals
    .replace(/\b(i+|ii|iii|iv|v)\b$/gi, '')
    // Remove level indicators
    .replace(/\b(level\s*\d+|l\d+)\b/gi, '')
    // Clean up
    .replace(/[-–—]/g, ' ')
    .replace(/[()[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Track an observed job title for learning
 */
export async function trackObservedTitle(
  supabase: SupabaseClient,
  rawTitle: string
): Promise<void> {
  if (!rawTitle || rawTitle.length < 3) return

  const normalized = normalizeTitle(rawTitle)
  if (normalized.length < 3) return

  try {
    // Use RPC for atomic upsert
    await supabase.rpc('track_observed_title', {
      p_raw_title: rawTitle.slice(0, 255),
      p_normalized_title: normalized.slice(0, 255)
    })
  } catch (err) {
    // Don't fail ingestion if title tracking fails
    console.warn('[JobDiscovery] Failed to track title:', err)
  }
}

/**
 * Batch track multiple job titles
 */
export async function trackObservedTitles(
  supabase: SupabaseClient,
  titles: string[]
): Promise<void> {
  if (!titles.length) return

  // Dedupe and normalize
  const seen = new Set<string>()
  const uniqueTitles: { raw: string; normalized: string }[] = []

  for (const title of titles) {
    if (!title || title.length < 3) continue
    const normalized = normalizeTitle(title)
    if (normalized.length < 3 || seen.has(normalized)) continue
    seen.add(normalized)
    uniqueTitles.push({ raw: title.slice(0, 255), normalized: normalized.slice(0, 255) })
  }

  if (!uniqueTitles.length) return

  // Batch insert/update
  try {
    for (const { raw, normalized } of uniqueTitles.slice(0, 100)) { // Limit to 100 per batch
      await supabase.rpc('track_observed_title', {
        p_raw_title: raw,
        p_normalized_title: normalized
      })
    }
  } catch (err) {
    console.warn('[JobDiscovery] Failed to batch track titles:', err)
  }
}

/**
 * Process a company from an aggregator job
 * Creates company record if new, queues for ATS detection
 */
export async function processCompanyFromJob(
  supabase: SupabaseClient,
  companyName: string | null | undefined,
  companyUrl: string | null | undefined,
  sourceSlug: string
): Promise<string | null> {
  if (!companyName || companyName.length < 2) return null

  const domain = extractDomain(companyUrl)
  const normalizedName = companyName.trim()

  try {
    // Check if company already exists
    let companyQuery = supabase
      .from('companies')
      .select('id')
      .ilike('name', normalizedName)

    if (domain) {
      companyQuery = supabase
        .from('companies')
        .select('id')
        .or(`name.ilike.${normalizedName},domain.ilike.${domain}`)
    }

    const { data: existing } = await companyQuery.maybeSingle()

    if (existing) {
      return existing.id
    }

    // Create new company
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert({
        name: normalizedName,
        domain: domain,
        discovered_via: sourceSlug,
        discovered_at: new Date().toISOString(),
        priority_tier: 'low',
        is_active: true
      })
      .select('id')
      .single()

    if (insertError) {
      // Might be a race condition - try to fetch again
      const { data: retry } = await companyQuery.maybeSingle()
      return retry?.id || null
    }

    console.log(`[JobDiscovery] Created new company: ${normalizedName} (${domain})`)

    // Queue for ATS detection if we have a domain
    if (domain && newCompany) {
      await supabase.from('ats_detection_queue').insert({
        company_id: newCompany.id,
        domain: domain,
        status: 'pending'
      }).onConflict('company_id').ignore()
    }

    return newCompany?.id || null

  } catch (err) {
    console.warn('[JobDiscovery] Failed to process company:', err)
    return null
  }
}

/**
 * Check rate limit for a source before making a request
 */
export async function canMakeRequest(
  supabase: SupabaseClient,
  sourceSlug: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('can_make_source_request', {
      p_source_slug: sourceSlug
    })

    if (error) {
      console.warn('[JobDiscovery] Rate limit check failed:', error)
      return true // Default to allowing if check fails
    }

    return data === true
  } catch (err) {
    console.warn('[JobDiscovery] Rate limit check error:', err)
    return true
  }
}

/**
 * Record that a request was made to a source
 */
export async function recordRequest(
  supabase: SupabaseClient,
  sourceSlug: string
): Promise<void> {
  try {
    await supabase.rpc('increment_source_calls', {
      p_source_slug: sourceSlug
    })
  } catch (err) {
    console.warn('[JobDiscovery] Failed to record request:', err)
  }
}
