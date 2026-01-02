import { useMemo } from 'react'
import { useApplications, type Application } from './useApplications'

/**
 * Company sentiment tag types
 */
export type CompanySentimentTag = 'fast' | 'average' | 'slow' | 'unresponsive'

/**
 * Company sentiment data interface
 */
export interface CompanySentiment {
  companyName: string
  avgResponseDays: number
  responseRate: number
  totalApplications: number
  tag: CompanySentimentTag
}

/**
 * Thresholds for company sentiment tags (in days)
 */
const SENTIMENT_THRESHOLDS = {
  fast: 3,
  average: 7,
  slow: 14,
} as const

/**
 * Determine sentiment tag based on average response time and response rate
 */
function calculateSentimentTag(
  avgResponseDays: number,
  responseRate: number
): CompanySentimentTag {
  // Unresponsive if no responses received
  if (responseRate === 0) {
    return 'unresponsive'
  }

  // Categorize based on average response time
  if (avgResponseDays <= SENTIMENT_THRESHOLDS.fast) {
    return 'fast'
  } else if (avgResponseDays <= SENTIMENT_THRESHOLDS.average) {
    return 'average'
  } else if (avgResponseDays <= SENTIMENT_THRESHOLDS.slow) {
    return 'slow'
  } else {
    return 'unresponsive'
  }
}

/**
 * Hook to calculate company sentiment data from applications
 */
export function useCompanySentiment() {
  const { applications, loading, error } = useApplications()

  const companySentiments = useMemo(() => {
    if (loading || !applications.length) {
      return []
    }

    // Group applications by company
    const companyMap = new Map<string, Application[]>()
    
    applications.forEach((app) => {
      const companyName = app.company.trim()
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, [])
      }
      companyMap.get(companyName)!.push(app)
    })

    // Calculate sentiment for each company
    const sentiments: CompanySentiment[] = []

    companyMap.forEach((apps, companyName) => {
      const totalApplications = apps.length
      
      // Count applications with responses
      const appsWithResponse = apps.filter(app => app.response_received)
      const responseRate = (appsWithResponse.length / totalApplications) * 100

      // Calculate average response time (only for apps with responses and response time set)
      const responseTimes = apps
        .filter(app => app.company_response_time !== null && app.company_response_time !== undefined)
        .map(app => app.company_response_time!)

      const avgResponseDays = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 999 // Large number for companies with no response data

      const tag = calculateSentimentTag(avgResponseDays, responseRate)

      sentiments.push({
        companyName,
        avgResponseDays: responseTimes.length > 0 ? avgResponseDays : 0,
        responseRate,
        totalApplications,
        tag,
      })
    })

    // Sort by total applications (most active companies first)
    return sentiments.sort((a, b) => b.totalApplications - a.totalApplications)
  }, [applications, loading])

  return {
    companySentiments,
    loading,
    error,
  }
}
