/**
 * =============================================================================
 * MATCH CACHE
 * =============================================================================
 * 
 * Simple in-memory cache for job matches.
 * 
 * Cache key: `${userId}:${personaId}`
 * TTL: 15 minutes
 * 
 * Invalidation:
 * - Automatic: TTL expires
 * - Manual: Call invalidateCache() when persona preferences change
 * 
 * =============================================================================
 */

import type { MatchedJob } from './matchJobs'

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry {
    matches: MatchedJob[]
    timestamp: number
    personaId: string
    userId: string
}

// =============================================================================
// CACHE STORAGE
// =============================================================================

const matchCache = new Map<string, CacheEntry>()

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

// =============================================================================
// CACHE FUNCTIONS
// =============================================================================

/**
 * Generate cache key
 */
function getCacheKey(userId: string, personaId: string): string {
    return `${userId}:${personaId}`
}

/**
 * Check if cache entry is still valid
 */
function isValid(entry: CacheEntry): boolean {
    const now = Date.now()
    return (now - entry.timestamp) < CACHE_TTL_MS
}

/**
 * Get cached matches if available and valid
 */
export function getCachedMatches(
    userId: string,
    personaId: string
): MatchedJob[] | null {
    const key = getCacheKey(userId, personaId)
    const entry = matchCache.get(key)

    if (!entry) {
        return null
    }

    if (!isValid(entry)) {
        // Expired - remove from cache
        matchCache.delete(key)
        return null
    }

    return entry.matches
}

/**
 * Store matches in cache
 */
export function setCachedMatches(
    userId: string,
    personaId: string,
    matches: MatchedJob[]
): void {
    const key = getCacheKey(userId, personaId)
    const entry: CacheEntry = {
        matches,
        timestamp: Date.now(),
        personaId,
        userId,
    }

    matchCache.set(key, entry)

    // Clean up expired entries periodically
    cleanupExpiredEntries()
}

/**
 * Invalidate cache for a specific user/persona
 */
export function invalidateCache(userId: string, personaId?: string): void {
    if (personaId) {
        // Invalidate specific persona
        const key = getCacheKey(userId, personaId)
        matchCache.delete(key)
    } else {
        // Invalidate all personas for this user
        const keysToDelete: string[] = []
        for (const [key, entry] of matchCache.entries()) {
            if (entry.userId === userId) {
                keysToDelete.push(key)
            }
        }
        keysToDelete.forEach(key => matchCache.delete(key))
    }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    matchCache.clear()
}

/**
 * Remove expired entries from cache
 */
function cleanupExpiredEntries(): void {
    const keysToDelete: string[] = []

    for (const [key, entry] of matchCache.entries()) {
        if (!isValid(entry)) {
            keysToDelete.push(key)
        }
    }

    keysToDelete.forEach(key => matchCache.delete(key))
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats(): {
    totalEntries: number
    validEntries: number
    expiredEntries: number
} {
    let validCount = 0
    let expiredCount = 0

    for (const entry of matchCache.values()) {
        if (isValid(entry)) {
            validCount++
        } else {
            expiredCount++
        }
    }

    return {
        totalEntries: matchCache.size,
        validEntries: validCount,
        expiredEntries: expiredCount,
    }
}
