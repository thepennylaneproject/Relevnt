/**
 * Task: Salary Negotiation Advisor
 *
 * Provides salary negotiation strategies and market data
 */

import { routeLegacyTask } from '../legacyTaskRouter'

// ============================================================================
// TYPES
// ============================================================================

export interface SalaryNegotiationResponse {
  success: boolean
  advice?: {
    marketRange: {
      min: number
      max: number
      median: number
      currency: string
    }
    recommendedAsk: number
    negotiationStrategy: string[]
    redFlags: string[]
    benefits: string[]
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Get salary negotiation advice
 */
export async function adviseSalaryNegotiation(
  position: string,
  company: string,
  location: string,
  yourExperience: string,
  offerAmount?: number
): Promise<SalaryNegotiationResponse> {
  try {
    const response = await routeLegacyTask('salary-negotiation', {
      position,
      company,
      location,
      yourExperience,
      offerAmount,
    })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const data = (response.output as any).data || response.output

    return {
      success: true,
      advice: {
        marketRange: {
          min: data.marketRange?.min || 0,
          max: data.marketRange?.max || 0,
          median: data.marketRange?.median || 0,
          currency: data.marketRange?.currency || 'USD',
        },
        recommendedAsk: data.recommendedAsk || 0,
        negotiationStrategy: data.negotiationStrategy || [],
        redFlags: data.redFlags || [],
        benefits: data.benefits || [],
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
const handler = adviseSalaryNegotiation

export { handler }
export default handler
