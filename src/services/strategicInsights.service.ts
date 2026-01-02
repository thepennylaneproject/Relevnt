/**
 * =============================================================================
 * Strategic Insights Service
 * =============================================================================
 * Orchestrates AI-powered analysis of application patterns and generates
 * actionable recommendations for improving interview rates.
 * =============================================================================
 */

import { getAIClient } from './aiClient'
import type { Application } from '../hooks/useApplications'
import type { StrategicInsightsResponse, Recommendation } from '../types/ai-responses.types'
import { supabase } from '../lib/supabase'
import type { Database, Json } from '../types/supabase'
import * as Analytics from './applicationAnalytics.service'

export interface GenerateReportOptions {
  userId: string
  applications: Application[]
  userSkills?: string[]
  weeksBack?: number
}

export interface StoredReport {
  id: string
  generated_at: string
  period_start: string
  period_end: string
  total_applications: number
  total_responses: number
  total_interviews: number
  total_offers: number
  total_rejections: number
  response_rate: number
  interview_rate: number
  offer_rate: number
  insights: any
  recommendations: Recommendation[]
  recommendations_applied: string[]
  recommendations_dismissed: string[]
}

type StrategicPivotRow = Database['public']['Tables']['strategic_pivot_reports']['Row']

function toStoredReport(row: StrategicPivotRow): StoredReport {
  const recommendations = Array.isArray(row.recommendations)
    ? (row.recommendations as unknown as Recommendation[])
    : []

  return {
    id: row.id,
    generated_at: row.generated_at || row.created_at || new Date().toISOString(),
    period_start: row.period_start,
    period_end: row.period_end,
    total_applications: row.total_applications,
    total_responses: row.total_responses ?? 0,
    total_interviews: row.total_interviews ?? 0,
    total_offers: row.total_offers ?? 0,
    total_rejections: row.total_rejections ?? 0,
    response_rate: row.response_rate ?? 0,
    interview_rate: row.interview_rate ?? 0,
    offer_rate: row.offer_rate ?? 0,
    insights: row.insights,
    recommendations,
    recommendations_applied: (row.recommendations_applied || []) as string[],
    recommendations_dismissed: (row.recommendations_dismissed || []) as string[],
  }
}

/**
 * Check if user has enough data to generate meaningful insights
 */
export function hasEnoughDataForInsights(applications: Application[]): boolean {
  return applications.length >= 10
}

/**
 * Generate weekly strategic pivot report with AI insights
 */
export async function generateWeeklyReport(
  options: GenerateReportOptions,
  token: string
): Promise<StoredReport> {
  const { userId, applications, userSkills = [], weeksBack = 1 } = options

  if (!hasEnoughDataForInsights(applications)) {
    throw new Error('Insufficient data: At least 10 applications required for analysis')
  }

  // Gather analytics data
  const weeklySnapshot = Analytics.getWeeklySnapshot(applications, weeksBack)
  const skillAnalysis = Analytics.calculateOutcomesBySkills(applications)
  const experienceLevelOutcomes = Analytics.calculateOutcomesByExperienceLevel(applications)
  const companySizeOutcomes = Analytics.calculateOutcomesByCompanySize(applications)
  const industryOutcomes = Analytics.calculateOutcomesByIndustry(applications)
  const sourceOutcomes = Analytics.calculateOutcomesBySource(applications)
  const skillGaps = Analytics.identifySkillGaps(applications, userSkills)
  const timeSeries = Analytics.getTimeSeriesData(applications, 4)

  // Format context for AI
  const context = formatContextForAI({
    weeklySnapshot,
    skillAnalysis,
    experienceLevelOutcomes,
    companySizeOutcomes,
    industryOutcomes,
    sourceOutcomes,
    skillGaps,
    timeSeries,
    userSkills,
  })

  // Call AI for insights
  const aiClient = getAIClient()
  aiClient.setToken(token)

  const aiResponse = await aiClient.call({
    task: 'strategic_insights_generate' as any,
    input: context,
  }) as StrategicInsightsResponse

  if (!aiResponse.success || !aiResponse.data) {
    throw new Error(aiResponse.error || 'Failed to generate insights')
  }

  // Store report in database
  const insertPayload: Database['public']['Tables']['strategic_pivot_reports']['Insert'] = {
    user_id: userId,
    period_start: weeklySnapshot.periodStart,
    period_end: weeklySnapshot.periodEnd,
    total_applications: weeklySnapshot.totalApplications,
    total_responses: weeklySnapshot.totalResponses,
    total_interviews: weeklySnapshot.totalInterviews,
    total_offers: weeklySnapshot.totalOffers,
    total_rejections: weeklySnapshot.totalRejections,
    response_rate: weeklySnapshot.responseRate,
    interview_rate: weeklySnapshot.interviewRate,
    offer_rate: weeklySnapshot.offerRate,
    insights: {
      overview: aiResponse.data.overview,
      patterns: aiResponse.data.patterns,
      skillGaps: aiResponse.data.skillGaps,
    } as unknown as Json,
    recommendations: aiResponse.data.recommendations as unknown as Json,
  }

  const { data: report, error } = await supabase
    .from('strategic_pivot_reports')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to store report: ${error.message}`)
  }

  return toStoredReport(report)
}

/**
 * Get all reports for a user
 */
export async function getReports(userId: string): Promise<StoredReport[]> {
  const { data, error } = await supabase
    .from('strategic_pivot_reports')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`)
  }

  return (data || []).map(toStoredReport)
}

