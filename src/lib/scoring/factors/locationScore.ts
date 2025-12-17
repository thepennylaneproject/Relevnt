/**
 * ============================================================================
 * LOCATION SCORE
 * ============================================================================
 * Score location and remote work compatibility.
 * 
 * Scoring (0-5):
 * - Perfect match (remote pref + remote job): 5 points
 * - Good match (location match or flexible): 3-4 points
 * - Partial match: 2-3 points
 * - Poor match: 0-1 points
 * ============================================================================
 */

import type { FactorResult } from '../types'
import { MAX_SCORES } from '../types'

/**
 * Normalize remote type for comparison.
 */
function normalizeRemoteType(type: string | null): string {
    if (!type) return 'unknown'
    const normalized = type.toLowerCase().trim()

    if (normalized.includes('remote')) return 'remote'
    if (normalized.includes('hybrid')) return 'hybrid'
    if (normalized.includes('onsite') || normalized.includes('on-site') || normalized.includes('office')) {
        return 'onsite'
    }
    return normalized
}

/**
 * Normalize location string for comparison.
 */
function normalizeLocation(location: string | null): string {
    if (!location) return ''
    return location.toLowerCase().trim()
}

/**
 * Check if job location matches any preferred location.
 */
function locationMatches(jobLocation: string | null, preferredLocations: string[]): boolean {
    if (!jobLocation || preferredLocations.length === 0) return false

    const normalizedJob = normalizeLocation(jobLocation)

    for (const pref of preferredLocations) {
        const normalizedPref = normalizeLocation(pref)

        // Check for substring match (city, state, country)
        if (normalizedJob.includes(normalizedPref) || normalizedPref.includes(normalizedJob)) {
            return true
        }

        // Check for partial matches (e.g., "New York" in "New York, NY")
        const prefParts = normalizedPref.split(/[,\s]+/).filter(p => p.length > 2)
        for (const part of prefParts) {
            if (normalizedJob.includes(part)) {
                return true
            }
        }
    }

    return false
}

/**
 * Score location and remote work compatibility.
 * 
 * @param userRemotePref - User's remote work preference (remote/hybrid/onsite/any)
 * @param userPreferredLocations - User's preferred locations
 * @param jobRemoteType - Job's remote type
 * @param jobLocation - Job's location
 * @returns Score (0-5) and reasons
 */
export function scoreLocation(
    userRemotePref: string,
    userPreferredLocations: string[],
    jobRemoteType: string | null,
    jobLocation: string | null
): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.location_compatibility,
        reasons: [],
    }

    const normalizedUserPref = normalizeRemoteType(userRemotePref)
    const normalizedJobRemote = normalizeRemoteType(jobRemoteType)
    const hasLocationPref = userPreferredLocations.length > 0
    const isJobRemote = normalizedJobRemote === 'remote'

    // User prefers remote
    if (normalizedUserPref === 'remote') {
        if (isJobRemote) {
            result.score = 5
            result.reasons.push('✓ Remote role matches preference')
        } else if (normalizedJobRemote === 'hybrid') {
            result.score = 3
            result.reasons.push('Hybrid role (you prefer remote)')
        } else {
            result.score = 1
            result.reasons.push('Onsite role (you prefer remote)')
        }
        return result
    }

    // User prefers hybrid
    if (normalizedUserPref === 'hybrid') {
        if (normalizedJobRemote === 'hybrid') {
            result.score = 5
            result.reasons.push('✓ Hybrid role matches preference')
        } else if (isJobRemote || normalizedJobRemote === 'onsite') {
            result.score = 3
            result.reasons.push(`${isJobRemote ? 'Remote' : 'Onsite'} role (you prefer hybrid)`)
        } else {
            result.score = 3
        }
        return result
    }

    // User prefers onsite
    if (normalizedUserPref === 'onsite') {
        if (normalizedJobRemote === 'onsite' || normalizedJobRemote === 'unknown') {
            // Check location match
            if (hasLocationPref && jobLocation) {
                if (locationMatches(jobLocation, userPreferredLocations)) {
                    result.score = 5
                    result.reasons.push(`✓ Located in ${jobLocation}`)
                } else {
                    result.score = 2
                    result.reasons.push(`Located in ${jobLocation} (not in preferred areas)`)
                }
            } else {
                result.score = 4
                result.reasons.push('Onsite role matches preference')
            }
        } else if (normalizedJobRemote === 'hybrid') {
            result.score = 3
            result.reasons.push('Hybrid role (you prefer onsite)')
        } else {
            result.score = 1
            result.reasons.push('Remote role (you prefer onsite)')
        }
        return result
    }

    // User has no preference (any)
    if (normalizedUserPref === 'any' || normalizedUserPref === '') {
        // Check location if provided
        if (hasLocationPref && jobLocation && !isJobRemote) {
            if (locationMatches(jobLocation, userPreferredLocations)) {
                result.score = 5
                result.reasons.push(`✓ Located in preferred area`)
            } else {
                result.score = 3
                result.reasons.push(`Located in ${jobLocation}`)
            }
        } else {
            result.score = 4
            result.reasons.push('Location is flexible')
        }
        return result
    }

    // Default
    result.score = 3
    return result
}
