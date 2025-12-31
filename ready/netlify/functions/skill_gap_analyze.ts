import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { routeLegacyTask } from './ai/legacyTaskRouter'
import type { UserTier } from '../src/lib/ai/types'

async function getUserTier(userId: string): Promise<UserTier> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single()

    if (error || !data) {
        return 'free'
    }
    return (data.tier as UserTier) || 'free'
}

export const handler: Handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
    }

    if (event.httpMethod !== 'POST') {
        return createResponse(405, { error: 'Method not allowed' })
    }

    const authHeader = event.headers.authorization || event.headers.Authorization
    const { userId, error: authError } = await verifyToken(authHeader)
    if (authError || !userId) {
        return createResponse(401, { error: authError || 'Unauthorized' })
    }

    try {
        const body = JSON.parse(event.body || '{}')
        const { currentSkills, targetRole, jobRequirements, resumeText, jobDescription } = body

        // Validate input - accept either explicit skills or resume+JD
        if (!targetRole) {
            return createResponse(400, { error: 'Missing targetRole' })
        }

        // Build input for AI
        let skills: string[] = currentSkills || []
        let requirements: string[] = jobRequirements || []

        // If resume/JD provided instead of explicit arrays, let AI extract
        const useExtraction = (!currentSkills || currentSkills.length === 0) && resumeText

        const tier = await getUserTier(userId)

        const aiInput = useExtraction
            ? {
                resumeText,
                jobDescription: jobDescription || '',
                targetRole
              }
            : {
                currentSkills: skills,
                targetRole,
                jobRequirements: requirements
              }

        const result = await routeLegacyTask('skill-gap-analysis', aiInput, {
            userId,
            tier,
            traceId: body.traceId
        })

        if (!result.ok) {
            console.error('[SkillGap] AI Analysis failed:', result.error_message)
            return createResponse(502, { error: 'Analysis failed', details: result.error_message })
        }

        const analysisOutput = (result.output as any)?.data || result.output

        // Structure the response
        const analysis = {
            gaps: (analysisOutput.gaps || []).map((gap: any) => ({
                skill: gap.skill || gap.name || '',
                importance: gap.importance || 'important',
                difficulty: gap.difficulty || 'intermediate',
                timeToLearn: gap.timeToLearn || 'Unknown'
            })),
            strengths: analysisOutput.strengths || analysisOutput.currentSkills || [],
            actionPlan: analysisOutput.actionPlan || analysisOutput.learningPath || '',
            overallReadiness: analysisOutput.readinessScore || null
        }

        // Save to Database
        const supabase = createAdminClient()
        const { data: savedAnalysis, error: dbError } = await supabase
            .from('skill_gap_analyses')
            .insert({
                user_id: userId,
                target_role: targetRole,
                current_skills: skills,
                job_requirements: requirements,
                analysis_results: analysis,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (dbError) {
            console.error('[SkillGap] Database error:', dbError)
            // Continue anyway - return analysis even if save fails
        }

        return createResponse(200, {
            ok: true,
            data: {
                analysis: savedAnalysis?.analysis_results || analysis,
                analysisId: savedAnalysis?.id,
                trace_id: result.trace_id
            }
        })

    } catch (err: any) {
        console.error('[SkillGap] Handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
