import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export interface ResumePerformance {
    resumeId: string
    resumeName: string
    total: number
    interviews: number
    rejections: number
    applied: number
    interviewRate: number
    rejectionRate: number
}

export interface PerformanceData {
    success: boolean
    performanceByResume: ResumePerformance[]
    totalApplications: number
    timestamp: string
}

export function useApplicationPerformance() {
    const { user, session } = useAuth()
    const [performance, setPerformance] = useState<PerformanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPerformance = useCallback(async () => {
        if (!user || !session?.access_token) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/.netlify/functions/get_application_performance?user_id=${user.id}`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.text()
                throw new Error(errorData || 'Failed to fetch performance data')
            }

            const data = await response.json()
            setPerformance(data)
        } catch (err: any) {
            console.error('useApplicationPerformance error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user, session])

    useEffect(() => {
        fetchPerformance()
    }, [fetchPerformance])

    return { performance, loading, error, refetch: fetchPerformance }
}
