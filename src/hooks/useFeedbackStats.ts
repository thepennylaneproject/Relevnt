/**
 * =============================================================================
 * useFeedbackStats Hook
 * =============================================================================
 * 
 * Hook to fetch and display feedback statistics for the active persona.
 * Used in Settings to show which preferences were adjusted by feedback.
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { usePersonas } from './usePersonas'
import { getFeedbackStats, type FeedbackStats } from '../services/feedbackService'

// =============================================================================
// TYPES
// =============================================================================

export interface UseFeedbackStatsReturn {
    /** Feedback statistics */
    stats: FeedbackStats | null
    
    /** Loading state */
    loading: boolean
    
    /** Error message if any */
    error: string | null
    
    /** Refetch statistics */
    refetch: () => Promise<void>
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useFeedbackStats(): UseFeedbackStatsReturn {
    const { activePersona } = usePersonas()
    const [stats, setStats] = useState<FeedbackStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = useCallback(async () => {
        if (!activePersona) {
            setStats(null)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const fetchedStats = await getFeedbackStats(activePersona.id)
            setStats(fetchedStats)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch feedback stats'
            console.error('Error fetching feedback stats:', err)
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [activePersona])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
    }
}
