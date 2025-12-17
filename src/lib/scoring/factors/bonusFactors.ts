/**
 * ============================================================================
 * BONUS FACTORS
 * ============================================================================
 * Score bonus factors: keywords, recency, and competition level.
 * 
 * Scoring:
 * - Keyword density: 0-5 points
 * - Job recency: 0-5 points
 * - Competition level: 0-5 points
 * ============================================================================
 */

import type { FactorResult } from '../types'
import { MAX_SCORES } from '../types'

/**
 * Score keyword density/relevance.
 * 
 * @param userIncludeKeywords - Keywords user wants to see
 * @param userAvoidKeywords - Keywords user wants to avoid
 * @param jobDescription - Job description
 * @returns Score (0-5) and reasons
 */
export function scoreKeywords(
    userIncludeKeywords: string[],
    userAvoidKeywords: string[],
    jobDescription: string
): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.keyword_density,
        reasons: [],
    }

    const normalizedDesc = jobDescription.toLowerCase()

    // Check for avoid keywords (penalty)
    const avoidMatches = userAvoidKeywords.filter(kw =>
        normalizedDesc.includes(kw.toLowerCase())
    )

    if (avoidMatches.length > 0) {
        result.score = 0
        result.reasons.push(`⚠️ Contains keywords you want to avoid`)
        return result
    }

    // Check for include keywords (bonus)
    if (userIncludeKeywords.length === 0) {
        result.score = 3 // Neutral
        return result
    }

    const includeMatches = userIncludeKeywords.filter(kw =>
        normalizedDesc.includes(kw.toLowerCase())
    )

    const matchRate = includeMatches.length / userIncludeKeywords.length

    if (matchRate >= 0.5) {
        result.score = 5
        result.reasons.push(`High keyword relevance`)
    } else if (matchRate >= 0.25) {
        result.score = 4
        result.reasons.push(`Good keyword match`)
    } else if (includeMatches.length > 0) {
        result.score = 3
    } else {
        result.score = 2
    }

    return result
}

/**
 * Score job recency/freshness.
 * 
 * @param postedDate - Job posted date (ISO string)
 * @returns Score (0-5) and reasons
 */
export function scoreRecency(postedDate: string | null): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.recency,
        reasons: [],
    }

    if (!postedDate) {
        result.score = 3 // Neutral
        result.reasons.push('Post date unknown')
        return result
    }

    const posted = new Date(postedDate)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff < 0 || isNaN(daysDiff)) {
        result.score = 3 // Invalid date
        return result
    }

    if (daysDiff <= 3) {
        result.score = 5
        result.reasons.push('🔥 Very fresh posting')
    } else if (daysDiff <= 7) {
        result.score = 4
        result.reasons.push('Posted this week')
    } else if (daysDiff <= 14) {
        result.score = 3
        result.reasons.push('Posted within 2 weeks')
    } else if (daysDiff <= 30) {
        result.score = 2
        result.reasons.push('Posted this month')
    } else {
        result.score = 1
        result.reasons.push('Older posting')
    }

    return result
}

/**
 * Score competition level.
 * 
 * @param competitivenessLevel - Job's competitiveness level
 * @returns Score (0-5) and reasons
 */
export function scoreCompetition(competitivenessLevel: string | null): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.competition,
        reasons: [],
    }

    if (!competitivenessLevel) {
        result.score = 3 // Neutral
        return result
    }

    const normalized = competitivenessLevel.toLowerCase()

    if (normalized.includes('low')) {
        result.score = 5
        result.reasons.push('Lower competition')
    } else if (normalized.includes('medium') || normalized.includes('moderate') || normalized.includes('balanced')) {
        result.score = 4
        result.reasons.push('Moderate competition')
    } else if (normalized.includes('high')) {
        result.score = 2
        result.reasons.push('High competition')
    } else {
        result.score = 3
    }

    return result
}
