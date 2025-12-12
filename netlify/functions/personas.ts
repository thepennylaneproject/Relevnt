/**
 * =============================================================================
 * PERSONAS API ENDPOINT
 * =============================================================================
 * 
 * Endpoint: /.netlify/functions/personas
 * Methods: GET, POST, PATCH, DELETE
 * Auth: Required (JWT token)
 * 
 * Routes:
 * - GET    /personas              List all user personas with preferences
 * - POST   /personas              Create new persona with optional preferences
 * - PATCH  /personas?id=<uuid>    Update persona and/or preferences
 * - DELETE /personas?id=<uuid>    Delete persona
 * - POST   /personas?id=<uuid>&action=set-active  Set persona as active
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
    UserPersona,
    PersonaPreferences,
    CreatePersonaInput,
    UpdatePersonaInput,
} from '../../src/types/v2-personas'

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
    const personaId = params.id
    const action = params.action

    try {
        switch (event.httpMethod) {
            case 'GET':
                if (personaId) {
                    return await handleGetPersona(token, userId, personaId)
                }
                return await handleListPersonas(token, userId)

            case 'POST':
                if (personaId && action === 'set-active') {
                    return await handleSetActive(token, userId, personaId)
                }
                return await handleCreatePersona(token, userId, event.body)

            case 'PATCH':
                if (!personaId) {
                    return createResponse(400, {
                        success: false,
                        error: 'Missing persona ID',
                        message: 'Provide ?id=<uuid> to update a persona',
                    })
                }
                return await handleUpdatePersona(token, userId, personaId, event.body)

            case 'DELETE':
                if (!personaId) {
                    return createResponse(400, {
                        success: false,
                        error: 'Missing persona ID',
                        message: 'Provide ?id=<uuid> to delete a persona',
                    })
                }
                return await handleDeletePersona(token, userId, personaId)

            default:
                return createResponse(405, {
                    success: false,
                    error: 'Method not allowed',
                    message: `${event.httpMethod} is not supported`,
                })
        }
    } catch (err: any) {
        console.error('Personas API error:', err)
        return createResponse(500, {
            success: false,
            error: 'Internal server error',
            message: err?.message || String(err),
        })
    }
}

// =============================================================================
// GET - LIST ALL PERSONAS
// =============================================================================

async function handleListPersonas(
    token: string,
    userId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    // Fetch personas with their preferences
    const { data: personas, error } = await supabase
        .from('user_personas')
        .select(`
      *,
      persona_preferences (*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching personas:', error)
        return createResponse(500, {
            success: false,
            error: 'Failed to fetch personas',
            message: error.message,
        })
    }

    // Transform the response to flatten preferences
    const transformedPersonas: UserPersona[] = (personas || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        description: p.description,
        is_active: p.is_active,
        resume_id: p.resume_id || null,
        created_at: p.created_at,
        updated_at: p.updated_at,
        preferences: p.persona_preferences?.[0] || null,
    }))

    return createResponse(200, {
        success: true,
        data: transformedPersonas,
        count: transformedPersonas.length,
    })
}

// =============================================================================
// GET - SINGLE PERSONA
// =============================================================================

async function handleGetPersona(
    token: string,
    userId: string,
    personaId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    const { data: persona, error } = await supabase
        .from('user_personas')
        .select(`
      *,
      persona_preferences (*)
    `)
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return createResponse(404, {
                success: false,
                error: 'Persona not found',
                message: `No persona found with ID: ${personaId}`,
            })
        }
        console.error('Error fetching persona:', error)
        return createResponse(500, {
            success: false,
            error: 'Failed to fetch persona',
            message: error.message,
        })
    }

    const transformedPersona: UserPersona = {
        id: persona.id,
        user_id: persona.user_id,
        name: persona.name,
        description: persona.description,
        is_active: persona.is_active,
        resume_id: persona.resume_id || null,
        created_at: persona.created_at,
        updated_at: persona.updated_at,
        preferences: persona.persona_preferences?.[0] || null,
    }

    return createResponse(200, {
        success: true,
        data: transformedPersona,
    })
}

// =============================================================================
// POST - CREATE PERSONA
// =============================================================================

async function handleCreatePersona(
    token: string,
    userId: string,
    body: string | null
): Promise<HandlerResponse> {
    if (!body) {
        return createResponse(400, {
            success: false,
            error: 'Missing request body',
            message: 'Provide persona data in request body',
        })
    }

    let input: CreatePersonaInput
    try {
        input = JSON.parse(body)
    } catch {
        return createResponse(400, {
            success: false,
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON',
        })
    }

    if (!input.name || typeof input.name !== 'string' || input.name.trim() === '') {
        return createResponse(400, {
            success: false,
            error: 'Invalid name',
            message: 'Persona name is required and must be a non-empty string',
        })
    }

    const supabase = createAuthenticatedClient(token)

    // Validate resume ownership if resume_id is provided
    if (input.resume_id) {
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('id')
            .eq('id', input.resume_id)
            .eq('user_id', userId)
            .single()

        if (resumeError || !resume) {
            return createResponse(400, {
                success: false,
                error: 'Invalid resume',
                message: 'Resume not found or does not belong to user',
            })
        }
    }

    // If this should be active, deactivate others first
    if (input.is_active) {
        await supabase
            .from('user_personas')
            .update({ is_active: false })
            .eq('user_id', userId)
            .eq('is_active', true)
    }

    // Create the persona
    const { data: persona, error: personaError } = await supabase
        .from('user_personas')
        .insert({
            user_id: userId,
            name: input.name.trim(),
            description: input.description || null,
            is_active: input.is_active || false,
            resume_id: input.resume_id || null,
        })
        .select()
        .single()

    if (personaError) {
        if (personaError.code === '23505') {
            return createResponse(409, {
                success: false,
                error: 'Duplicate name',
                message: `A persona with name "${input.name}" already exists`,
            })
        }
        console.error('Error creating persona:', personaError)
        return createResponse(500, {
            success: false,
            error: 'Failed to create persona',
            message: personaError.message,
        })
    }

    // Create preferences if provided
    let preferences: PersonaPreferences | null = null
    if (input.preferences) {
        const { data: prefs, error: prefsError } = await supabase
            .from('persona_preferences')
            .insert({
                persona_id: persona.id,
                job_title_keywords: input.preferences.job_title_keywords || [],
                min_salary: input.preferences.min_salary ?? null,
                max_salary: input.preferences.max_salary ?? null,
                required_skills: input.preferences.required_skills || [],
                nice_to_have_skills: input.preferences.nice_to_have_skills || [],
                remote_preference: input.preferences.remote_preference ?? null,
                locations: input.preferences.locations || [],
                industries: input.preferences.industries || [],
                company_size: input.preferences.company_size || [],
                excluded_companies: input.preferences.excluded_companies || [],
                mission_values: input.preferences.mission_values || [],
                growth_focus: input.preferences.growth_focus || [],
            })
            .select()
            .single()

        if (prefsError) {
            console.error('Error creating preferences:', prefsError)
            // Don't fail the whole operation, just log it
        } else {
            preferences = prefs
        }
    }

    const result: UserPersona = {
        id: persona.id,
        user_id: persona.user_id,
        name: persona.name,
        description: persona.description,
        is_active: persona.is_active,
        resume_id: persona.resume_id || null,
        created_at: persona.created_at,
        updated_at: persona.updated_at,
        preferences,
    }

    return createResponse(201, {
        success: true,
        data: result,
    })
}

// =============================================================================
// PATCH - UPDATE PERSONA
// =============================================================================

async function handleUpdatePersona(
    token: string,
    userId: string,
    personaId: string,
    body: string | null
): Promise<HandlerResponse> {
    if (!body) {
        return createResponse(400, {
            success: false,
            error: 'Missing request body',
            message: 'Provide update data in request body',
        })
    }

    let input: UpdatePersonaInput
    try {
        input = JSON.parse(body)
    } catch {
        return createResponse(400, {
            success: false,
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON',
        })
    }

    const supabase = createAuthenticatedClient(token)

    // Validate resume ownership if resume_id is being updated
    if (input.resume_id !== undefined && input.resume_id !== null) {
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('id')
            .eq('id', input.resume_id)
            .eq('user_id', userId)
            .single()

        if (resumeError || !resume) {
            return createResponse(400, {
                success: false,
                error: 'Invalid resume',
                message: 'Resume not found or does not belong to user',
            })
        }
    }

    // Build persona update object
    const personaUpdate: Record<string, any> = {}
    if (input.name !== undefined) {
        if (typeof input.name !== 'string' || input.name.trim() === '') {
            return createResponse(400, {
                success: false,
                error: 'Invalid name',
                message: 'Persona name must be a non-empty string',
            })
        }
        personaUpdate.name = input.name.trim()
    }
    if (input.description !== undefined) {
        personaUpdate.description = input.description
    }
    if (input.resume_id !== undefined) {
        personaUpdate.resume_id = input.resume_id
    }
    if (input.is_active !== undefined) {
        personaUpdate.is_active = input.is_active

        // If setting to active, deactivate others first
        if (input.is_active) {
            await supabase
                .from('user_personas')
                .update({ is_active: false })
                .eq('user_id', userId)
                .eq('is_active', true)
                .neq('id', personaId)
        }
    }

    // Update persona if there are changes
    if (Object.keys(personaUpdate).length > 0) {
        const { error: updateError } = await supabase
            .from('user_personas')
            .update(personaUpdate)
            .eq('id', personaId)
            .eq('user_id', userId)

        if (updateError) {
            if (updateError.code === '23505') {
                return createResponse(409, {
                    success: false,
                    error: 'Duplicate name',
                    message: `A persona with name "${input.name}" already exists`,
                })
            }
            console.error('Error updating persona:', updateError)
            return createResponse(500, {
                success: false,
                error: 'Failed to update persona',
                message: updateError.message,
            })
        }
    }

    // Update preferences if provided
    if (input.preferences) {
        // Check if preferences exist
        const { data: existingPrefs } = await supabase
            .from('persona_preferences')
            .select('id')
            .eq('persona_id', personaId)
            .single()

        if (existingPrefs) {
            // Update existing preferences
            const { error: prefsError } = await supabase
                .from('persona_preferences')
                .update(input.preferences)
                .eq('persona_id', personaId)

            if (prefsError) {
                console.error('Error updating preferences:', prefsError)
            }
        } else {
            // Create new preferences
            const { error: prefsError } = await supabase
                .from('persona_preferences')
                .insert({
                    persona_id: personaId,
                    job_title_keywords: input.preferences.job_title_keywords || [],
                    min_salary: input.preferences.min_salary ?? null,
                    max_salary: input.preferences.max_salary ?? null,
                    required_skills: input.preferences.required_skills || [],
                    nice_to_have_skills: input.preferences.nice_to_have_skills || [],
                    remote_preference: input.preferences.remote_preference ?? null,
                    locations: input.preferences.locations || [],
                    industries: input.preferences.industries || [],
                    company_size: input.preferences.company_size || [],
                    excluded_companies: input.preferences.excluded_companies || [],
                    mission_values: input.preferences.mission_values || [],
                    growth_focus: input.preferences.growth_focus || [],
                })

            if (prefsError) {
                console.error('Error creating preferences:', prefsError)
            }
        }
    }

    // Fetch and return updated persona
    return handleGetPersona(token, userId, personaId)
}

// =============================================================================
// DELETE - DELETE PERSONA
// =============================================================================

async function handleDeletePersona(
    token: string,
    userId: string,
    personaId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    // First, check if this persona exists and if it's active
    const { data: persona, error: fetchError } = await supabase
        .from('user_personas')
        .select('id, is_active')
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()

    if (fetchError || !persona) {
        return createResponse(404, {
            success: false,
            error: 'Persona not found',
            message: `No persona found with ID: ${personaId}`,
        })
    }

    const wasActive = persona.is_active

    // Delete the persona (preferences will cascade delete)
    const { error: deleteError } = await supabase
        .from('user_personas')
        .delete()
        .eq('id', personaId)
        .eq('user_id', userId)

    if (deleteError) {
        console.error('Error deleting persona:', deleteError)
        return createResponse(500, {
            success: false,
            error: 'Failed to delete persona',
            message: deleteError.message,
        })
    }

    // If deleted persona was active, activate the most recently created one
    if (wasActive) {
        const { data: remaining } = await supabase
            .from('user_personas')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)

        if (remaining && remaining.length > 0) {
            await supabase
                .from('user_personas')
                .update({ is_active: true })
                .eq('id', remaining[0].id)
        }
    }

    return createResponse(200, {
        success: true,
        data: { deleted: personaId },
    })
}

// =============================================================================
// POST - SET ACTIVE PERSONA
// =============================================================================

async function handleSetActive(
    token: string,
    userId: string,
    personaId: string
): Promise<HandlerResponse> {
    const supabase = createAuthenticatedClient(token)

    // Verify persona exists and belongs to user
    const { data: persona, error: fetchError } = await supabase
        .from('user_personas')
        .select('id')
        .eq('id', personaId)
        .eq('user_id', userId)
        .single()

    if (fetchError || !persona) {
        return createResponse(404, {
            success: false,
            error: 'Persona not found',
            message: `No persona found with ID: ${personaId}`,
        })
    }

    // Deactivate all other personas
    await supabase
        .from('user_personas')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)

    // Activate this persona
    const { error: updateError } = await supabase
        .from('user_personas')
        .update({ is_active: true })
        .eq('id', personaId)

    if (updateError) {
        console.error('Error setting active persona:', updateError)
        return createResponse(500, {
            success: false,
            error: 'Failed to set active persona',
            message: updateError.message,
        })
    }

    // Return updated persona
    return handleGetPersona(token, userId, personaId)
}
