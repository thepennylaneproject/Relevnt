/**
 * ============================================================================
 * EXPERIENCE SCORE
 * ============================================================================
 * Score experience level alignment between user and job.
 * 
 * Scoring (0-10):
 * - Perfect match: 10 points
 * - One level off: 6-8 points
 * - Overqualified: 4-6 points (slight penalty)
 * - Underqualified: 0-4 points (significant penalty)
 * ============================================================================
 */

import type { FactorResult } from '../types'
import type { SeniorityLevel } from '../../../shared/types'
import { matchSeniority } from '../seniorityMatcher'
import { MAX_SCORES } from '../types'

/**
 * Score experience level match.
 * 
 * @param userYearsExperience - User's years of experience
 * @param userSeniorityPrefs - User's preferred seniority levels
 * @param jobSeniorityLevel - Job's seniority level
 * @param jobYearsMin - Minimum years required
 * @param jobYearsMax - Maximum years preferred
 * @returns Score (0-10) and reasons
 */
export function scoreExperience(
    userYearsExperience: number | null,
    userSeniorityPrefs: string[],
    jobSeniorityLevel: SeniorityLevel | string | null,
    jobYearsMin: number | null,
    jobYearsMax: number | null
): FactorResult {
    const result = matchSeniority(
        userYearsExperience,
        userSeniorityPrefs,
        jobSeniorityLevel,
        jobYearsMin,
        jobYearsMax
    )

    return {
        score: result.score,
        maxScore: MAX_SCORES.experience_level,
        reasons: result.reasons,
    }
}
