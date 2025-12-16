/**
 * Task: Resume Analysis
 * 
 * Comprehensive resume analysis with ATS scoring and recommendations
 */

import { routeLegacyTask } from '../legacyTaskRouter'

// ============================================================================
// TYPES
// ============================================================================

export interface ResumeAnalysisResponse {
  success: boolean
  analysis?: {
    atsScore: number // 0-100
    overallAssessment: 'excellent' | 'good' | 'needs-improvement'
    strengths: string[]
    weaknesses: string[]
    suggestions: Array<{
      category: string
      priority: 'high' | 'medium' | 'low'
      suggestion: string
    }>
    estimatedInterviewRate: number // percentage
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Analyze resume comprehensively
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysisResponse> {
  try {
    const result = await routeLegacyTask('analyze-resume', { resumeText })

    if (!result.ok || !result.output) {
      throw new Error(result.error_message || 'AI routing failed')
    }

    const payload = (result.output as any).data || result.output
    const data = payload || {}

    return {
      success: true,
      analysis: {
        atsScore: data.atsScore || 0,
        overallAssessment: data.overallAssessment || 'needs-improvement',
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        suggestions: data.suggestions || [],
        estimatedInterviewRate: data.estimatedInterviewRate || 0,
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
const handler = analyzeResume

export { handler }
export default handler
