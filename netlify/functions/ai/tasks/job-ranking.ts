/**
 * Task: Job Ranking
 * 
 * Ranks jobs by fit to user profile (0-100 scale)
 * Considers: skills match, location, salary, growth potential
 */

import { callDeepSeek } from '../providers/deepseek'

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
    const prompt = `Score this job fit for a user (0-100 scale).

Job:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Requirements: ${job.requirements.join(', ')}
- Salary: $${job.salary?.min}-${job.salary?.max}

User Profile:
- Skills: ${profile.skills.join(', ')}
- Experience: ${profile.experience}
- Location: ${profile.currentLocation}
- Salary Expectation: $${profile.salaryExpectation.min}-${profile.salaryExpectation.max}
- Target Roles: ${profile.targetRoles.join(', ')}

Respond with ONLY this JSON:
{
  "score": number 0-100,
  "reasoning": "why",
  "strongMatches": ["match1"],
  "gaps": ["gap1"]
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