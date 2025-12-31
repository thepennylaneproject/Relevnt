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
        const { profile, voiceSettings } = body

        if (!profile) {
            return createResponse(400, { error: 'Missing profile data' })
        }

        const tier = await getUserTier(userId)

        // Default voice settings if not provided
        const voice = voiceSettings || {
            tone: 'professional',
            style: 'confident',
            length: 'medium'
        }

        const aiInput = {
            profile: {
                name: profile.name || '',
                title: profile.title || profile.currentRole || '',
                experience: profile.experience || profile.workHistory || [],
                skills: profile.skills || [],
                education: profile.education || [],
                achievements: profile.achievements || [],
                targetRole: profile.targetRole || '',
                industry: profile.industry || ''
            },
            voice
        }

        const result = await routeLegacyTask('generate-career-narrative', aiInput, {
            userId,
            tier,
            quality: 'high',
            traceId: body.traceId
        })

        if (!result.ok) {
            console.error('[Narrative] AI Generation failed:', result.error_message)
            return createResponse(502, { error: 'Generation failed', details: result.error_message })
        }

        const narrativeOutput = (result.output as any)?.data || result.output

        // Structure the response
        const narratives = {
            origin: narrativeOutput.origin || '',
            pivot: narrativeOutput.pivot || '',
            value: narrativeOutput.value || '',
            future: narrativeOutput.future || '',
            elevator: narrativeOutput.elevator || narrativeOutput.summary || ''
        }

        // Save to Database
        const supabase = createAdminClient()
        const { data: savedNarrative, error: dbError } = await supabase
            .from('career_narratives')
            .upsert({
                user_id: userId,
                profile_snapshot: aiInput.profile,
                voice_settings: voice,
                narratives,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single()

        if (dbError) {
            console.error('[Narrative] Database error:', dbError)
        }

        return createResponse(200, {
            ok: true,
            data: {
                narratives: savedNarrative?.narratives || narratives,
                narrativeId: savedNarrative?.id,
                trace_id: result.trace_id
            }
        })

    } catch (err: any) {
        console.error('[Narrative] Handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
