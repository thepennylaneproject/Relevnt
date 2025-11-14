/**
 * Task: Probability Estimate
 * 
 * Estimates chances of success for job applications
 */

import { callDeepSeek } from '../providers/deepseek'

// ============================================================================
// TYPES
// ============================================================================

export interface ProbabilityResponse {
  success: boolean
  estimate?: {
    probability: number // 0-1 (0-100%)
    factors: string[]
    recommendations: string[]
    explanation: string
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Estimate probability of interview/offer
 */
export async function estimateProbability(
  jobMatch: number, // 0-100 from job ranking
  userExperience: string,
  skillGaps: string[]
): Promise<ProbabilityResponse> {
  try {
    const prompt = `Estimate interview probability (0-1 scale).

Job Match Score: ${jobMatch}%

User Experience:
${userExperience}

Skill Gaps:
${skillGaps.join(', ')}

Provide estimate in JSON:
{
  "probability": number 0-1,
  "factors": ["positive_factor"],
  "recommendations": ["what_to_do"],
  "explanation": "detailed explanation"
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

    const data = JSON.parse(jsonMatch[0])

    return {
      success: true,
      estimate: {
        probability: Math.min(1, Math.max(0, data.probability || 0)),
        factors: data.factors || [],
        recommendations: data.recommendations || [],
        explanation: data.explanation || '',
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
const handler = estimateProbability

export { handler }
export default handler