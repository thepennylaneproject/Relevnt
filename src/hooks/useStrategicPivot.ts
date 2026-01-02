/**
 * =============================================================================
 * useStrategicPivot Hook
 * =============================================================================
 * Manages strategic pivot reports - AI-driven analysis of application patterns
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useApplications } from './useApplications'
import * as InsightsService from '../services/strategicInsights.service'
import type { StoredReport } from '../services/strategicInsights.service'
import type { Recommendation } from '../types/ai-responses.types'

export interface UseStrategicPivotReturn {
  reports: StoredReport[]
  latestReport: StoredReport | null
  loading: boolean
  error: string | null
  canGenerateReport: boolean
  minApplicationsRequired: number
  currentApplicationCount: number
  generateReport: () => Promise<void>
  applyRecommendation: (reportId: string, recommendationId: string) => Promise<void>
  dismissRecommendation: (reportId: string, recommendationId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useStrategicPivot(): UseStrategicPivotReturn {
  const { user, session } = useAuth()
  const { applications } = useApplications()

  const [reports, setReports] = useState<StoredReport[]>([])
  const [latestReport, setLatestReport] = useState<StoredReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const minApplicationsRequired = 10
  const currentApplicationCount = applications.length
  const canGenerateReport = InsightsService.hasEnoughDataForInsights(applications)

  // Fetch reports
  const fetchReports = useCallback(async () => {
    if (!user?.id) {
      setReports([])
      setLatestReport(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [allReports, latest] = await Promise.all([
        InsightsService.getReports(user.id),
        InsightsService.getLatestReport(user.id),
      ])

      setReports(allReports)
      setLatestReport(latest)
    } catch (err) {
      console.error('Error fetching strategic pivot reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Generate new report
  const generateReport = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    if (!canGenerateReport) {
      setError(`Need at least ${minApplicationsRequired} applications to generate insights`)
      return
    }

    try {
      setGenerating(true)
      setError(null)

      // Get user token for AI call
      if (!session?.access_token) {
        throw new Error('No auth token available')
      }

      // Extract user skills from personas or resume
      const userSkills: string[] = [] // TODO: Get from persona/resume when available

      const report = await InsightsService.generateWeeklyReport(
        {
          userId: user.id,
          applications,
          userSkills,
          weeksBack: 1,
        },
        session.access_token
      )

      // Refresh reports
      await fetchReports()
    } catch (err) {
      console.error('Error generating report:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate report')
      throw err
    } finally {
      setGenerating(false)
    }
  }, [user, session, applications, canGenerateReport, fetchReports, minApplicationsRequired])

  // Apply recommendation
  const applyRecommendation = useCallback(
    async (reportId: string, recommendationId: string) => {
      if (!user?.id) return

      try {
        await InsightsService.applyRecommendation(reportId, recommendationId, user.id)
        await fetchReports()
      } catch (err) {
        console.error('Error applying recommendation:', err)
        setError(err instanceof Error ? err.message : 'Failed to apply recommendation')
        throw err
      }
    },
    [user?.id, fetchReports]
  )

  // Dismiss recommendation
  const dismissRecommendation = useCallback(
    async (reportId: string, recommendationId: string) => {
      if (!user?.id) return

      try {
        await InsightsService.dismissRecommendation(reportId, recommendationId, user.id)
        await fetchReports()
      } catch (err) {
        console.error('Error dismissing recommendation:', err)
        setError(err instanceof Error ? err.message : 'Failed to dismiss recommendation')
        throw err
      }
    },
    [user?.id, fetchReports]
  )

  return {
    reports,
    latestReport,
    loading: loading || generating,
    error,
    canGenerateReport,
    minApplicationsRequired,
    currentApplicationCount,
    generateReport,
    applyRecommendation,
    dismissRecommendation,
    refetch: fetchReports,
  }
}
