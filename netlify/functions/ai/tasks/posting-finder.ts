/**
 * Task: Posting Finder
 * 
 * Verifies job posting authenticity and finds official URLs
 */

import { searchBrave } from '../providers/brave'

// ============================================================================
// TYPES
// ============================================================================

export interface PostingFinderResponse {
  success: boolean
  posting?: {
    officialUrl: string
    isOfficial: boolean
    source: 'company' | 'linkedin' | 'indeed' | 'other'
    verified: boolean
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Find official job posting URL
 */
export async function findOfficialPosting(
  jobTitle: string,
  company: string,
  location: string
): Promise<PostingFinderResponse> {
  try {
    const query = `"${company}" "${jobTitle}" hiring ${location} site:company OR site:linkedin OR site:indeed`

    const results = await searchBrave(query, { count: 5 })

    if (!results.success) {
      throw new Error('Search failed')
    }

    let bestResult = results.results[0]
    let isOfficial = false
    let source: 'company' | 'linkedin' | 'indeed' | 'other' = 'other'

    for (const result of results.results) {
      if (result.url.includes('linkedin.com/jobs')) {
        bestResult = result
        isOfficial = true
        source = 'linkedin'
        break
      }
      if (result.url.includes('careers.')) {
        bestResult = result
        isOfficial = true
        source = 'company'
        break
      }
    }

    return {
      success: true,
      posting: {
        officialUrl: bestResult?.url || '',
        isOfficial,
        source,
        verified: isOfficial,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Export task handler
 */
const handler = findOfficialPosting

export { handler }
export default handler