/**
 * Get the most recent report
 */
export async function getLatestReport(userId: string): Promise<StoredReport | null> {
  const { data, error } = await supabase
    .from('strategic_pivot_reports')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch latest report: ${error.message}`)
  }

  return data ? toStoredReport(data) : null
}

/**
 * Mark a recommendation as applied
 */
export async function applyRecommendation(
  reportId: string,
  recommendationId: string,
  userId: string
): Promise<void> {
  // Get current report
  const { data: report, error: fetchError } = await supabase
    .from('strategic_pivot_reports')
    .select('recommendations_applied')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  const applied = Array.isArray(report.recommendations_applied)
    ? (report.recommendations_applied as string[])
    : []
  if (applied.includes(recommendationId)) return // Already applied

  // Update
  const { error: updateError } = await supabase
    .from('strategic_pivot_reports')
    .update({
      recommendations_applied: [...applied, recommendationId],
    })
    .eq('id', reportId)
    .eq('user_id', userId)

  if (updateError) throw updateError
}

/**
 * Mark a recommendation as dismissed
 */
export async function dismissRecommendation(
  reportId: string,
  recommendationId: string,
  userId: string
): Promise<void> {
  const { data: report, error: fetchError } = await supabase
    .from('strategic_pivot_reports')
    .select('recommendations_dismissed')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  const dismissed = Array.isArray(report.recommendations_dismissed)
    ? (report.recommendations_dismissed as string[])
    : []
  if (dismissed.includes(recommendationId)) return

  const { error: updateError } = await supabase
    .from('strategic_pivot_reports')
    .update({
      recommendations_dismissed: [...dismissed, recommendationId],
    })
    .eq('id', reportId)
    .eq('user_id', userId)

  if (updateError) throw updateError
}

/**
 * Generate deep link to a settings/resume section
 */
export function generateDeepLink(linkedSection?: string): string {
  if (!linkedSection) return '/settings'

  // Map sections to actual routes
  const sectionMap: Record<string, string> = {
    'settings/targeting': '/settings#targeting',
    'settings/skills': '/settings#profile',
    'resume/skills': '/resume?highlight=skills',
    'resume/experience': '/resume?highlight=experience',
    'resume/summary': '/resume?highlight=summary',
  }

  return sectionMap[linkedSection] || '/settings'
}

// ============================================================================
// Helper Functions
// ============================================================================

interface AnalyticsContext {
  weeklySnapshot: Analytics.WeeklySnapshot
  skillAnalysis: Analytics.SkillAnalysis[]
  experienceLevelOutcomes: Analytics.OutcomeByCategory[]
  companySizeOutcomes: Analytics.OutcomeByCategory[]
  industryOutcomes: Analytics.OutcomeByCategory[]
  sourceOutcomes: Analytics.OutcomeByCategory[]
  skillGaps: Analytics.SkillGap[]
  timeSeries: Analytics.TimeSeriesDataPoint[]
  userSkills: string[]
}

function formatContextForAI(context: AnalyticsContext): any {
  const {
    weeklySnapshot,
    skillAnalysis,
    experienceLevelOutcomes,
    companySizeOutcomes,
    industryOutcomes,
    sourceOutcomes,
    skillGaps,
    timeSeries,
    userSkills,
  } = context

  // Build structured context for AI
  return {
    summary: {
      totalApplications: weeklySnapshot.totalApplications,
      responseRate: weeklySnapshot.responseRate,
      interviewRate: weeklySnapshot.interviewRate,
      offerRate: weeklySnapshot.offerRate,
    },
    trends: {
      timeSeries: timeSeries.map((ts) => ({
        week: ts.weekStart,
        applications: ts.applications,
        responses: ts.responses,
        interviews: ts.interviews,
        responseRate: ts.responseRate,
      })),
      trend:
        timeSeries.length >= 2
          ? timeSeries[timeSeries.length - 1].responseRate >
            timeSeries[0].responseRate
            ? 'improving'
            : 'declining'
          : 'stable',
    },
    patterns: {
      topSkills: skillAnalysis
        .filter((s) => s.isTopPerformer)
        .map((s) => s.skill),
      strugglingSkills: skillAnalysis
        .filter((s) => s.interviewRate < 10 && s.totalApplications >= 3)
        .map((s) => s.skill),
      bestExperienceLevel: experienceLevelOutcomes.sort(
        (a, b) => b.interviewRate - a.interviewRate
      )[0],
      bestCompanySize: companySizeOutcomes.sort(
        (a, b) => b.interviewRate - a.interviewRate
      )[0],
      bestIndustry: industryOutcomes.sort(
        (a, b) => b.interviewRate - a.interviewRate
      )[0],
      bestSource: sourceOutcomes.sort(
        (a, b) => b.interviewRate - a.interviewRate
      )[0],
    },
    skillGaps: skillGaps.map((gap) => ({
      skill: gap.skill,
      rejectionCount: gap.rejectionCount,
      appearanceCount: gap.appearanceCount,
    })),
    userProfile: {
      skills: userSkills,
    },
  }
}
