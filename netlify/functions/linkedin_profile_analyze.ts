
import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { runAI } from './ai/run'
import type { UserTier } from '../../src/lib/ai/types'
import type { LinkedInAnalysis } from '../../src/shared/types'

const RAPIDAPI_KEY = process.env.RAPIDAPI_API_KEY

async function fetchLinkedInProfile(url: string) {
    if (!RAPIDAPI_KEY) {
        throw new Error('Missing RAPIDAPI_API_KEY')
    }

    // Extract username/id from URL
    // e.g. https://www.linkedin.com/in/username/
    const match = url.match(/linkedin\.com\/in\/([^/]+)/)
    if (!match) {
        throw new Error('Invalid LinkedIn URL. Must be a profile URL (e.g., linkedin.com/in/username)')
    }
    const username = match[1]

    console.log(`[LinkedIn] Fetching profile for: ${username}`)

    const response = await fetch(`https://linkedin-data-api.p.rapidapi.com/?username=${username}`, {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'linkedin-data-api.p.rapidapi.com'
        }
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error(`[LinkedIn] RapidAPI error: ${response.status}`, errText)
        throw new Error(`Failed to fetch LinkedIn profile: ${response.status}`)
    }

    return await response.json()
}

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
        const { linkedinUrl } = body

        if (!linkedinUrl) {
            return createResponse(400, { error: 'Missing linkedinUrl' })
        }

        const tier = await getUserTier(userId)

        // 1. Fetch Profile Data
        const profileData = await fetchLinkedInProfile(linkedinUrl)

        // 2. Run AI Analysis
        const aiInput = {
            profile: profileData,
            targetRoles: body.targetRoles || [],
            context: body.context || ''
        }

        const aiResult = await runAI({
            task: 'linkedin_profile_analysis',
            input: aiInput,
            userId,
            tier,
            jsonSchema: {
                type: 'object',
                properties: {
                    headline_score: { type: 'number' },
                    summary_score: { type: 'number' },
                    experience_score: { type: 'number' },
                    overall_score: { type: 'number' },
                    suggestions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                section: { type: 'string' },
                                improvement: { type: 'string' },
                                reason: { type: 'string' }
                            },
                            required: ['section', 'improvement', 'reason']
                        }
                    },
                    optimized_headline: { type: 'string' },
                    optimized_summary: { type: 'string' }
                },
                required: ['headline_score', 'summary_score', 'experience_score', 'overall_score', 'suggestions']
            }
        })

        if (!aiResult.ok) {
            console.error('[LinkedIn] AI Analysis failed:', aiResult.error_message)
            return createResponse(502, { error: 'Analysis failed', details: aiResult.error_message })
        }

        const analysisResults = aiResult.output as LinkedInAnalysis

        // 3. Save to Database
        const supabase = createAdminClient()
        const { data: savedProfile, error: dbError } = await supabase
            .from('linkedin_profiles')
            .upsert({
                user_id: userId,
                linkedin_url: linkedinUrl,
                profile_data: profileData,
                analysis_results: analysisResults,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, linkedin_url' })
            .select()
            .single()

        if (dbError) {
            console.error('[LinkedIn] Database error:', dbError)
            // Still return the analysis even if DB save fails
        }

        return createResponse(200, {
            ok: true,
            data: {
                profile: savedProfile || { linkedin_url: linkedinUrl, profile_data: profileData, analysis_results: analysisResults },
                trace_id: aiResult.trace_id
            }
        })

    } catch (err: any) {
        console.error('[LinkedIn] Handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
