/**
 * =============================================================================
 * useRelevanceTuner Hook
 * =============================================================================
 * 
 * React hook for managing relevance tuner weights and presets.
 * 
 * Features:
 * - Fetch all tuner presets for the current user
 * - Maintain in-memory current weights
 * - Set individual weight values
 * - Save/load/delete presets
 * - Reset to default weights
 * 
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import type {
    RelevanceTunerSettings,
    CreateRelevanceTunerInput,
    WeightConfig,
} from '../types/v2-schema'
import { DEFAULT_RELEVANCE_WEIGHTS } from '../types/v2-schema'

// =============================================================================
// TYPES
// =============================================================================

export interface UseRelevanceTunerReturn {
    /** All saved presets for the user */
    presets: RelevanceTunerSettings[]

    /** Currently active weights in memory */
    currentWeights: WeightConfig

    /** Currently selected preset (if any) */
    selectedPreset: RelevanceTunerSettings | null

    /** Loading state */
    loading: boolean

    /** Error message if any */
    error: string | null

    /** Set a single weight value */
    setWeight: (field: keyof WeightConfig, value: number) => void

    /** Reset weights to defaults */
    resetToDefaults: () => void

    /** Save current weights as a new preset */
    savePreset: (name: string, isDefault?: boolean) => Promise<void>

    /** Load a preset into current weights */
    loadPreset: (preset: RelevanceTunerSettings) => void

    /** Delete a preset */
    deletePreset: (id: string) => Promise<void>

    /** Refetch presets from server */
    refetch: () => Promise<void>
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

export function useRelevanceTuner(): UseRelevanceTunerReturn {
    const { user } = useAuth()
    const userId = user?.id

    const [presets, setPresets] = useState<RelevanceTunerSettings[]>([])
    const [currentWeights, setCurrentWeights] = useState<WeightConfig>(DEFAULT_RELEVANCE_WEIGHTS)
    const [selectedPreset, setSelectedPreset] = useState<RelevanceTunerSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ---------------------------------------------------------------------------
    // FETCH PRESETS
    // ---------------------------------------------------------------------------

    const fetchPresets = useCallback(async () => {
        if (!userId) {
            setPresets([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await apiRequest<{
                success: boolean
                data: RelevanceTunerSettings[]
            }>('GET', '/tuner-settings')

            const fetchedPresets = response.data || []
            setPresets(fetchedPresets)

            // Load default preset into current weights if it exists
            const defaultPreset = fetchedPresets.find(p => p.is_default)
            if (defaultPreset) {
                setCurrentWeights({
                    skill_weight: defaultPreset.skill_weight,
                    salary_weight: defaultPreset.salary_weight,
                    location_weight: defaultPreset.location_weight,
                    remote_weight: defaultPreset.remote_weight,
                    industry_weight: defaultPreset.industry_weight,
                })
                setSelectedPreset(defaultPreset)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch presets'
            console.error('Error fetching tuner presets:', err)
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    // Fetch on mount and when user changes
    useEffect(() => {
        fetchPresets()
    }, [fetchPresets])

    // ---------------------------------------------------------------------------
    // SET WEIGHT
    // ---------------------------------------------------------------------------

    const setWeight = useCallback((field: keyof WeightConfig, value: number) => {
        setCurrentWeights(prev => ({
            ...prev,
            [field]: value,
        }))
        // Clear selected preset since weights are now custom
        setSelectedPreset(null)
    }, [])

    // ---------------------------------------------------------------------------
    // RESET TO DEFAULTS
    // ---------------------------------------------------------------------------

    const resetToDefaults = useCallback(() => {
        setCurrentWeights(DEFAULT_RELEVANCE_WEIGHTS)
        setSelectedPreset(null)
    }, [])

    // ---------------------------------------------------------------------------
    // SAVE PRESET
    // ---------------------------------------------------------------------------

    const savePreset = useCallback(async (name: string, isDefault: boolean = false) => {
        if (!userId) {
            throw new Error('Not authenticated')
        }

        try {
            setError(null)

            const input: CreateRelevanceTunerInput = {
                name,
                skill_weight: currentWeights.skill_weight,
                salary_weight: currentWeights.salary_weight,
                location_weight: currentWeights.location_weight,
                remote_weight: currentWeights.remote_weight,
                industry_weight: currentWeights.industry_weight,
                is_default: isDefault,
            }

            const response = await apiRequest<{
                success: boolean
                data: RelevanceTunerSettings
            }>('POST', '/tuner-settings', input)

            const newPreset = response.data

            // Update local state
            setPresets(prev => [newPreset, ...prev])
            setSelectedPreset(newPreset)

            // If this is now default, update other presets
            if (newPreset.is_default) {
                setPresets(prev => prev.map(p =>
                    p.id === newPreset.id ? p : { ...p, is_default: false }
                ))
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save preset'
            console.error('Error saving preset:', err)
            setError(message)
            throw err
        }
    }, [userId, currentWeights])

    // ---------------------------------------------------------------------------
    // LOAD PRESET
    // ---------------------------------------------------------------------------

    const loadPreset = useCallback((preset: RelevanceTunerSettings) => {
        setCurrentWeights({
            skill_weight: preset.skill_weight,
            salary_weight: preset.salary_weight,
            location_weight: preset.location_weight,
            remote_weight: preset.remote_weight,
            industry_weight: preset.industry_weight,
        })
        setSelectedPreset(preset)
    }, [])

    // ---------------------------------------------------------------------------
    // DELETE PRESET
    // ---------------------------------------------------------------------------

    const deletePreset = useCallback(async (id: string) => {
        if (!userId) {
            throw new Error('Not authenticated')
        }

        try {
            setError(null)

            await apiRequest('DELETE', `/tuner-settings?id=${id}`)

            // Optimistic update - remove from local state
            const deletedPreset = presets.find(p => p.id === id)
            setPresets(prev => prev.filter(p => p.id !== id))

            // If we deleted the selected preset, clear selection
            if (selectedPreset?.id === id) {
                setSelectedPreset(null)
                // If deleted was default, reset to hardcoded defaults
                if (deletedPreset?.is_default) {
                    setCurrentWeights(DEFAULT_RELEVANCE_WEIGHTS)
                }
            }

            // Refetch to get updated default if needed
            await fetchPresets()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete preset'
            console.error('Error deleting preset:', err)
            setError(message)
            // Refetch to restore state on error
            await fetchPresets()
            throw err
        }
    }, [userId, presets, selectedPreset, fetchPresets])

    // ---------------------------------------------------------------------------
    // RETURN
    // ---------------------------------------------------------------------------

    return {
        presets,
        currentWeights,
        selectedPreset,
        loading,
        error,
        setWeight,
        resetToDefaults,
        savePreset,
        loadPreset,
        deletePreset,
        refetch: fetchPresets,
    }
}
