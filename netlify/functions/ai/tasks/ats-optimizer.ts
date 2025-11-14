/**
 * Task: ATS Optimizer
 * 
 * Optimizes resumes for Applicant Tracking System compatibility
 * Suggests keyword improvements, formatting fixes, etc.
 */

import { callDeepSeek } from '../providers/deepseek'

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
    const prompt = `Analyze this resume for ATS (Applicant Tracking System) compatibility.

Resume:
${resumeText}

Provide analysis in this JSON format:
{
  "currentScore": number 0-100,
  "optimizedScore": number 0-100 (what it could be),
  "improvements": ["improvement1"],
  "keywordGaps": ["missing_keyword"],
  "formattingIssues": ["issue1"],
  "readabilityCheck": "string"
}`

    const response = await callDeepSeek('deepseek-chat', [
      { role: 'user', content: prompt },
    ])

    if (!response.success) {
      throw new Error(response.error)
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }

    const analysis = JSON.parse(jsonMatch[0])

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