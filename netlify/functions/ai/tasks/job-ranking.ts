/**
 * Task: Job Ranking
 * 
 * Ranks jobs by fit to user profile (0-100 scale)
 * Considers: skills match, location, salary, growth potential
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
  salary?: { min: number; max: number }
}

export interface UserProfile {
  skills: string[]
  experience: string
  currentLocation: string
  salaryExpectation: { min: number; max: number }
  targetRoles: string[]
}

export interface JobRankingResponse {
  success: boolean
  score?: number // 0-100
  reasoning?: string
  strongMatches?: string[]
  gaps?: string[]
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Rank a job by fit to user profile
 */
export async function rankJob(job: ExtractedJob, profile: UserProfile): Promise<JobRankingResponse> {
  try {
    const response = await routeLegacyTask('rank-jobs', { job, profile })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const data = (response.output as any).data || response.output

    return {
      success: true,
      score: data.score,
      reasoning: data.reasoning,
      strongMatches: data.strongMatches,
      gaps: data.gaps,
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
const handler = rankJob

export { handler }
export default handler
