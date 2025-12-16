/**
 * Task: ATS Optimizer
 * 
 * Optimizes resumes for Applicant Tracking System compatibility
 * Suggests keyword improvements, formatting fixes, etc.
 */

import { routeLegacyTask } from '../legacyTaskRouter'

// ============================================================================
// TYPES
// ============================================================================

export interface ATSOptimizationResponse {
  success: boolean
  analysis?: {
    currentScore: number
    optimizedScore: number
    improvements: string[]
    keywordGaps: string[]
    formattingIssues: string[]
    readabilityCheck: string
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Analyze and optimize resume for ATS
 */
export async function optimizeForATS(resumeText: string): Promise<ATSOptimizationResponse> {
  try {
    const response = await routeLegacyTask('optimize-resume', { resumeText })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const analysis = (response.output as any).data || response.output

    return {
      success: true,
      analysis: {
        currentScore: analysis.currentScore || 0,
        optimizedScore: analysis.optimizedScore || 0,
        improvements: analysis.improvements || [],
        keywordGaps: analysis.keywordGaps || [],
        formattingIssues: analysis.formattingIssues || [],
        readabilityCheck: analysis.readabilityCheck || '',
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
const handler = optimizeForATS

export { handler }
export default handler
