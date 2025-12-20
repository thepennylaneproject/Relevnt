
import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken, createAdminClient } from './utils/supabase'
import { runAI } from './ai/run'
import type { UserTier } from '../../src/lib/ai/types'
import type { PortfolioAnalysis } from '../../src/shared/types'

async function fetchPortfolioContent(url: string) {
    try {
        console.log(`[Portfolio] Attempting to fetch content for: ${url}`)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'RelevntBot/1.0 (Career Optimization Service)'
            }
        })

        if (!response.ok) {
            console.warn(`[Portfolio] Direct fetch failed: ${response.status}. Proceeding with URL context only.`)
            return null
        }

        const html = await response.text()
        // Strip tags for AI context
        return html.replace(/<[^>]*>?/gm, ' ').slice(0, 15000)
    } catch (err) {
        console.warn(`[Portfolio] Fetch error:`, err)
        return null
    }
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
        const { portfolioUrl } = body

        if (!portfolioUrl) {
            return createResponse(400, { error: 'Missing portfolioUrl' })
        }

        const tier = await getUserTier(userId)

        // 1. Get Portfolio Context
        const content = await fetchPortfolioContent(portfolioUrl)

        // 2. Run AI Analysis
        const aiInput = {
            url: portfolioUrl,
            content: content || 'Content extraction failed, please analyze based on URL and common patterns for this domain.',
            targetLevel: body.targetLevel || 'Senior',
            industry: body.industry || 'Technology'
        }

        const aiResult = await runAI({
            task: 'portfolio_analysis',
            input: aiInput,
            userId,
            tier,
            jsonSchema: {
                type: 'object',
                properties: {
                    visual_score: { type: 'number' },
                    usability_score: { type: 'number' },
                    content_score: { type: 'number' },
                    overall_score: { type: 'number' },
                    suggestions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                improvement: { type: 'string' },
                                impact: { type: 'string', enum: ['high', 'medium', 'low'] }
                            },
                            required: ['category', 'improvement', 'impact']
                        }
                    },
                    perceived_seniority: { type: 'string' },
                    suggested_tagline: { type: 'string' }
                },
                required: ['visual_score', 'usability_score', 'content_score', 'overall_score', 'suggestions', 'perceived_seniority']
            }
        })

        if (!aiResult.ok) {
            console.error('[Portfolio] AI Analysis failed:', aiResult.error_message)
            return createResponse(502, { error: 'Analysis failed', details: aiResult.error_message })
        }

        const analysisResults = aiResult.output as PortfolioAnalysis

        // 3. Save to Database
        const supabase = createAdminClient()
        const { data: savedAnalysis, error: dbError } = await supabase
            .from('portfolio_analyses')
            .upsert({
                user_id: userId,
                portfolio_url: portfolioUrl,
                analysis_results: analysisResults,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, portfolio_url' })
            .select()
            .single()

        if (dbError) {
            console.error('[Portfolio] Database error:', dbError)
        }

        return createResponse(200, {
            ok: true,
            data: {
                analysis: savedAnalysis || { portfolio_url: portfolioUrl, analysis_results: analysisResults },
                trace_id: aiResult.trace_id
            }
        })

    } catch (err: any) {
        console.error('[Portfolio] Handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
