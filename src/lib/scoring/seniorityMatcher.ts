/**
 * ============================================================================
 * SENIORITY MATCHER
 * ============================================================================
 * Experience level matching for ATS scoring.
 * 
 * Features:
 * - Title-based seniority extraction
 * - Description-based experience year extraction
 * - Flexible matching with penalties for over/under qualification
 * ============================================================================
 */

import type { SeniorityLevel } from '../../shared/types'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Years of experience typically associated with each seniority level.
 * [min, max] range.
 */
export const SENIORITY_YEARS: Record<SeniorityLevel, [number, number]> = {
    junior: [0, 2],
    mid: [2, 5],
    senior: [5, 10],
    lead: [8, 15],
    director: [10, 20],
    executive: [15, 30],
}

/**
 * Seniority level order for comparison (lower index = less senior).
 */
export const SENIORITY_ORDER: SeniorityLevel[] = [
    'junior',
    'mid',
    'senior',
    'lead',
    'director',
    'executive',
]

/**
 * Patterns to extract seniority from job titles.
 * Order matters: more specific patterns first.
 */
const TITLE_SENIORITY_PATTERNS: Array<{ level: SeniorityLevel; patterns: RegExp[] }> = [
    {
        level: 'executive',
        patterns: [
            /\b(c-level|cto|ceo|cfo|coo|cmo|cio|chief|executive|vp of|vice president of)\b/i,
        ],
    },
    {
        level: 'director',
        patterns: [
            /\b(director|head of|vp|vice president|managing director)\b/i,
        ],
    },
    {
        level: 'lead',
        patterns: [
            /\b(lead|principal|staff|tech lead|team lead|architect|distinguished)\b/i,
        ],
    },
    {
        level: 'senior',
        patterns: [
            /\b(senior|sr\.?|iii|3|experienced|level 3|l3)\b/i,
        ],
    },
    {
        level: 'mid',
        patterns: [
            /\b(mid[- ]?level|intermediate|ii|2|level 2|l2)\b/i,
        ],
    },
    {
        level: 'junior',
        patterns: [
            /\b(junior|jr\.?|entry[- ]?level|associate|intern|trainee|graduate|new grad|i\b|1|level 1|l1)\b/i,
        ],
    },
]

/**
 * Patterns to extract years of experience from job descriptions.
 */
const EXPERIENCE_YEAR_PATTERNS: RegExp[] = [
    // "5+ years of experience"
    /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i,
    // "minimum 5 years"
    /(?:minimum|at least|require[ds]?)\s+(\d+)\s*(?:years?|yrs?)/i,
    // "5-10 years" (range)
    /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)/i,
    // "5 years minimum"
    /(\d+)\s*(?:years?|yrs?)\s+(?:minimum|required|experience)/i,
    // "experience: 5+ years"
    /experience:?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
]

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract seniority level from a job title.
 */
export function extractSeniorityFromTitle(title: string): SeniorityLevel | null {
    if (!title) return null

    const normalizedTitle = title.toLowerCase()

    for (const { level, patterns } of TITLE_SENIORITY_PATTERNS) {
        for (const pattern of patterns) {
            if (pattern.test(normalizedTitle)) {
                return level
            }
        }
    }

    return null
}

/**
 * Extract seniority level from a job description.
 * Falls back to experience years if explicit level not found.
 */
export function extractSeniorityFromDescription(description: string): SeniorityLevel | null {
    if (!description) return null

    // First try to find years of experience
    const years = extractExperienceYears(description)
    if (years !== null) {
        return yearsToSeniorityLevel(years)
    }

    // Try to find explicit seniority mentions
    const normalizedDesc = description.toLowerCase()
    for (const { level, patterns } of TITLE_SENIORITY_PATTERNS) {
        for (const pattern of patterns) {
            // Look for patterns in context (e.g., "we're looking for a senior")
            const contextPattern = new RegExp(`(looking for|seeking|need|hiring|want)\\s+(?:a|an)?\\s*${pattern.source}`, 'i')
            if (contextPattern.test(normalizedDesc)) {
                return level
            }
        }
    }

    return null
}

/**
 * Extract minimum years of experience from job description.
 */
export function extractExperienceYears(description: string): number | null {
    if (!description) return null

    for (const pattern of EXPERIENCE_YEAR_PATTERNS) {
        const match = description.match(pattern)
        if (match) {
            // If it's a range (e.g., "5-10 years"), return the minimum
            if (match[2]) {
                return parseInt(match[1], 10)
            }
            return parseInt(match[1], 10)
        }
    }

    return null
}

/**
 * Extract experience year range from job description.
 */
export function extractExperienceRange(description: string): { min: number; max: number } | null {
    if (!description) return null

    // Look for range pattern first
    const rangeMatch = description.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)/i)
    if (rangeMatch) {
        return {
            min: parseInt(rangeMatch[1], 10),
            max: parseInt(rangeMatch[2], 10),
        }
    }

    // Fall back to single number
    const years = extractExperienceYears(description)
    if (years !== null) {
        return { min: years, max: years + 3 }
    }

    return null
}

