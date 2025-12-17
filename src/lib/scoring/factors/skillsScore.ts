/**
 * ============================================================================
 * SKILLS SCORE
 * ============================================================================
 * Score skills match between user and job requirements.
 * 
 * Scoring (0-35 total):
 * - Required skills: 0-25 points
 * - Nice-to-have/preferred skills: 0-10 points
 * ============================================================================
 */

import type { FactorResult } from '../types'
import { countSkillMatches, getCanonicalSkills } from '../skillMatcher'
import { MAX_SCORES } from '../types'

/**
 * Score skills match.
 * 
 * @param userSkills - Combined skills from profile, preferences, and resume
 * @param jobRequiredSkills - Skills marked as required in job posting
 * @param jobPreferredSkills - Skills marked as preferred/nice-to-have
 * @param jobDescription - Full job description for bonus skill detection
 * @returns Score (0-35) and reasons
 */
export function scoreSkills(
    userSkills: string[],
    jobRequiredSkills: string[] | null,
    jobPreferredSkills: string[] | null,
    jobDescription: string
): { required: FactorResult; niceToHave: FactorResult; gaps: string[] } {

    // Dedupe and canonicalize user skills
    const allUserSkills = getCanonicalSkills(userSkills)

    // Get match counts
    const matches = countSkillMatches(
        allUserSkills,
        jobRequiredSkills,
        jobPreferredSkills,
        jobDescription
    )

    // ===== Required Skills (0-25) =====
    const requiredResult: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.required_skills,
        reasons: [],
    }

    if (jobRequiredSkills && jobRequiredSkills.length > 0) {
        const matchRate = matches.requiredMatched.length / jobRequiredSkills.length

        if (matchRate === 0) {
            // No required skills matched - significant penalty
            requiredResult.score = 0
            requiredResult.reasons.push(`⚠️ Missing all ${jobRequiredSkills.length} required skills`)
        } else if (matchRate === 1) {
            // All required skills matched - full points
            requiredResult.score = MAX_SCORES.required_skills
            requiredResult.reasons.push(`✓ Has all ${jobRequiredSkills.length} required skills`)
        } else {
            // Partial match
            requiredResult.score = Math.round(matchRate * MAX_SCORES.required_skills)
            requiredResult.reasons.push(
                `✓ Has ${matches.requiredMatched.length}/${jobRequiredSkills.length} required skills`
            )
        }
    } else {
        // No required skills specified - try to match from description
        const descriptionMatches = matches.bonusMatches.length
        if (descriptionMatches >= 5) {
            requiredResult.score = 20
            requiredResult.reasons.push(`✓ Strong skill alignment (${descriptionMatches}+ skills match)`)
        } else if (descriptionMatches >= 3) {
            requiredResult.score = 15
            requiredResult.reasons.push(`Good skill alignment (${descriptionMatches} skills match)`)
        } else if (descriptionMatches >= 1) {
            requiredResult.score = 10
            requiredResult.reasons.push(`Some skill overlap (${descriptionMatches} skills match)`)
        } else {
            requiredResult.score = 5
            requiredResult.reasons.push('Skill requirements not specified')
        }
    }

    // ===== Nice-to-Have Skills (0-10) =====
    const niceToHaveResult: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.nice_to_have_skills,
        reasons: [],
    }

    if (jobPreferredSkills && jobPreferredSkills.length > 0) {
        const preferredMatchCount = matches.preferredMatched.length

        if (preferredMatchCount > 0) {
            // Score based on number of matches (2 points per match, max 10)
            niceToHaveResult.score = Math.min(
                MAX_SCORES.nice_to_have_skills,
                preferredMatchCount * 2
            )
            niceToHaveResult.reasons.push(
                `+ ${preferredMatchCount} bonus skill${preferredMatchCount > 1 ? 's' : ''}`
            )
        }
    } else {
        // Count bonus matches from description
        const bonusCount = matches.bonusMatches.length
        if (bonusCount > 0) {
            niceToHaveResult.score = Math.min(MAX_SCORES.nice_to_have_skills, bonusCount * 2)
            if (bonusCount >= 3) {
                niceToHaveResult.reasons.push(`+ Additional relevant skills in your profile`)
            }
        }
    }

    return {
        required: requiredResult,
        niceToHave: niceToHaveResult,
        gaps: matches.requiredMissing,
    }
}
