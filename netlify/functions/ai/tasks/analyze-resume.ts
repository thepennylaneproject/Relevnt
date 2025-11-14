/**
 * Task: Resume Analysis
 * 
 * Comprehensive resume analysis with ATS scoring and recommendations
 */

import { callAnthropic } from '../providers/anthropic'

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
    const prompt = `Analyze this resume professionally.

Resume:
${resumeText}

Provide comprehensive analysis in JSON:
{
  "atsScore": number 0-100,
  "overallAssessment": "excellent|good|needs-improvement",
  "strengths": ["strength1"],
  "weaknesses": ["weakness1"],
  "suggestions": [
    {"category": "category", "priority": "high", "suggestion": "string"}
  ],
  "estimatedInterviewRate": number 0-100
}`

    const response = await callAnthropic('claude-sonnet-4-20250514', [
      { role: 'user', content: prompt },
    ])

    if (!response.success) {
      throw new Error(response.error)
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }

    const data = JSON.parse(jsonMatch[0])

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