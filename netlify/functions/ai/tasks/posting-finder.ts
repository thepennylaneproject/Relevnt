/**
 * Task: Posting Finder
 * 
 * Verifies job posting authenticity and finds official URLs
 */

import { routeLegacyTask } from '../legacyTaskRouter'

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
    const response = await routeLegacyTask('posting-finder', { jobTitle, company, location })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const posting = (response.output as any).data || response.output

    return {
      success: true,
      posting: {
        officialUrl: posting.url || posting.officialUrl || '',
        isOfficial: Boolean(posting.isOfficial ?? posting.verified ?? posting.url),
        source: posting.source || 'other',
        verified: Boolean(posting.verified ?? posting.isOfficial),
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
