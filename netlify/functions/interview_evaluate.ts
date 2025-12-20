
import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { runAI } from './ai/run'
import type { UserTier } from '../../src/lib/ai/types'

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
        const { question, userAnswer, position, company, interview_prep_id } = body

        if (!question || !userAnswer) {
            return createResponse(400, { error: 'Missing question or answer' })
        }

        const tier = await getUserTier(userId)

        // 1. Run AI Evaluation
        const aiInput = {
            question,
            userAnswer,
            context: {
                position: position || 'N/A',
                company: company || 'N/A'
            }
        }

        const aiResult = await runAI({
            task: 'interview_evaluate',
            input: aiInput,
            userId,
            tier,
            jsonSchema: {
                type: 'object',
                properties: {
                    score: { type: 'number', minimum: 1, maximum: 10 },
                    feedback: { type: 'string' },
                    strengths: { type: 'array', items: { type: 'string' } },
                    areas_to_improve: { type: 'array', items: { type: 'string' } },
                    suggested_better_answer: { type: 'string' }
                },
                required: ['score', 'feedback', 'strengths', 'areas_to_improve']
            }
        })

        if (!aiResult.ok) {
            console.error('[Interview] AI Evaluation failed:', aiResult.error_message)
            return createResponse(502, { error: 'Evaluation failed', details: aiResult.error_message })
        }

        const evaluation = aiResult.output as any

        // 2. Save Session to Database
        const supabase = createAdminClient()
        const { data: savedSession, error: dbError } = await supabase
            .from('interview_sessions')
            .insert({
                user_id: userId,
                interview_prep_id: interview_prep_id || null,
                question: question,
                user_answer: userAnswer,
                feedback: JSON.stringify(evaluation),
                score: evaluation.score,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (dbError) {
            console.error('[Interview] Session save error:', dbError)
        }

        return createResponse(200, {
            ok: true,
            data: {
                evaluation,
                sessionId: savedSession?.id,
                trace_id: aiResult.trace_id
            }
        })

    } catch (err: any) {
        console.error('[Interview] Evaluation handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
