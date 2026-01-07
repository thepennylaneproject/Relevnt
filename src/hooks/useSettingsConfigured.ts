/**
 * useSettingsConfigured - Completion state logic for AI helper
 * 
 * Returns settings_configured = true when minimum viable configuration is met:
 * - active_persona_id !== null
 * - seniority_levels.length > 0
 * - remote_preference !== null/empty
 * 
 * This hook is the source of truth for whether settings are stable enough
 * for the helper to operate without prompting for clarification.
 */

import { useMemo } from 'react'
import { usePersonas } from './usePersonas'
import { useJobPreferences } from './useJobPreferences'

export interface SettingsConfigurationStatus {
    /** True when minimum viable configuration is complete */
    settings_configured: boolean
    /** Breakdown of what's missing, if any */
    missing: {
        persona: boolean
        seniority: boolean
        remote: boolean
    }
    /** Loading state - do not make decisions while true */
    loading: boolean
}

export function useSettingsConfigured(): SettingsConfigurationStatus {
    const { activePersona, loading: personaLoading } = usePersonas()
    const { prefs, loading: prefsLoading } = useJobPreferences()

    const loading = personaLoading || prefsLoading

    const status = useMemo((): SettingsConfigurationStatus => {
        if (loading) {
            return {
                settings_configured: false,
                missing: { persona: true, seniority: true, remote: true },
                loading: true,
            }
        }

        const hasPersona = activePersona !== null
        const hasSeniority = (prefs?.seniority_levels?.length ?? 0) > 0
        const hasRemote = !!(prefs?.remote_preference)

        return {
            settings_configured: hasPersona && hasSeniority && hasRemote,
            missing: {
                persona: !hasPersona,
                seniority: !hasSeniority,
                remote: !hasRemote,
            },
            loading: false,
        }
    }, [activePersona, prefs, loading])

    return status
}
