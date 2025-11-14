/**
 * Brave Search Provider for Relevnt AI System
 * 
 * Handles web searches for grounding job information and market data
 */

export interface SearchResult {
  title: string
  url: string
  description: string
}

export interface BraveSearchOptions {
  count?: number
  spellcheck?: boolean
  freshness?: 'all' | 'pd' | 'pw' | 'pm' | 'py'
}

export interface BraveSearchResponse {
  success: boolean
  results: SearchResult[]
  cost?: number
  error?: string
}

/**
 * Search the web using Brave Search API
 * 
 * Used for:
 * - Finding job postings
 * - Verifying company information
 * - Getting salary data
 * - Research for cover letters
 */
export async function searchBrave(
  query: string,
  options: BraveSearchOptions = {}
): Promise<BraveSearchResponse> {
  const apiKey = process.env.BRAVE_API_KEY
  if (!apiKey) {
    return {
      success: false,
      results: [],
      error: 'BRAVE_API_KEY not configured',
    }
  }

  const count = options.count || 10
  const freshness = options.freshness || 'pm'

  try {
    const searchParams = new URLSearchParams({
      q: query,
      count: count.toString(),
      freshness: freshness,
    })

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${searchParams}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Brave Search error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Extract results
    const results: SearchResult[] = (data.web?.results || []).map(
      (result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description,
      })
    )

    // Brave Search costs approximately $0.01 per query (estimated)
    const cost = 0.01

    return {
      success: true,
      results,
      cost,
    }
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export default { searchBrave }