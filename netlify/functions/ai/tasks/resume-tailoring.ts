/**
 * Task: Resume Tailoring for Job
 * 
 * Generates targeted resume suggestions by comparing resume content
 * against a specific job description.
 */

import { routeLegacyTask } from '../legacyTaskRouter'

// ============================================================================
// TYPES
// ============================================================================

export interface TailoringSuggestion {
  bulletId: string
  currentText: string
  suggestedText: string
  reasoning: string
  relevantKeyword: string
  confidence: number // 0-1
}

export interface ResumeTailoringRequest {
  resumeText: string
  resumeBullets: Array<{ id: string; text: string }>
  jobTitle: string
  jobDescription: string
  company: string
}

export interface ResumeTailoringResponse {
  success: boolean
  tailoring?: {
    keyRequirements: string[]
    missingKeywords: string[]
    suggestions: TailoringSuggestion[]
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Generate tailored resume suggestions for a specific job
 */
export async function tailorResumeForJob(
  request: ResumeTailoringRequest
): Promise<ResumeTailoringResponse> {
  try {
    const response = await routeLegacyTask('tailor-resume-for-job', {
      resumeText: request.resumeText,
      resumeBullets: request.resumeBullets,
      jobTitle: request.jobTitle,
      jobDescription: request.jobDescription,
      company: request.company,
    })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const data = (response.output as any).data || response.output

    return {
      success: true,
      tailoring: {
        keyRequirements: data.keyRequirements || [],
        missingKeywords: data.missingKeywords || [],
        suggestions: data.suggestions || [],
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
const handler = tailorResumeForJob

export { handler }
export default handler
