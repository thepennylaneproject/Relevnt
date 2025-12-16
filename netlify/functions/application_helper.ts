
import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { runAI } from './ai/run'
import type { UserTier } from '../../src/lib/ai/types'

const JSON_SCHEMA = {
    type: 'object',
    properties: {
        answer: { type: 'string' },
        bullet_points: { type: 'array', items: { type: 'string' } },
        follow_up_questions: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
    },
    required: ['answer', 'bullet_points', 'follow_up_questions', 'warnings'],
}

// Helper to fetch user tier
async function getUserTier(userId: string): Promise<UserTier> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single()

    if (error || !data) {
        console.warn('Could not fetch user tier, defaulting to free', error)
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

    // 1. Auth
    const authHeader = event.headers.authorization || event.headers.Authorization
    const { userId, error: authError } = await verifyToken(authHeader)
    if (authError || !userId) {
        return createResponse(401, { error: authError || 'Unauthorized' })
    }

    try {
        // 2. Parse Body
        const body = JSON.parse(event.body || '{}')
        const {
            question,
            mode = 'default',
            roleTitle,
            companyName,
            jobDescription,
            resumeContext,
        } = body

        if (!question || typeof question !== 'string') {
            return createResponse(400, { error: 'Missing question' })
        }

        // 3. Get Tier
        const tier = await getUserTier(userId)

        // 4. Construct AI Input
        // We construct a specific prompt structure for the 'application_question_answer' task
        const systemInstruction = `You are a helpful career assistant.
    Your task: Draft a high-quality answer for an application question.
    Mode: ${mode}
    
    CRITICAL SAFETY RULES:
    1. Do NOT invent facts. Only use the provided Resume Context.
    2. If the Resume Context is missing information needed to answer the question, place a warning in the "warnings" array and use a placeholder like [Insert specific skill] in the answer.
    3. Do NOT make up specific metrics or company names if not present in context.
    
    Context:
    - Target Role: ${roleTitle || 'N/A'}
    - Target Company: ${companyName || 'N/A'}
    - Job Description Excerpt: ${jobDescription ? jobDescription.slice(0, 1000) : 'N/A'}
    
    Resume Context:
    ${resumeContext || 'No resume context provided.'}
    
    Question to Answer: "${question}"
    `

        // 5. Run AI
        const result = await runAI({
            task: 'application_question_answer',
            input: systemInstruction, // The task spec for this uses text input which we format above
            userId,
            tier,
            // We rely on runAI to clamp quality based on tier, but we can hint default
            jsonSchema: JSON_SCHEMA,
        })

        if (!result.ok) {
            console.error('AI run failed', result)
            return createResponse(502, {
                error: 'AI generation failed',
                details: result.error_message
            })
        }

        return createResponse(200, {
            ok: true,
            output: result.output,
            trace_id: result.trace_id,
            provider: result.provider,
            model: result.model,
            cache_hit: result.cache_hit,
        })

    } catch (err: any) {
        console.error('application_helper error', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
