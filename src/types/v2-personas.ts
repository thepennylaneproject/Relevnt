/**
 * =============================================================================
 * MULTI-PERSONA SYSTEM TYPES (v2)
 * =============================================================================
 * Type definitions for user personas and their job search preferences.
 * 
 * These types correspond to the database tables:
 * - user_personas
 * - persona_preferences
 * =============================================================================
 */

// =============================================================================
// PERSONA PREFERENCES
// =============================================================================

/**
 * Remote work preference options
 */
export type RemotePreference = 'remote' | 'hybrid' | 'onsite' | 'any'

/**
 * Job search preferences for a persona
 * 
 * Stored in the persona_preferences table, linked 1:1 with user_personas.
 */
export interface PersonaPreferences {
    /** Database ID (optional for create operations) */
    id?: string

    /** Parent persona ID (optional for create operations) */
    persona_id?: string

    /** Keywords for job title matching */
    job_title_keywords: string[]

    /** Minimum acceptable salary */
    min_salary?: number | null

    /** Maximum salary expectation */
    max_salary?: number | null

    /** Skills that are required for job matches */
    required_skills: string[]

    /** Skills that are nice to have but not required */
    nice_to_have_skills: string[]

    /** Remote work preference */
    remote_preference?: RemotePreference | null

    /** Preferred job locations */
    locations: string[]

    /** Preferred industries */
    industries: string[]

    /** Preferred company sizes (e.g., 'startup', 'mid-size', 'enterprise') */
    company_size: string[]

    /** Companies to exclude from matches */
    excluded_companies?: string[]

    /** Company mission/values that resonate */
    mission_values?: string[]

    /** Growth focus areas (e.g., 'leadership', 'technical depth') */
    growth_focus?: string[]

    /** Creation timestamp */
    created_at?: string

    /** Last update timestamp */
    updated_at?: string
}

// =============================================================================
// USER PERSONA
// =============================================================================

/**
 * A user's job search persona
 * 
 * Users can have multiple personas with different names and preferences.
 * Only one persona can be active at a time.
 */
export interface UserPersona {
    /** Unique persona ID */
    id: string

    /** Owner user ID */
    user_id: string

    /** Display name for the persona */
    name: string

    /** Optional description of this persona's purpose */
    description: string | null

    /** Whether this is the currently active persona */
    is_active: boolean

    /** Associated resume ID (optional) */
    resume_id?: string | null

    /** Creation timestamp */
    created_at: string

    /** Last update timestamp */
    updated_at: string

    /** Associated preferences (joined from persona_preferences table) */
    preferences?: PersonaPreferences | null
}

// =============================================================================
// API INPUT TYPES
// =============================================================================

/**
 * Input for creating a new persona
 */
export interface CreatePersonaInput {
    /** Display name (required, must be unique per user) */
    name: string

    /** Optional description */
    description?: string | null

    /** Whether to set as active immediately */
    is_active?: boolean

    /** Associated resume ID (optional) */
    resume_id?: string | null

    /** Optional initial preferences */
    preferences?: Omit<PersonaPreferences, 'id' | 'persona_id' | 'created_at' | 'updated_at'>
}

/**
 * Input for updating an existing persona
 */
export interface UpdatePersonaInput {
    /** Updated display name */
    name?: string

    /** Updated description */
    description?: string | null

    /** Updated active status */
    is_active?: boolean

    /** Updated resume ID */
    resume_id?: string | null

    /** Updated preferences (partial update supported) */
    preferences?: Partial<Omit<PersonaPreferences, 'id' | 'persona_id' | 'created_at' | 'updated_at'>>
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper for persona operations
 */
export interface PersonaApiResponse<T = unknown> {
    /** Whether the operation succeeded */
    success: boolean

    /** Response data (on success) */
    data?: T

    /** Error message (on failure) */
    error?: string

    /** Additional error details */
    message?: string
}

/**
 * Response for listing personas
 */
export interface ListPersonasResponse extends PersonaApiResponse<UserPersona[]> {
    /** Total count of personas */
    count?: number
}

/**
 * Response for single persona operations
 */
export interface PersonaResponse extends PersonaApiResponse<UserPersona> { }

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default preferences for new personas
 */
export const DEFAULT_PERSONA_PREFERENCES: Omit<PersonaPreferences, 'id' | 'persona_id' | 'created_at' | 'updated_at'> = {
    job_title_keywords: [],
    min_salary: null,
    max_salary: null,
    required_skills: [],
    nice_to_have_skills: [],
    remote_preference: 'any',
    locations: [],
    industries: [],
    company_size: [],
    excluded_companies: [],
    mission_values: [],
    growth_focus: [],
}
