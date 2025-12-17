/**
 * ============================================================================
 * INDUSTRY SCORE
 * ============================================================================
 * Score industry and company attribute fit.
 * 
 * Scoring:
 * - Industry fit: 0-5 points
 * - Company attributes: 0-5 points (size, values, etc.)
 * ============================================================================
 */

import type { FactorResult } from '../types'
import { MAX_SCORES } from '../types'

// Industry synonyms and related terms
const INDUSTRY_ALIASES: Record<string, string[]> = {
    'tech': ['technology', 'software', 'saas', 'it', 'information technology', 'fintech', 'edtech', 'healthtech'],
    'finance': ['financial services', 'banking', 'fintech', 'insurance', 'investment', 'trading'],
    'healthcare': ['health', 'medical', 'healthtech', 'biotech', 'pharmaceutical', 'pharma'],
    'retail': ['e-commerce', 'ecommerce', 'consumer', 'cpg', 'consumer goods'],
    'manufacturing': ['industrial', 'automotive', 'aerospace'],
    'education': ['edtech', 'learning', 'academic', 'university'],
    'media': ['entertainment', 'publishing', 'content', 'news', 'advertising'],
    'consulting': ['professional services', 'advisory'],
    'startup': ['early stage', 'seed', 'series a', 'growth stage'],
}

/**
 * Normalize industry name.
 */
function normalizeIndustry(industry: string): string {
    return industry.toLowerCase().trim()
}

/**
 * Check if a text contains an industry or its aliases.
 */
function matchesIndustry(text: string, targetIndustry: string): boolean {
    const normalizedText = text.toLowerCase()
    const normalizedTarget = normalizeIndustry(targetIndustry)

    // Direct match
    if (normalizedText.includes(normalizedTarget)) {
        return true
    }

    // Check aliases
    const aliases = INDUSTRY_ALIASES[normalizedTarget]
    if (aliases) {
        for (const alias of aliases) {
            if (normalizedText.includes(alias)) {
                return true
            }
        }
    }

    // Check if target is an alias of another industry
    for (const [canonical, aliasList] of Object.entries(INDUSTRY_ALIASES)) {
        if (aliasList.includes(normalizedTarget)) {
            if (normalizedText.includes(canonical) || aliasList.some(a => normalizedText.includes(a))) {
                return true
            }
        }
    }

    return false
}

/**
 * Score industry fit.
 * 
 * @param userIndustries - User's preferred industries
 * @param jobIndustry - Job's industry classification
 * @param jobCompany - Company name
 * @param jobDescription - Job description
 * @returns Score (0-5) and reasons
 */
export function scoreIndustry(
    userIndustries: string[],
    jobIndustry: string | null,
    jobCompany: string | null,
    jobDescription: string
): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.industry_fit,
        reasons: [],
    }

    // No industry preference = neutral
    if (userIndustries.length === 0) {
        result.score = 3
        return result
    }

    // Build text blob for matching
    const textBlob = [jobIndustry, jobCompany, jobDescription].filter(Boolean).join(' ')

    // Check each user industry preference
    for (const userIndustry of userIndustries) {
        if (matchesIndustry(textBlob, userIndustry)) {
            result.score = 5
            result.reasons.push(`✓ ${capitalize(userIndustry)} industry`)
            return result
        }
    }

    // No match but job has industry specified
    if (jobIndustry) {
        result.score = 2
        result.reasons.push(`${capitalize(jobIndustry)} industry`)
    } else {
        result.score = 3
    }

    return result
}

/**
 * Score company attributes (size, values, etc.).
 * 
 * @param userCompanySizes - User's preferred company sizes
 * @param userMissionValues - User's valued mission/values keywords
 * @param jobCompanySize - Job's company size
 * @param jobDescription - Job description
 * @returns Score (0-5) and reasons
 */
export function scoreCompanyAttributes(
    userCompanySizes: string[],
    userMissionValues: string[],
    jobCompanySize: string | null,
    jobDescription: string
): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.company_attributes,
        reasons: [],
    }

    let points = 0

    // Check company size preference (0-3 points)
    if (userCompanySizes.length > 0 && jobCompanySize) {
        const normalizedJobSize = jobCompanySize.toLowerCase()
        const matches = userCompanySizes.some(size => normalizedJobSize.includes(size.toLowerCase()))

        if (matches) {
            points += 3
            result.reasons.push(`✓ Company size matches preference`)
        }
    } else {
        points += 1 // Neutral
    }

    // Check mission/values alignment (0-2 points)
    if (userMissionValues.length > 0 && jobDescription) {
        const normalizedDesc = jobDescription.toLowerCase()
        const matchedValues = userMissionValues.filter(value =>
            normalizedDesc.includes(value.toLowerCase())
        )

        if (matchedValues.length >= 2) {
            points += 2
            result.reasons.push(`Values alignment detected`)
        } else if (matchedValues.length === 1) {
            points += 1
        }
    } else {
        points += 1 // Neutral
    }

    result.score = Math.min(MAX_SCORES.company_attributes, points)
    return result
}

// Helper
function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
