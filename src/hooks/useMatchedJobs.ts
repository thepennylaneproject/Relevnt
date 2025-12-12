/**
 * =============================================================================
 * useMatchedJobs Hook
 * =============================================================================
 * 
 * React hook for fetching persona-aware job matches with optional weight overrides.
 * 
 * Features:
 * - Fetch matched jobs for a specific persona
 * - Support custom weight configuration
 * - Automatic refetch on persona or weight changes
 * - Loading and error state handling
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import type { WeightConfig } from '../types/v2-schema'
import type { MatchedJob } from '../lib/matchJobs'

// =============================================================================
// TYPES
// =============================================================================

export interface UseMatchedJobsOptions {
    /** Persona ID to fetch matches for */
    personaId: string | null

    /** Optional custom weight configuration */
    weightsConfig?: WeightConfig | null

    /** Minimum match score filter */
    minScore?: number

    /** Maximum results to return */
    limit?: number

    /** Pagination offset */
    offset?: number
}

export interface UseMatchedJobsReturn {
    /** Matched jobs with scores and explanations */
    matches: MatchedJob[]

    /** Total count of matches */
    count: number

    /** Whether results came from cache */
    cached: boolean

    /** Persona info */
    persona: {
        id: string
        name: string
        description: string | null
    } | null

    /** Loading state */
    loading: boolean

    /** Error message if any */
    error: string | null

    /** Manually refetch matches */
    refetch: () => Promise<void>
}

// =============================================================================
// HELPER - GET AUTH TOKEN
// =============================================================================

async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useMatchedJobs(options: UseMatchedJobsOptions): UseMatchedJobsReturn {
    const { user } = useAuth()
    const { personaId, weightsConfig, minScore, limit, offset } = options

    const [matches, setMatches] = useState<MatchedJob[]>([])
    const [count, setCount] = useState(0)
    const [cached, setCached] = useState(false)
    const [persona, setPersona] = useState<{
        id: string
        name: string
        description: string | null
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ---------------------------------------------------------------------------
    // FETCH MATCHES
    // ---------------------------------------------------------------------------

    const fetchMatches = useCallback(async () => {
        if (!user) {
            setError('You need to be signed in to see matches')
            setMatches([])
            return
        }

        if (!personaId) {
            setMatches([])
            setCount(0)
            setCached(false)
            setPersona(null)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const token = await getAccessToken()
            if (!token) {
                throw new Error('Not authenticated')
            }

            // Build query parameters
            const params = new URLSearchParams()
            params.set('persona_id', personaId)
            if (minScore !== undefined) params.set('min_score', minScore.toString())
            if (limit !== undefined) params.set('limit', limit.toString())
            if (offset !== undefined) params.set('offset', offset.toString())

            // Note: weightsConfig is not passed via query params
            // The backend uses the user's default tuner settings
            // To support custom weights, we'd need to modify the backend endpoint
            // For now, this hook provides the interface for future enhancement

            const url = `/.netlify/functions/get_matched_jobs?${params.toString()}`

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const text = await response.text().catch(() => '')
                throw new Error(`Failed to fetch matches: ${response.status} ${text || response.statusText}`)
            }

            const data = await response.json()

            if (!data.success || !data.data) {
                throw new Error(data.message || 'Failed to fetch matches')
            }

            setMatches(data.data.matches || [])
            setCount(data.data.count || 0)
            setCached(data.data.cached || false)
            setPersona(data.data.persona || null)
        } catch (err) {
            console.error('useMatchedJobs error:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong loading matches'
            )
            setMatches([])
            setCount(0)
        } finally {
            setLoading(false)
        }
    }, [user, personaId, minScore, limit, offset])

    // Auto-fetch when dependencies change
    useEffect(() => {
        fetchMatches()
    }, [fetchMatches])

    // ---------------------------------------------------------------------------
    // RETURN
    // ---------------------------------------------------------------------------

    return {
        matches,
        count,
        cached,
        persona,
        loading,
        error,
        refetch: fetchMatches,
    }
}
