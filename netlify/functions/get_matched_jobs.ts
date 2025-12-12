/**
 * =============================================================================
 * GET MATCHED JOBS API ENDPOINT
 * =============================================================================
 * 
 * Endpoint: /.netlify/functions/get_matched_jobs
 * Method: GET
 * Auth: Required (JWT token)
 * 
 * Query Parameters:
 * - persona_id (required): UUID of the persona
 * - min_score (optional): Filter jobs below this score
 * - limit (optional): Max results (default: 50)
 * - offset (optional): Pagination offset (default: 0)
 * 
 * =============================================================================
 */

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'
import {
    createAuthenticatedClient,
    createResponse,
    handleCORS,
    verifyToken,
} from './utils/supabase'
import { matchJobsForPersona } from '../../src/lib/matchJobs'
import { getCachedMatches, setCachedMatches } from '../../src/lib/matchCache'

// =============================================================================
// MAIN HANDLER
// =============================================================================

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return createResponse(405, {
            success: false,
            error: 'Method not allowed',
            message: 'Only GET requests are supported',
        })
    }

    // Verify authentication
    const { userId, error: authError } = await verifyToken(event.headers.authorization)

    if (authError || !userId) {
        return createResponse(401, {
            success: false,
            error: 'Unauthorized',
            message: authError || 'Authentication required',
        })
    }

    // Get the access token for authenticated client
    const token = event.headers.authorization?.replace(/^Bearer\s+/i, '') || ''

    // Parse query parameters
    const params = event.queryStringParameters || {}
    const personaId = params.persona_id
    const minScore = params.min_score ? parseInt(params.min_score, 10) : undefined
    const limit = params.limit ? parseInt(params.limit, 10) : undefined
    const offset = params.offset ? parseInt(params.offset, 10) : undefined

    // Validate required parameters
    if (!personaId) {
        return createResponse(400, {
            success: false,
            error: 'Missing persona_id',
            message: 'Provide ?persona_id=<uuid> to get matched jobs',
        })
    }

    try {
        const supabase = createAuthenticatedClient(token)

        // Check cache first
        const cachedMatches = getCachedMatches(userId, personaId)

        if (cachedMatches !== null) {
            console.log('get_matched_jobs: returning cached results')

            // Apply filters to cached results
            let filteredMatches = cachedMatches

            if (minScore !== undefined) {
                filteredMatches = filteredMatches.filter(m => m.match_score >= minScore)
            }

            if (offset !== undefined || limit !== undefined) {
                const start = offset || 0
                const end = start + (limit || 50)
                filteredMatches = filteredMatches.slice(start, end)
            }

            return createResponse(200, {
                success: true,
                data: {
                    matches: filteredMatches,
                    count: filteredMatches.length,
                    cached: true,
                },
            })
        }

        // Verify persona belongs to user
        const { data: persona, error: personaError } = await supabase
            .from('user_personas')
            .select('id, name, description')
            .eq('id', personaId)
            .eq('user_id', userId)
            .single()

        if (personaError || !persona) {
            return createResponse(404, {
                success: false,
                error: 'Persona not found',
                message: `No persona found with ID: ${personaId}`,
            })
        }

        // Load tuner settings for this user (default setting)
        let weightConfig
        const { data: tunerSettings } = await supabase
            .from('relevance_tuner_settings')
            .select('skill_weight, salary_weight, location_weight, remote_weight, industry_weight')
            .eq('user_id', userId)
            .eq('is_default', true)
            .maybeSingle()

        if (tunerSettings) {
            weightConfig = {
                skill_weight: tunerSettings.skill_weight,
                salary_weight: tunerSettings.salary_weight,
                location_weight: tunerSettings.location_weight,
                remote_weight: tunerSettings.remote_weight,
                industry_weight: tunerSettings.industry_weight,
            }
        }

        // Get matched jobs
        const matches = await matchJobsForPersona(supabase, userId, personaId, {
            minScore,
            limit,
            offset,
            weightConfig,
        })

        // Cache the full result (before pagination)
        setCachedMatches(userId, personaId, matches)

        return createResponse(200, {
            success: true,
            data: {
                matches,
                count: matches.length,
                persona: {
                    id: persona.id,
                    name: persona.name,
                    description: persona.description,
                },
                cached: false,
            },
        })
    } catch (err: any) {
        console.error('get_matched_jobs: error', err)

        // Check for specific error messages
        if (err.message?.includes('not found')) {
            return createResponse(404, {
                success: false,
                error: 'Not found',
                message: err.message,
            })
        }

        return createResponse(500, {
            success: false,
            error: 'Internal server error',
            message: err?.message || String(err),
        })
    }
}
