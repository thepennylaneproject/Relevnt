/**
 * useHelperSettingsSummary
 * 
 * Aggregates settings from multiple hooks to produce a unified SettingsSummary
 * for AI helper operations.
 */

import { useMemo } from 'react'
import { usePersonas } from './usePersonas'
import { useJobPreferences } from './useJobPreferences'
import { useProfessionalProfile } from './useProfessionalProfile'
import { useProfileSettings } from './useProfileSettings'
import type { SettingsSummary, MissingSettingKey, RemotePreference } from '../types/helper'

interface UseHelperSettingsSummaryReturn {
  /** The computed settings summary, null while loading */
  summary: SettingsSummary | null
  /** True while any source is loading */
  loading: boolean
}

export function useHelperSettingsSummary(): UseHelperSettingsSummaryReturn {
  const { activePersona, loading: personaLoading } = usePersonas()
  const { prefs, loading: prefsLoading } = useJobPreferences()
  const { profile, loading: profileLoading } = useProfessionalProfile()
  const { settings, isLoading: settingsLoading } = useProfileSettings()

  const loading = personaLoading || prefsLoading || profileLoading || settingsLoading

  const summary = useMemo((): SettingsSummary | null => {
    if (loading) {
      return null
    }

    // Compute missing array using exact keys
    const missing: MissingSettingKey[] = []
    if (activePersona === null) {
      missing.push('persona')
    }
    if (!prefs?.seniority_levels || prefs.seniority_levels.length === 0) {
      missing.push('seniority_levels')
    }
    if (!prefs?.remote_preference) {
      missing.push('remote_preference')
    }

    const settings_configured = missing.length === 0

    return {
      settings_configured,
      missing,
      persona: {
        id: activePersona?.id ?? null,
        title: activePersona?.name ?? null,
      },
      hard_constraints: {
        seniority_levels: prefs?.seniority_levels ?? [],
        remote_preference: (prefs?.remote_preference as RemotePreference) || null,
        min_salary: prefs?.min_salary ?? null,
        needs_sponsorship: profile?.needs_sponsorship ?? null,
      },
      soft_preferences: {
        skill_emphasis: prefs?.include_keywords ?? [],
        relocation: profile?.relocate_preference ?? null,
        travel: profile?.travel_preference ?? null,
      },
      operational: {
        automation_enabled: prefs?.enable_auto_apply ?? false,
        auto_apply_max_apps_per_day: prefs?.auto_apply_max_apps_per_day ?? null,
        notifications: {
          high_match: settings?.notifHighMatch ?? true,
          application_updates: settings?.notifApplicationUpdates ?? true,
          weekly_digest: settings?.notifWeeklyDigest ?? true,
        },
      },
    }
  }, [activePersona, prefs, profile, settings, loading])

  return { summary, loading }
}
