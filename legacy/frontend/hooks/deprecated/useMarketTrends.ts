import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export interface SkillDemand {
    skill: string
    count: number
    demandScore: number
}

export interface MarketTrends {
    success: boolean
    targetTitles: string[]
    totalJobsAnalyzed: number
    topSkills: SkillDemand[]
    skillGaps: SkillDemand[]
    timestamp: string
    message?: string
}

export function useMarketTrends() {
    const { user, session } = useAuth()
    const [trends, setTrends] = useState<MarketTrends | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTrends = useCallback(async () => {
        if (!user || !session?.access_token) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`/.netlify/functions/get_market_trends?user_id=${user.id}`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.text()
                throw new Error(errorData || 'Failed to fetch market trends')
            }

            const data = await response.json()
            setTrends(data)
        } catch (err: any) {
            console.error('useMarketTrends error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user, session])

    useEffect(() => {
        fetchTrends()
    }, [fetchTrends])

    return { trends, loading, error, refetch: fetchTrends }
}
