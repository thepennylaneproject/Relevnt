/**
 * =============================================================================
 * Application Analytics Service
 * =============================================================================
 * Provides pattern detection and statistical analysis for application outcomes.
 * Used by Strategic Pivot Report to identify what's working and what's not.
 * =============================================================================
 */

import type { Application, ApplicationStatus } from '../hooks/useApplications'

export interface OutcomeByCategory {
  category: string
  totalApplications: number
  responses: number
  interviews: number
  offers: number
  rejections: number
  responseRate: number
  interviewRate: number
  offerRate: number
}

export interface SkillAnalysis {
  skill: string
  totalApplications: number
  interviews: number
  interviewRate: number
  isTopPerformer: boolean
}

export interface WeeklySnapshot {
  periodStart: string
  periodEnd: string
  totalApplications: number
  totalResponses: number
  totalInterviews: number
  totalOffers: number
  totalRejections: number
  responseRate: number
  interviewRate: number
  offerRate: number
}

export interface SkillGap {
  skill: string
  appearanceCount: number
  rejectionCount: number
  missingFromProfile: boolean
}

export interface TimeSeriesDataPoint {
  weekStart: string
  applications: number
  responses: number
  interviews: number
  responseRate: number
}

/**
 * Calculate outcomes grouped by job experience level
 */
export function calculateOutcomesByExperienceLevel(
  applications: Application[]
): OutcomeByCategory[] {
  const grouped = new Map<string, Application[]>()

  applications.forEach((app) => {
    if (app.job_experience_level) {
      const key = app.job_experience_level
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(app)
    }
  })

  return Array.from(grouped.entries()).map(([level, apps]) =>
    calculateCategoryMetrics(level, apps)
  )
}

/**
 * Calculate outcomes grouped by company size
 */
export function calculateOutcomesByCompanySize(
  applications: Application[]
): OutcomeByCategory[] {
  const grouped = new Map<string, Application[]>()

  applications.forEach((app) => {
    if (app.job_company_size) {
      const key = app.job_company_size
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(app)
    }
  })

  return Array.from(grouped.entries()).map(([size, apps]) =>
    calculateCategoryMetrics(size, apps)
  )
}

/**
 * Calculate outcomes grouped by industry
 */
export function calculateOutcomesByIndustry(
  applications: Application[]
): OutcomeByCategory[] {
  const grouped = new Map<string, Application[]>()

  applications.forEach((app) => {
    if (app.job_industry) {
      const key = app.job_industry
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(app)
    }
  })

  return Array.from(grouped.entries()).map(([industry, apps]) =>
    calculateCategoryMetrics(industry, apps)
  )
}

/**
 * Calculate outcomes grouped by application source
 */
export function calculateOutcomesBySource(
  applications: Application[]
): OutcomeByCategory[] {
  const grouped = new Map<string, Application[]>()

  applications.forEach((app) => {
    if (app.application_source) {
      const key = app.application_source
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(app)
    }
  })

  return Array.from(grouped.entries()).map(([source, apps]) =>
    calculateCategoryMetrics(source, apps)
  )
}

/**
 * Calculate outcomes by skills required
 */
export function calculateOutcomesBySkills(
  applications: Application[]
): SkillAnalysis[] {
  const skillMap = new Map<
    string,
    { total: number; interviews: number }
  >()

  applications.forEach((app) => {
    const skills = app.job_skills_required || []
    const hasInterview = isInterviewStatus(app.status)

    skills.forEach((skill) => {
      if (!skillMap.has(skill)) {
        skillMap.set(skill, { total: 0, interviews: 0 })
      }
      const stats = skillMap.get(skill)!
      stats.total++
      if (hasInterview) stats.interviews++
    })
  })

  const skillAnalyses: SkillAnalysis[] = Array.from(skillMap.entries())
    .map(([skill, stats]) => ({
      skill,
      totalApplications: stats.total,
      interviews: stats.interviews,
      interviewRate:
        stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
      isTopPerformer: false,
    }))
    .filter((s) => s.totalApplications >= 2) // Need at least 2 apps to be meaningful
    .sort((a, b) => b.interviewRate - a.interviewRate)

  // Mark top 20% as top performers
  const topCount = Math.ceil(skillAnalyses.length * 0.2)
  skillAnalyses.slice(0, topCount).forEach((s) => (s.isTopPerformer = true))

  return skillAnalyses
}

/**
 * Identify skill gaps - skills appearing in rejections but not in user's applications
 */
