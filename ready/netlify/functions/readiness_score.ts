import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'

interface ReadinessBreakdown {
    practice: number
    assessment: number
    skills: number
    narrative: number
}

interface ReadinessResult {
    overallScore: number
    breakdown: ReadinessBreakdown
    ready: boolean
    milestoneReached: boolean
    recommendations: string[]
}

const READINESS_THRESHOLD = 80

export const handler: Handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
    }

    if (event.httpMethod !== 'GET') {
        return createResponse(405, { error: 'Method not allowed' })
    }

    const authHeader = event.headers.authorization || event.headers.Authorization
    const { userId, error: authError } = await verifyToken(authHeader)
    if (authError || !userId) {
        return createResponse(401, { error: authError || 'Unauthorized' })
    }

    try {
        const supabase = createAdminClient()
        const recommendations: string[] = []

        // ========================================================================
        // PILLAR 1: Practice (25%)
        // Criteria: Average interview score >= 7, at least 3 sessions
        // ========================================================================
        const { data: sessions } = await supabase
            .from('interview_practice_sessions')
            .select('practice_data')
            .eq('user_id', userId)
            .eq('status', 'completed')

        let practiceScore = 0
        if (sessions && sessions.length > 0) {
            const allScores = sessions.flatMap((s: any) =>
                (s.practice_data || [])
                    .map((d: any) => d.score)
                    .filter((score: number) => score > 0)
            )

            const avgScore = allScores.length > 0
                ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length
                : 0

            // Quality (70%) + Quantity (30%)
            const qualityScore = Math.min((avgScore / 10) * 100, 100)
            const quantityScore = Math.min((sessions.length / 10) * 100, 100)
            practiceScore = Math.round(qualityScore * 0.7 + quantityScore * 0.3)

            const meetsThreshold = avgScore >= 7 && sessions.length >= 3

            if (sessions.length < 3) {
                recommendations.push('Complete at least 3 practice sessions')
            } else if (avgScore < 7) {
                recommendations.push('Improve your interview responses (target avg score 7+)')
            }
        } else {
            recommendations.push('Start practicing interview questions')
        }

        // ========================================================================
        // PILLAR 2: Assessment (25%)
        // Criteria: LinkedIn OR Portfolio analyzed with score >= 70
        // ========================================================================
        const { data: linkedin } = await supabase
            .from('linkedin_profiles')
            .select('analysis_results')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        const { data: portfolio } = await supabase
            .from('portfolio_analyses')
            .select('analysis_results')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        const linkedinScore = (linkedin as any)?.analysis_results?.overall_score || null
        const portfolioScore = (portfolio as any)?.analysis_results?.overall_score || null

        const assessmentScores = [linkedinScore, portfolioScore].filter(s => s !== null) as number[]
        let assessmentScore = 0
        
        if (assessmentScores.length > 0) {
            assessmentScore = Math.max(...assessmentScores)
            
            if (assessmentScore < 70) {
                recommendations.push('Improve your profile analysis score (target 70+)')
            }
        } else {
            recommendations.push('Analyze your LinkedIn or Portfolio')
        }

        // ========================================================================
        // PILLAR 3: Skills (25%)
        // Criteria: At least 50% of critical gaps marked "addressed"
        // ========================================================================
        const { data: skillGapAnalysis } = await supabase
            .from('skill_gap_analyses')
            .select('gaps')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        let skillsScore = 0
        const gaps = (skillGapAnalysis as any)?.gaps || []
        
        if (gaps.length > 0) {
            const addressedGaps = gaps.filter((g: any) => g.status === 'addressed').length
            skillsScore = Math.round((addressedGaps / gaps.length) * 100)
            
            if (skillsScore < 50) {
                recommendations.push(`Address more skill gaps (${addressedGaps}/${gaps.length} completed)`)
            }
        } else {
            recommendations.push('Complete a skill gap analysis')
        }

        // ========================================================================
        // PILLAR 4: Narrative (25%)
        // Criteria: Career narrative generated and saved
        // ========================================================================
        const { data: narrative } = await supabase
            .from('career_narratives')
            .select('*')
            .eq('user_id', userId)
            .limit(1)
            .single()

        let narrativeScore = 0
        if (narrative) {
            const hasContent = narrative.origin_story || narrative.pivot_explanation ||
                narrative.value_proposition || narrative.future_vision
            narrativeScore = hasContent ? 100 : 0
        }
        
        if (narrativeScore < 100) {
            recommendations.push('Generate your career narrative')
        }

        // ========================================================================
        // Calculate Overall Score (25% each)
        // ========================================================================
        const breakdown: ReadinessBreakdown = {
            practice: practiceScore,
            assessment: assessmentScore,
            skills: skillsScore,
            narrative: narrativeScore
        }

        const overallScore = Math.round(
            breakdown.practice * 0.25 +
            breakdown.assessment * 0.25 +
            breakdown.skills * 0.25 +
            breakdown.narrative * 0.25
        )

        // ========================================================================
        // Check for Milestone Achievement (80%+ threshold)
        // ========================================================================
        let milestoneReached = false
        
        if (overallScore >= READINESS_THRESHOLD) {
            // Check if this is a NEW milestone (previous score was below threshold)
            const { data: previousSnapshot } = await supabase
                .from('readiness_snapshots')
                .select('overall_score')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const previousScore = (previousSnapshot as any)?.overall_score || 0

            if (previousScore < READINESS_THRESHOLD) {
                milestoneReached = true
                
                // Save milestone snapshot
                await supabase.from('readiness_snapshots').insert({
                    user_id: userId,
                    overall_score: overallScore,
                    practice_score: practiceScore,
                    assessment_score: assessmentScore,
                    skills_score: skillsScore,
                    narrative_score: narrativeScore,
                    snapshot_date: new Date().toISOString().split('T')[0],
                })

                // TODO: Send email notification when email service is set up
                // await sendMilestoneEmail(userId, overallScore)
            }
        }

        const result: ReadinessResult = {
            overallScore,
            breakdown,
            ready: overallScore >= READINESS_THRESHOLD,
            milestoneReached,
            recommendations: recommendations.slice(0, 3) // Top 3 recommendations
        }

        return createResponse(200, {
            ok: true,
            data: result
        })

    } catch (err: any) {
        console.error('[Readiness] Handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