/**
 * Convert years of experience to a seniority level.
 */
export function yearsToSeniorityLevel(years: number): SeniorityLevel {
    if (years < 2) return 'junior'
    if (years < 5) return 'mid'
    if (years < 8) return 'senior'
    if (years < 12) return 'lead'
    if (years < 18) return 'director'
    return 'executive'
}

/**
 * Get the typical years of experience for a seniority level.
 */
export function seniorityToYears(level: SeniorityLevel): number {
    const range = SENIORITY_YEARS[level]
    return (range[0] + range[1]) / 2
}

// ============================================================================
// MATCHING FUNCTIONS
// ============================================================================

/**
 * Compare two seniority levels.
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
export function compareSeniority(a: SeniorityLevel, b: SeniorityLevel): number {
    return SENIORITY_ORDER.indexOf(a) - SENIORITY_ORDER.indexOf(b)
}

/**
 * Match user experience against job requirements.
 * Returns a score (0-10) and reasons.
 */
export function matchSeniority(
    userYearsExperience: number | null,
    userSeniorityPrefs: string[],
    jobSeniorityLevel: SeniorityLevel | string | null,
    jobYearsMin: number | null,
    jobYearsMax: number | null
): { score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    // No job requirements = neutral match
    if (!jobSeniorityLevel && jobYearsMin === null) {
        return { score: 5, reasons: ['Experience requirements not specified'] }
    }

    // Determine job's seniority level
    const jobLevel = (
        jobSeniorityLevel && SENIORITY_ORDER.includes(jobSeniorityLevel as SeniorityLevel)
    ) ? jobSeniorityLevel as SeniorityLevel : (
        jobYearsMin !== null ? yearsToSeniorityLevel(jobYearsMin) : null
    )

    // Check user's years of experience against job requirements
    if (userYearsExperience !== null && jobYearsMin !== null) {
        if (userYearsExperience >= jobYearsMin) {
            if (jobYearsMax !== null && userYearsExperience > jobYearsMax + 3) {
                // Overqualified
                score = 6
                reasons.push(`Your ${userYearsExperience} years may be overqualified (${jobYearsMin}-${jobYearsMax} preferred)`)
            } else {
                // Good fit
                score = 10
                reasons.push(`✓ Your ${userYearsExperience} years experience meets the ${jobYearsMin}+ requirement`)
            }
        } else {
            // Underqualified
            const gap = jobYearsMin - userYearsExperience
            if (gap <= 1) {
                score = 6
                reasons.push(`Slightly below experience requirement (${userYearsExperience} vs ${jobYearsMin}+ years)`)
            } else if (gap <= 3) {
                score = 3
                reasons.push(`Below experience requirement (${userYearsExperience} vs ${jobYearsMin}+ years)`)
            } else {
                score = 0
                reasons.push(`⚠️ Significantly below experience requirement (${userYearsExperience} vs ${jobYearsMin}+ years)`)
            }
        }
        return { score, reasons }
    }

    // Check seniority level preferences
    if (jobLevel && userSeniorityPrefs.length > 0) {
        const normalizedPrefs = userSeniorityPrefs.map(p => p.toLowerCase())

        if (normalizedPrefs.includes(jobLevel)) {
            score = 10
            reasons.push(`✓ ${capitalize(jobLevel)} level matches your preference`)
        } else {
            // Check if adjacent level
            const jobIndex = SENIORITY_ORDER.indexOf(jobLevel)
            const prefIndices = normalizedPrefs
                .filter(p => SENIORITY_ORDER.includes(p as SeniorityLevel))
                .map(p => SENIORITY_ORDER.indexOf(p as SeniorityLevel))

            if (prefIndices.length > 0) {
                const closestDiff = Math.min(...prefIndices.map(i => Math.abs(i - jobIndex)))
                if (closestDiff === 1) {
                    score = 7
                    reasons.push(`${capitalize(jobLevel)} level is close to your preference`)
                } else {
                    score = 3
                    reasons.push(`${capitalize(jobLevel)} level differs from your preference`)
                }
            } else {
                score = 5
            }
        }
        return { score, reasons }
    }

    // User has years but job only has level (or vice versa)
    if (userYearsExperience !== null && jobLevel) {
        const userLevel = yearsToSeniorityLevel(userYearsExperience)
        const comparison = compareSeniority(userLevel, jobLevel)

        if (comparison === 0) {
            score = 10
            reasons.push(`✓ Your experience level matches the ${capitalize(jobLevel)} position`)
        } else if (comparison > 0) {
            score = 7
            reasons.push(`You may be overqualified for this ${capitalize(jobLevel)} position`)
        } else {
            score = 4
            reasons.push(`This ${capitalize(jobLevel)} position may require more experience`)
        }
        return { score, reasons }
    }

    return { score: 5, reasons: ['Experience match could not be determined'] }
}

// ============================================================================
// HELPERS
// ============================================================================

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
