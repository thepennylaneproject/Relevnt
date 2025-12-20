
import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { runAI } from './ai/run'
import type { UserTier } from '../../src/lib/ai/types'
import type { InterviewPrepRow, InterviewQuestion } from '../../src/shared/types'

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
        const { position, company, resumeContext, jobDescription, application_id } = body

        if (!position || !company) {
            return createResponse(400, { error: 'Missing position or company' })
        }

        const tier = await getUserTier(userId)

        // 1. Run AI Analysis
        const aiInput = {
            position,
            company,
            resumeContext: resumeContext || 'Not provided',
            jobDescription: jobDescription || 'Not provided'
        }

        const aiResult = await runAI({
            task: 'interview_prepare',
            input: aiInput,
            userId,
            tier,
            jsonSchema: {
                type: 'object',
                properties: {
                    questions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                text: { type: 'string' },
                                type: { type: 'string', enum: ['behavioral', 'technical', 'situational'] },
                                sample_answer: { type: 'string' },
                                talking_points: { type: 'array', items: { type: 'string' } }
                            },
                            required: ['text', 'type', 'sample_answer', 'talking_points']
                        }
                    },
                    overall_strategy: { type: 'string' }
                },
                required: ['questions', 'overall_strategy']
            }
        })

        if (!aiResult.ok) {
            console.error('[Interview] AI Preparation failed:', aiResult.error_message)
            return createResponse(502, { error: 'Preparation failed', details: aiResult.error_message })
        }

        const output = aiResult.output as any
        const questions: InterviewQuestion[] = output.questions.map((q: any, i: number) => ({
            id: `q-${i}-${Date.now()}`,
            ...q
        }))

        // 2. Save to Database
        const supabase = createAdminClient()
        const { data: savedPrep, error: dbError } = await supabase
            .from('interview_prep')
            .insert({
                user_id: userId,
                application_id: application_id || null,
                position,
                company,
                questions: questions as any,
                ai_feedback: { strategy: output.overall_strategy },
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (dbError) {
            console.error('[Interview] Database error:', dbError)
            // Still return the generated questions even if DB save fails
        }

        return createResponse(200, {
            ok: true,
            data: {
                prep: savedPrep || { position, company, questions, ai_feedback: { strategy: output.overall_strategy } },
                trace_id: aiResult.trace_id
            }
        })

    } catch (err: any) {
        console.error('[Interview] Handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
