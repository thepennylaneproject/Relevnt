/**
 * Task: Probability Estimate
 *
 * Estimates chances of success for job applications
 */

import { routeLegacyTask } from '../legacyTaskRouter'

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
    const response = await routeLegacyTask('probability-estimate', {
      jobMatch,
      userExperience,
      skillGaps,
    })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const data = (response.output as any).data || response.output

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
