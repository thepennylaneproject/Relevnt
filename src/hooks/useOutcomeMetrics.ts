/**
 * =============================================================================
 * useOutcomeMetrics Hook
 * =============================================================================
 * Tracks outcome-based success metrics instead of activity metrics.
 * Focuses on what matters: interviews, responses, and offers.
 * Part of Phase 2: Outcomes over Activity
 * =============================================================================
 */

import { useMemo } from 'react'
import { useApplications } from './useApplications'

export interface OutcomeMetrics {
    // Raw counts
    totalApplications: number
    totalResponses: number  // Any status other than 'applied'
    totalInterviews: number
    totalOffers: number
    totalRejections: number
    
    // Success rates (what users actually care about)
    responseRate: number  // % that got ANY response (reject, interview, etc.)
    interviewRate: number  // % that led to interviews
    offerRate: number      // % that led to offers
    
    // Time-based insights
    avgDaysToResponse: number | null
    avgDaysToInterview: number | null
    
    // Active pipeline
    activePipeline: number  // In-progress + interviewing
    
    // Trend indicators
    recentResponseRate: number  // Last 10 applications
    isImproving: boolean
}

export function useOutcomeMetrics(): OutcomeMetrics & { loading: boolean } {
    const { applications, loading } = useApplications()
    
    const metrics = useMemo((): OutcomeMetrics => {
        if (applications.length === 0) {
            return {
                totalApplications: 0,
                totalResponses: 0,
                totalInterviews: 0,
                totalOffers: 0,
                totalRejections: 0,
                responseRate: 0,
                interviewRate: 0,
                offerRate: 0,
                avgDaysToResponse: null,
                avgDaysToInterview: null,
                activePipeline: 0,
                recentResponseRate: 0,
                isImproving: false,
            }
        }
        
        const totalApplications = applications.length
        
        // Count outcomes
        const responded = applications.filter(a => 
            a.status && a.status !== 'applied'
        )
        const totalResponses = responded.length
        
        const interviewed = applications.filter(a => 
            a.status === 'interviewing' || a.status === 'offer' || a.status === 'accepted'
        )
        const totalInterviews = interviewed.length
        
        const totalOffers = applications.filter(a => 
            a.status === 'offer' || a.status === 'accepted'
        ).length
        
        const totalRejections = applications.filter(a => 
            a.status === 'rejected'
        ).length
        
        const activePipeline = applications.filter(a =>
            a.status === 'in-progress' || a.status === 'interviewing'
        ).length
        
        // Calculate rates
        const responseRate = totalApplications > 0 
            ? Math.round((totalResponses / totalApplications) * 100) 
            : 0
            
        const interviewRate = totalApplications > 0
            ? Math.round((totalInterviews / totalApplications) * 100)
            : 0
            
        const offerRate = totalApplications > 0
            ? Math.round((totalOffers / totalApplications) * 100)
            : 0
        
        // Calculate time metrics
        const responseTimes = responded
            .map(app => {
                const applied = new Date(app.applied_date)
                const updated = new Date(app.updated_at)
                return Math.floor((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
            })
            .filter(days => days >= 0 && days < 90) // Filter outliers
            
        const avgDaysToResponse = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((sum, d) => sum + d, 0) / responseTimes.length)
            : null
            
        const interviewTimes = interviewed
            .filter(app => app.interview_date)
            .map(app => {
                const applied = new Date(app.applied_date)
                const interview = new Date(app.interview_date!)
                return Math.floor((interview.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
            })
            .filter(days => days >= 0 && days < 90)
            
        const avgDaysToInterview = interviewTimes.length > 0
            ? Math.round(interviewTimes.reduce((sum, d) => sum + d, 0) / interviewTimes.length)
            : null
        
        // Recent trend (last 10 applications)
        const recentApps = applications.slice(0, 10)
        const recentResponded = recentApps.filter(a => a.status && a.status !== 'applied')
        const recentResponseRate = recentApps.length > 0
            ? Math.round((recentResponded.length / recentApps.length) * 100)
            : 0
            
        // Is the user improving? (Recent rate > overall rate)
        const isImproving = recentApps.length >= 5 && recentResponseRate > responseRate
        
        return {
            totalApplications,
            totalResponses,
            totalInterviews,
            totalOffers,
            totalRejections,
            responseRate,
            interviewRate,
            offerRate,
            avgDaysToResponse,
            avgDaysToInterview,
            activePipeline,
            recentResponseRate,
            isImproving,
        }
    }, [applications])
    
    return {
        ...metrics,
        loading,
    }
}

export default useOutcomeMetrics
