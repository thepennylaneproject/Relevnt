
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { usePersonas } from './usePersonas'
import { useMatchedJobs } from './useMatchedJobs'
import type { MatchedJob } from '../lib/matchJobs'

export interface DailyBriefing {
    topOpportunities: MatchedJob[]
    personaName: string | null
    loading: boolean
    error: string | null
    refetch?: () => Promise<void>
}

export function useDailyBriefing(): DailyBriefing {
    const { user } = useAuth()
    const { activePersona, loading: personasLoading, error: personasError } = usePersonas()

    // We fetch top 5 matches for the active persona
    const {
        matches,
        loading: matchesLoading,
        error: matchesError,
        refetch: refetchMatches
    } = useMatchedJobs({
        personaId: activePersona?.id || null,
        limit: 5,
        minScore: 0.1 // Show even low scores but ranked
    })

    const loading = personasLoading || (!!activePersona && matchesLoading)
    const error = personasError || matchesError

    return {
        topOpportunities: matches,
        personaName: activePersona?.name || null,
        loading,
        error,
        refetch: refetchMatches
    }
}
