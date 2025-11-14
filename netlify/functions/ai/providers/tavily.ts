/**
 * Tavily Search Provider for Relevnt AI System
 * 
 * Alternative search provider for web grounding and research
 */

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilySearchOptions {
  maxResults?: number
  includeAnswer?: boolean
  searchDepth?: 'basic' | 'advanced'
  topic?: 'general' | 'news'
}

export interface TavilySearchResponse {
  success: boolean
  results: TavilySearchResult[]
  answer?: string
  cost?: number
  error?: string
}

/**
 * Search using Tavily API
 * 
 * Alternative to Brave Search with AI-optimized results
 */
export async function searchTavily(
  query: string,
  options: TavilySearchOptions = {}
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    return {
      success: false,
      results: [],
      error: 'TAVILY_API_KEY not configured',
    }
  }

  const maxResults = options.maxResults || 5
  const includeAnswer = options.includeAnswer ?? true
  const searchDepth = options.searchDepth || 'basic'
  const topic = options.topic || 'general'

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: maxResults,
        include_answer: includeAnswer,
        search_depth: searchDepth,
        topic: topic,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Tavily Search error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Extract results
    const results: TavilySearchResult[] = (data.results || []).map(
      (result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score || 0,
      })
    )

    // Tavily pricing: $0.005 per basic search, $0.05 per advanced
    const cost = searchDepth === 'advanced' ? 0.05 : 0.005

    return {
      success: true,
      results,
      answer: data.answer,
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

export default { searchTavily }