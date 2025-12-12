/**
 * =============================================================================
 * usePersonas Hook
 * =============================================================================
 * 
 * React hook for managing user personas and their preferences.
 * 
 * Features:
 * - Fetch all personas for the current user
 * - CRUD operations (create, update, delete)
 * - Set active persona
 * - Loading and error state handling
 * - Automatic refetch on auth changes
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { productEvents } from '../services/analytics.service'
import type {
    UserPersona,
    CreatePersonaInput,
    UpdatePersonaInput,
    ListPersonasResponse,
    PersonaResponse,
} from '../types/v2-personas'

// =============================================================================
// TYPES
// =============================================================================

export interface UsePersonasReturn {
    /** All personas for the current user */
    personas: UserPersona[]

    /** Currently active persona (convenience accessor) */
    activePersona: UserPersona | null

    /** Loading state */
    loading: boolean

    /** Error message if any */
    error: string | null

    /** Refetch personas from server */
    refetch: () => Promise<void>

    /** Create a new persona */
    createPersona: (data: CreatePersonaInput) => Promise<UserPersona>

    /** Update an existing persona */
    updatePersona: (id: string, data: UpdatePersonaInput) => Promise<void>

    /** Delete a persona */
    deletePersona: (id: string) => Promise<void>

    /** Set a persona as active */
    setActivePersona: (id: string) => Promise<void>
}

// =============================================================================
// HELPER - GET AUTH TOKEN
// =============================================================================

async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
}

// =============================================================================
// HELPER - MAKE API REQUEST
// =============================================================================

async function apiRequest<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown
): Promise<T> {
    const token = await getAccessToken()

    if (!token) {
        throw new Error('Not authenticated')
    }

    const response = await fetch(`/.netlify/functions${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'API request failed')
    }

    return data
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function usePersonas(): UsePersonasReturn {
    const { user } = useAuth()
    const userId = user?.id

    const [personas, setPersonas] = useState<UserPersona[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ---------------------------------------------------------------------------
    // FETCH PERSONAS
    // ---------------------------------------------------------------------------

    const fetchPersonas = useCallback(async () => {
        if (!userId) {
            setPersonas([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await apiRequest<ListPersonasResponse>('GET', '/personas')
            setPersonas(response.data || [])
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch personas'
            console.error('Error fetching personas:', err)
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    // Fetch on mount and when user changes
    useEffect(() => {
        fetchPersonas()
    }, [fetchPersonas])

    // ---------------------------------------------------------------------------
    // ACTIVE PERSONA (DERIVED)
    // ---------------------------------------------------------------------------

    const activePersona = useMemo(() => {
        return personas.find(p => p.is_active) || null
    }, [personas])

    // ---------------------------------------------------------------------------
    // CREATE PERSONA
    // ---------------------------------------------------------------------------

    const createPersona = useCallback(async (data: CreatePersonaInput): Promise<UserPersona> => {
        if (!userId) {
            throw new Error('Not authenticated')
        }

        try {
            setError(null)

            const response = await apiRequest<PersonaResponse>('POST', '/personas', data)
            const newPersona = response.data!

            // Update local state
            setPersonas(prev => {
                // If new persona is active, deactivate others in local state
                if (newPersona.is_active) {
                    return [newPersona, ...prev.map(p => ({ ...p, is_active: false }))]
                }
                return [newPersona, ...prev]
            })

            return newPersona
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create persona'
            console.error('Error creating persona:', err)
            setError(message)
            throw err
        }
    }, [userId])

    // ---------------------------------------------------------------------------
    // UPDATE PERSONA
    // ---------------------------------------------------------------------------

    const updatePersona = useCallback(async (id: string, data: UpdatePersonaInput): Promise<void> => {
        if (!userId) {
            throw new Error('Not authenticated')
        }

        try {
            setError(null)

            const response = await apiRequest<PersonaResponse>('PATCH', `/personas?id=${id}`, data)
            const updatedPersona = response.data!

            // Update local state
            setPersonas(prev => {
                return prev.map(p => {
                    if (p.id === id) {
                        return updatedPersona
                    }
                    // If updated persona became active, deactivate others
                    if (updatedPersona.is_active && p.is_active) {
                        return { ...p, is_active: false }
                    }
                    return p
                })
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update persona'
            console.error('Error updating persona:', err)
            setError(message)
            throw err
        }
    }, [userId])

    // ---------------------------------------------------------------------------
    // DELETE PERSONA
    // ---------------------------------------------------------------------------

    const deletePersona = useCallback(async (id: string): Promise<void> => {
        if (!userId) {
            throw new Error('Not authenticated')
        }

        try {
            setError(null)

            await apiRequest('DELETE', `/personas?id=${id}`)

            // Optimistic update - remove from local state
            const deletedPersona = personas.find(p => p.id === id)
            setPersonas(prev => prev.filter(p => p.id !== id))

            // If deleted persona was active, refetch to get the new active one
            if (deletedPersona?.is_active) {
                await fetchPersonas()
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete persona'
            console.error('Error deleting persona:', err)
            setError(message)
            // Refetch to restore state on error
            await fetchPersonas()
            throw err
        }
    }, [userId, personas, fetchPersonas])

    // ---------------------------------------------------------------------------
    // SET ACTIVE PERSONA
    // ---------------------------------------------------------------------------

    const setActivePersona = useCallback(async (id: string): Promise<void> => {
        if (!userId) {
            throw new Error('Not authenticated')
        }

        // Track which persona we're switching from
        const previousActivePersona = personas.find(p => p.is_active)
        const targetPersona = personas.find(p => p.id === id)

        // Optimistic update
        setPersonas(prev => prev.map(p => ({
            ...p,
            is_active: p.id === id,
        })))

        try {
            setError(null)

            await apiRequest('POST', `/personas?id=${id}&action=set-active`)

            // Track analytics event
            if (targetPersona) {
                productEvents.personaSwitched(
                    previousActivePersona?.id || null,
                    targetPersona.id,
                    targetPersona.name
                )
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to set active persona'
            console.error('Error setting active persona:', err)
            setError(message)
            // Refetch to restore state on error
            await fetchPersonas()
            throw err
        }
    }, [userId, personas, fetchPersonas])

    // ---------------------------------------------------------------------------
    // RETURN
    // ---------------------------------------------------------------------------

    return {
        personas,
        activePersona,
        loading,
        error,
        refetch: fetchPersonas,
        createPersona,
        updatePersona,
        deletePersona,
        setActivePersona,
    }
}
