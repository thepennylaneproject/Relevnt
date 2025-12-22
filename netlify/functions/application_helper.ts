
import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { routeLegacyTask } from './ai/legacyTaskRouter'
import type { UserTier } from '../../src/lib/ai/types'


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

        // 4. Run AI via Modular Router
        const result = await routeLegacyTask('application-question-answer', {
            question,
            mode,
            context: {
                roleTitle,
                companyName,
                jobDescriptionExcerpt: jobDescription ? jobDescription.slice(0, 1000) : 'N/A',
                resumeContext: resumeContext || 'No resume context provided.'
            }
        }, {
            userId,
            tier,
            traceId: body.traceId
        })

        if (!result.ok) {
            console.error('AI run failed', result)
            return createResponse(502, {
                error: 'AI generation failed',
                details: result.error_message
            })
        }

        // Output normalization (handle the { success: true, data: { ... } } wrapper)
        const output = (result.output as any)?.data || result.output

        return createResponse(200, {
            ok: true,
            output: output,
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
