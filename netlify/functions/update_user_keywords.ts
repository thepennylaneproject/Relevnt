import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

/**
 * Relevnt: update_user_keywords
 *
 * v1: deterministic keyword extraction from profile + resume text.
 * v2: we layer in LLM-based enrichment (role classification, semantic tags)
 *     without changing the external contract.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[update_user_keywords] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. ' +
    'Function will throw on first request.'
  )
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  // we type-cast to keep TS happy; we guard at runtime below
  : (null as any)

type Payload = {
  user_id: string
  profile_summary?: string
  headline?: string
  skills?: string[]
  resume_text?: string
}

type KeywordVector = Record<string, number>

/**
 * Small English stopword set.
 * We just want to keep obvious noise out of the vector.
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'over', 'about', 'your',
  'you', 'our', 'their', 'they', 'are', 'was', 'were', 'will', 'shall', 'have', 'has',
  'had', 'can', 'could', 'should', 'would', 'a', 'an', 'of', 'in', 'on', 'at', 'as', 'to',
  'by', 'is', 'it', 'we', 'us', 'or', 'be', 'not', 'no', 'but'
])

/**
 * Normalize text:
 *  - lowercase
 *  - strip punctuation
 *  - collapse whitespace
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+/#&\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract a light-weight keyword frequency vector from free text.
 * We keep only moderately frequent terms and scale weights into [0, 1].
 */
function extractKeywordVector(text: string): KeywordVector {
  const normalized = normalizeText(text)
  if (!normalized) return {}

  const counts = new Map<string, number>()

  for (const raw of normalized.split(' ')) {
    const token = raw.trim()
    if (!token) continue
    if (STOPWORDS.has(token)) continue
    if (token.length < 3) continue

    counts.set(token, (counts.get(token) || 0) + 1)
  }

  if (!counts.size) return {}

  const maxCount = Math.max(...counts.values())
  const vector: KeywordVector = {}

  for (const [term, count] of counts.entries()) {
    const weight = count / maxCount
    // Non-linear boost so top words stand out more
    vector[term] = Math.round(Math.pow(weight, 0.7) * 1000) / 1000
  }

  return vector
}

/**
 * Merge multiple keyword vectors, keeping the maximum weight for each term.
 */
function mergeVectors(vectors: KeywordVector[]): KeywordVector {
  const merged: KeywordVector = {}
  for (const vec of vectors) {
    for (const [term, weight] of Object.entries(vec)) {
      const existing = merged[term] ?? 0
      merged[term] = weight > existing ? weight : existing
    }
  }
  return merged
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify(body)
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true })
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' })
  }

  if (!supabase) {
    return jsonResponse(500, {
      error: 'Supabase client is not configured on the server.'
    })
  }

  let payload: Payload
  try {
    payload = event.body ? JSON.parse(event.body) : {}
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' })
  }

  const { user_id, profile_summary, headline, skills, resume_text } = payload

  if (!user_id) {
    return jsonResponse(400, { error: 'Missing required field: user_id.' })
  }

  const textChunks: string[] = []

  if (headline) textChunks.push(headline)
  if (profile_summary) textChunks.push(profile_summary)
  if (Array.isArray(skills) && skills.length) {
    textChunks.push(skills.join(' '))
  }
  if (resume_text) textChunks.push(resume_text)

  if (!textChunks.length) {
    return jsonResponse(400, {
      error: 'No textual content provided to build keyword profile.',
      hint: 'Include at least one of: profile_summary, headline, skills, resume_text.'
    })
  }

  const combinedText = textChunks.join('\n\n')

  // v1: deterministic vector
  const baseVector = extractKeywordVector(combinedText)

  // v2 hybrid: this is where we will inject LLM-based enrichment:
  //  - role categories
  //  - semantic tags
  //  - inferred strengths
  // For now, we simply keep the deterministic vector.
  const finalVector = mergeVectors([baseVector])

  // Database currently expects a JSON array of keywords, not an object map.
  const keywordList = Object.keys(finalVector)

  try {
    const { error } = await supabase
      .from('user_keywords')
      .upsert(
        {
          user_id,
          keywords: keywordList,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
    if (error) {
      console.error('[update_user_keywords] Supabase upsert error', error)
      return jsonResponse(500, {
        error: 'Failed to persist user keyword vector.',
        details: error.message
      })
    }

    return jsonResponse(200, {
      ok: true,
      user_id,
      keywords: finalVector
    })
  } catch (err: any) {
    console.error('[update_user_keywords] Unexpected error', err)
    return jsonResponse(500, {
      error: 'Unexpected error while updating user keywords.',
      details: err?.message ?? String(err)
    })
  }
}