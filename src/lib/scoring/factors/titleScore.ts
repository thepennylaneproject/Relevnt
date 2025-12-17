/**
 * ============================================================================
 * TITLE SCORE
 * ============================================================================
 * Score job title relevance to user's target roles.
 * 
 * Scoring (0-15):
 * - Exact match to primary title: 15 points
 * - Close match / related title: 10-12 points
 * - Partial overlap: 5-9 points
 * - No match: 0-4 points
 * ============================================================================
 */

import type { FactorResult } from '../types'
import { MAX_SCORES } from '../types'

/**
 * Normalize a title for comparison.
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Tokenize a title into meaningful words.
 */
function tokenize(title: string): string[] {
    const normalized = normalizeTitle(title)

    // Remove common filler words
    const stopwords = new Set([
        'a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'at', 'with',
        'i', 'ii', 'iii', 'iv', 'v', '1', '2', '3', '4', '5',
    ])

    return normalized
        .split(' ')
        .filter(word => word.length > 1 && !stopwords.has(word))
}

/**
 * Calculate token overlap between two titles.
 */
function tokenOverlap(title1: string, title2: string): { matched: string[]; score: number } {
    const tokens1 = new Set(tokenize(title1))
    const tokens2 = tokenize(title2)

    const matched: string[] = []
    for (const token of tokens2) {
        if (tokens1.has(token)) {
            matched.push(token)
        }
    }

    // Score based on proportion of tokens matched
    const score = tokens2.length > 0 ? matched.length / tokens2.length : 0

    return { matched, score }
}

/**
 * Check if job title contains the user's primary title.
 */
function containsTitle(jobTitle: string, userTitle: string): boolean {
    const normalizedJob = normalizeTitle(jobTitle)
    const normalizedUser = normalizeTitle(userTitle)

    return normalizedJob.includes(normalizedUser) || normalizedUser.includes(normalizedJob)
}

/**
 * Score job title relevance.
 * 
 * @param userPrimaryTitle - User's primary/current job title
 * @param userRelatedTitles - User's related/target titles
 * @param jobTitle - Job's title
 * @returns Score (0-15) and reasons
 */
export function scoreTitle(
    userPrimaryTitle: string,
    userRelatedTitles: string[],
    jobTitle: string
): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.title_relevance,
        reasons: [],
    }

    if (!jobTitle) {
        result.score = 5
        return result
    }

    // Check exact/contained match with primary title
    if (userPrimaryTitle && containsTitle(jobTitle, userPrimaryTitle)) {
        result.score = 15
        result.reasons.push(`✓ Title matches "${userPrimaryTitle}"`)
        return result
    }

    // Check match with related titles
    for (const related of userRelatedTitles) {
        if (containsTitle(jobTitle, related)) {
            result.score = 13
            result.reasons.push(`✓ Title matches your target role "${related}"`)
            return result
        }
    }

    // Check token overlap with primary title
    if (userPrimaryTitle) {
        const overlap = tokenOverlap(userPrimaryTitle, jobTitle)
        if (overlap.score >= 0.5) {
            result.score = 10
            result.reasons.push(`Title aligns with your background`)
            return result
        } else if (overlap.matched.length >= 1) {
            result.score = 6
            result.reasons.push(`Some title overlap (${overlap.matched.join(', ')})`)
            return result
        }
    }

    // Check token overlap with any related title
    for (const related of userRelatedTitles) {
        const overlap = tokenOverlap(related, jobTitle)
        if (overlap.score >= 0.3) {
            result.score = 8
            result.reasons.push(`Title related to "${related}"`)
            return result
        }
    }

    // No meaningful match
    result.score = 3
    result.reasons.push('Title differs from your targets')
    return result
}
