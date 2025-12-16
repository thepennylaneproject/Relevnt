/**
 * Task: Cover Letter Generation
 * 
 * Generates tailored cover letters for specific jobs
 */

import { routeLegacyTask } from '../legacyTaskRouter'

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedJob {
  title: string
  company: string
  location: string
  requirements: string[]
  responsibilities: string[]
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  experience: string
  skills: string[]
  achievements: string[]
  targetRole: string
}

export interface CoverLetterResponse {
  success: boolean
  draft?: string
  keyPoints?: string[]
  keywords?: string[]
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Generate a tailored cover letter
 */
export async function generateCoverLetter(
  jobData: ExtractedJob,
  userProfile: UserProfile
): Promise<CoverLetterResponse> {
  try {
    const response = await routeLegacyTask('generate-cover-letter', {
      job: jobData,
      user: userProfile,
    })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const payload = (response.output as any).data || response.output

    // Extract key points from the job and profile
    const keyPoints = [
      ...jobData.requirements.slice(0, 3),
      ...userProfile.skills.slice(0, 2),
    ]

    return {
      success: true,
      draft: payload.coverLetter || payload.draft || '',
      keyPoints,
      keywords: jobData.requirements.slice(0, 5),
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
const handler = generateCoverLetter

export { handler }
export default handler
