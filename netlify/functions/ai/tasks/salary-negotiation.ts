/**
 * Task: Salary Negotiation Advisor
 * 
 * Provides salary negotiation strategies and market data
 */

import { callAnthropic } from '../providers/anthropic'
import { searchBrave } from '../providers/brave'

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
    // Search for market data
    const searchResults = await searchBrave(
      `${position} salary ${location} 2025 market rate`,
      { count: 5 }
    )

    const prompt = `Provide salary negotiation advice.

Position: ${position}
Company: ${company}
Location: ${location}
Experience: ${yourExperience}
${offerAmount ? `Current Offer: $${offerAmount}` : ''}

Market Research:
${searchResults.results.map((r) => r.title).join('\n')}

Provide advice in JSON:
{
  "marketRange": {
    "min": number,
    "max": number,
    "median": number,
    "currency": "USD"
  },
  "recommendedAsk": number,
  "negotiationStrategy": ["strategy1"],
  "redFlags": ["red_flag"],
  "benefits": ["benefit_to_request"]
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