export function identifySkillGaps(
  applications: Application[],
  userSkills: string[] = []
): SkillGap[] {
  const skillMap = new Map<
    string,
    { total: number; rejections: number }
  >()

  applications.forEach((app) => {
    const skills = app.job_skills_required || []
    const isRejected = app.status === 'rejected'

    skills.forEach((skill) => {
      if (!skillMap.has(skill)) {
        skillMap.set(skill, { total: 0, rejections: 0 })
      }
      const stats = skillMap.get(skill)!
      stats.total++
      if (isRejected) stats.rejections++
    })
  })

  return Array.from(skillMap.entries())
    .map(([skill, stats]) => ({
      skill,
      appearanceCount: stats.total,
      rejectionCount: stats.rejections,
      missingFromProfile: !userSkills
        .map((s) => s.toLowerCase())
        .includes(skill.toLowerCase()),
    }))
    .filter(
      (gap) =>
        gap.rejectionCount >= 2 && // Show up in at least 2 rejections
        gap.missingFromProfile &&
        gap.appearanceCount >= 3 // Common enough to matter
    )
    .sort((a, b) => b.rejectionCount - a.rejectionCount)
}

/**
 * Get weekly snapshot of application metrics
 */
export function getWeeklySnapshot(
  applications: Application[],
  weeksBack: number = 1
): WeeklySnapshot {
  const now = new Date()
  const periodEnd = new Date(now)
  const periodStart = new Date(now)
  periodStart.setDate(periodStart.getDate() - weeksBack * 7)

  const weekApps = applications.filter((app) => {
    const appDate = new Date(app.applied_date)
    return appDate >= periodStart && appDate <= periodEnd
  })

  return calculateWeeklyMetrics(
    weekApps,
    periodStart.toISOString().split('T')[0],
    periodEnd.toISOString().split('T')[0]
  )
}

/**
 * Get time series data for trend analysis
 */
export function getTimeSeriesData(
  applications: Application[],
  weeksBack: number = 8
): TimeSeriesDataPoint[] {
  const dataPoints: TimeSeriesDataPoint[] = []
  const now = new Date()

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 7)

    const weekApps = applications.filter((app) => {
      const appDate = new Date(app.applied_date)
      return appDate >= weekStart && appDate <= weekEnd
    })

    const responses = weekApps.filter((app) => hasResponse(app.status))
    const interviews = weekApps.filter((app) =>
      isInterviewStatus(app.status)
    )

    dataPoints.push({
      weekStart: weekStart.toISOString().split('T')[0],
      applications: weekApps.length,
      responses: responses.length,
      interviews: interviews.length,
      responseRate:
        weekApps.length > 0
          ? (responses.length / weekApps.length) * 100
          : 0,
    })
  }

  return dataPoints
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateCategoryMetrics(
  category: string,
  apps: Application[]
): OutcomeByCategory {
  const responses = apps.filter((app) => hasResponse(app.status))
  const interviews = apps.filter((app) => isInterviewStatus(app.status))
  const offers = apps.filter((app) => isOfferStatus(app.status))
  const rejections = apps.filter((app) => app.status === 'rejected')

  return {
    category,
    totalApplications: apps.length,
    responses: responses.length,
    interviews: interviews.length,
    offers: offers.length,
    rejections: rejections.length,
    responseRate:
      apps.length > 0 ? (responses.length / apps.length) * 100 : 0,
    interviewRate:
      apps.length > 0 ? (interviews.length / apps.length) * 100 : 0,
    offerRate: apps.length > 0 ? (offers.length / apps.length) * 100 : 0,
  }
}

function calculateWeeklyMetrics(
  apps: Application[],
  periodStart: string,
  periodEnd: string
): WeeklySnapshot {
  const responses = apps.filter((app) => hasResponse(app.status))
  const interviews = apps.filter((app) => isInterviewStatus(app.status))
  const offers = apps.filter((app) => isOfferStatus(app.status))
  const rejections = apps.filter((app) => app.status === 'rejected')

  return {
    periodStart,
    periodEnd,
    totalApplications: apps.length,
    totalResponses: responses.length,
    totalInterviews: interviews.length,
    totalOffers: offers.length,
    totalRejections: rejections.length,
    responseRate:
      apps.length > 0 ? (responses.length / apps.length) * 100 : 0,
    interviewRate:
      apps.length > 0 ? (interviews.length / apps.length) * 100 : 0,
    offerRate: apps.length > 0 ? (offers.length / apps.length) * 100 : 0,
  }
}

function hasResponse(status: ApplicationStatus | null | undefined): boolean {
  if (!status) return false
  return status !== 'applied' && status !== 'staged'
}

function isInterviewStatus(
  status: ApplicationStatus | null | undefined
): boolean {
  if (!status) return false
  return ['interviewing', 'offer', 'accepted'].includes(status)
}

function isOfferStatus(
  status: ApplicationStatus | null | undefined
): boolean {
  if (!status) return false
  return ['offer', 'accepted'].includes(status)
}
