/**
 * =============================================================================
 * TUNER SETTINGS API ENDPOINT
 * =============================================================================
 * 
 * Endpoint: /.netlify/functions/tuner-settings
 * Methods: GET, POST, PATCH, DELETE
 * Auth: Required (JWT token)
 * 
 * Routes:
 * - GET    /tuner-settings?persona_id=<uuid>  Get settings for a persona
 * - GET    /tuner-settings?id=<uuid>          Get specific setting by ID
 * - GET    /tuner-settings                    List all user's settings
 * - POST   /tuner-settings                    Create new tuner configuration
 * - PATCH  /tuner-settings?id=<uuid>          Update configuration
 * - DELETE /tuner-settings?id=<uuid>          Delete configuration
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
import type {
    RelevanceTunerSettings,
    CreateRelevanceTunerInput,
    UpdateRelevanceTunerInput,
} from '../../src/types/v2-schema'

// =============================================================================
// MAIN HANDLER
// =============================================================================

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
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
    const settingId = params.id
    const personaId = params.persona_id

    try {
        switch (event.httpMethod) {
            case 'GET':
                if (settingId) {
                    return await handleGetSetting(token, userId, settingId)
                }
                if (personaId) {
                    return await handleGetSettingsByPersona(token, userId, personaId)
                }
                return await handleListSettings(token, userId)

            case 'POST':
                return await handleCreateSetting(token, userId, event.body)

            case 'PATCH':
                if (!settingId) {
                    return createResponse(400, {
                        success: false,
                        error: 'Missing setting ID',
                        message: 'Provide ?id=<uuid> to update a setting',
                    })
                }
                return await handleUpdateSetting(token, userId, settingId, event.body)

            case 'DELETE':
                if (!settingId) {
                    return createResponse(400, {
                        success: false,
                        error: 'Missing setting ID',
                        message: 'Provide ?id=<uuid> to delete a setting',
                    })
                }
                return await handleDeleteSetting(token, userId, settingId)

            default:
                return createResponse(405, {
                    success: false,
                    error: 'Method not allowed',
                    message: `${event.httpMethod} is not supported`,
                })
        }
    } catch (err: any) {
        console.error('Tuner Settings API error:', err)
        return createResponse(500, {
            success: false,
            error: 'Internal server error',
            message: err?.message || String(err),
        })
    }
}

// =============================================================================
// GET - LIST ALL SETTINGS
// =============================================================================

async function handleListSettings(
    token: string,
    userId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    const { data: settings, error } = await supabase
        .from('relevance_tuner_settings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching tuner settings:', error)
        return createResponse(500, {
            success: false,
            error: 'Failed to fetch settings',
            message: error.message,
        })
    }

    return createResponse(200, {
        success: true,
        data: settings || [],
        count: settings?.length || 0,
    })
}

// =============================================================================
// GET - SINGLE SETTING BY ID
// =============================================================================

async function handleGetSetting(
    token: string,
    userId: string,
    settingId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    const { data: setting, error } = await supabase
        .from('relevance_tuner_settings')
        .select('*')
        .eq('id', settingId)
        .eq('user_id', userId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return createResponse(404, {
                success: false,
                error: 'Setting not found',
                message: `No setting found with ID: ${settingId}`,
            })
        }
        console.error('Error fetching setting:', error)
        return createResponse(500, {
            success: false,
            error: 'Failed to fetch setting',
            message: error.message,
        })
    }

    return createResponse(200, {
        success: true,
        data: setting,
    })
}

// =============================================================================
// GET - SETTINGS BY PERSONA
// =============================================================================

async function handleGetSettingsByPersona(
    token: string,
    userId: string,
    personaId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    // First verify the persona belongs to the user
    const { data: persona, error: personaError } = await supabase
        .from('user_personas')
        .select('id')
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

    // Get settings - for now, return user's default settings
    // In future, could support persona-specific settings
    const { data: settings, error } = await supabase
        .from('relevance_tuner_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle()

    if (error) {
        console.error('Error fetching settings for persona:', error)
        return createResponse(500, {
            success: false,
            error: 'Failed to fetch settings',
            message: error.message,
        })
    }

    return createResponse(200, {
        success: true,
        data: settings,
    })
}

// =============================================================================
// POST - CREATE SETTING
// =============================================================================

async function handleCreateSetting(
    token: string,
    userId: string,
    body: string | null
): Promise<HandlerResponse> {
    if (!body) {
        return createResponse(400, {
            success: false,
            error: 'Missing request body',
            message: 'Provide setting data in request body',
        })
    }

    let input: CreateRelevanceTunerInput
    try {
        input = JSON.parse(body)
    } catch {
        return createResponse(400, {
            success: false,
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON',
        })
    }

    // Validate required fields
    if (!input.name || typeof input.name !== 'string' || input.name.trim() === '') {
        return createResponse(400, {
            success: false,
            error: 'Invalid name',
            message: 'Setting name is required and must be a non-empty string',
        })
    }

    // Validate weights (must be between 0 and 1)
    const weights = {
        skill_weight: input.skill_weight ?? 0.3,
        salary_weight: input.salary_weight ?? 0.25,
        location_weight: input.location_weight ?? 0.15,
        remote_weight: input.remote_weight ?? 0.2,
        industry_weight: input.industry_weight ?? 0.1,
    }

    for (const [key, value] of Object.entries(weights)) {
        if (value < 0 || value > 1) {
            return createResponse(400, {
                success: false,
                error: 'Invalid weight',
                message: `${key} must be between 0 and 1`,
            })
        }
    }

    const supabase = createAuthenticatedClient(token)

    // If this should be default, unset other defaults first
    if (input.is_default) {
        await supabase
            .from('relevance_tuner_settings')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('is_default', true)
    }

    // Create the setting
    const { data: setting, error } = await supabase
        .from('relevance_tuner_settings')
        .insert({
            user_id: userId,
            name: input.name.trim(),
            skill_weight: weights.skill_weight,
            salary_weight: weights.salary_weight,
            location_weight: weights.location_weight,
            remote_weight: weights.remote_weight,
            industry_weight: weights.industry_weight,
            is_default: input.is_default || false,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating setting:', error)
        return createResponse(500, {
            success: false,
            error: 'Failed to create setting',
            message: error.message,
        })
    }

    return createResponse(201, {
        success: true,
        data: setting,
    })
}

// =============================================================================
// PATCH - UPDATE SETTING
// =============================================================================

async function handleUpdateSetting(
    token: string,
    userId: string,
    settingId: string,
    body: string | null
): Promise<HandlerResponse> {
    if (!body) {
        return createResponse(400, {
            success: false,
            error: 'Missing request body',
            message: 'Provide update data in request body',
        })
    }

    let input: UpdateRelevanceTunerInput
    try {
        input = JSON.parse(body)
    } catch {
        return createResponse(400, {
            success: false,
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON',
        })
    }

    // Build update object
    const updateData: Record<string, any> = {}

    if (input.name !== undefined) {
        if (typeof input.name !== 'string' || input.name.trim() === '') {
            return createResponse(400, {
                success: false,
                error: 'Invalid name',
                message: 'Setting name must be a non-empty string',
            })
        }
        updateData.name = input.name.trim()
    }

    // Validate and add weight updates
    const weightFields = [
        'skill_weight',
        'salary_weight',
        'location_weight',
        'remote_weight',
        'industry_weight',
    ] as const

    for (const field of weightFields) {
        if (input[field] !== undefined) {
            const value = input[field]!
            if (value < 0 || value > 1) {
                return createResponse(400, {
                    success: false,
                    error: 'Invalid weight',
                    message: `${field} must be between 0 and 1`,
                })
            }
            updateData[field] = value
        }
    }

    if (input.is_default !== undefined) {
        updateData.is_default = input.is_default
    }

    // If no updates, return early
    if (Object.keys(updateData).length === 0) {
        return createResponse(400, {
            success: false,
            error: 'No updates provided',
            message: 'Provide at least one field to update',
        })
    }

    const supabase = createAuthenticatedClient(token)

    // If setting to default, unset other defaults first
    if (input.is_default) {
        await supabase
            .from('relevance_tuner_settings')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('is_default', true)
            .neq('id', settingId)
    }

    // Update the setting
    const { data: setting, error } = await supabase
        .from('relevance_tuner_settings')
        .update(updateData)
        .eq('id', settingId)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        console.error('Error updating setting:', error)
        return createResponse(500, {
            success: false,
            error: 'Failed to update setting',
            message: error.message,
        })
    }

    if (!setting) {
        return createResponse(404, {
            success: false,
            error: 'Setting not found',
            message: `No setting found with ID: ${settingId}`,
        })
    }

    return createResponse(200, {
        success: true,
        data: setting,
    })
}

// =============================================================================
// DELETE - DELETE SETTING
// =============================================================================

async function handleDeleteSetting(
    token: string,
    userId: string,
    settingId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    // Check if setting exists
    const { data: setting, error: fetchError } = await supabase
        .from('relevance_tuner_settings')
        .select('id, is_default')
        .eq('id', settingId)
        .eq('user_id', userId)
        .single()

    if (fetchError || !setting) {
        return createResponse(404, {
            success: false,
            error: 'Setting not found',
            message: `No setting found with ID: ${settingId}`,
        })
    }

    // Delete the setting
    const { error: deleteError } = await supabase
        .from('relevance_tuner_settings')
        .delete()
        .eq('id', settingId)
        .eq('user_id', userId)

    if (deleteError) {
        console.error('Error deleting setting:', deleteError)
        return createResponse(500, {
            success: false,
            error: 'Failed to delete setting',
            message: deleteError.message,
        })
    }

    // If deleted setting was default, set the most recently created one as default
    if (setting.is_default) {
        const { data: remaining } = await supabase
            .from('relevance_tuner_settings')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)

        if (remaining && remaining.length > 0) {
            await supabase
                .from('relevance_tuner_settings')
                .update({ is_default: true })
                .eq('id', remaining[0].id)
        }
    }

    return createResponse(200, {
        success: true,
        data: { deleted: settingId },
    })
}
