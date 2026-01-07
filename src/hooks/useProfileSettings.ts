import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

type ProfileRow = {
  id: string
  full_name: string | null
  preferred_name: string | null
  email: string | null
  avatar_url: string | null
  tier: string | null
  plan_tier: string | null
  theme_preference: string | null
  timezone: string | null
  location: string | null
  layout_density: string | null
  onboarding_completed: boolean | null // Allowing null for read, but will handle strictness
  onboarding_step: number | null // Changed to number
  created_at: string | null
  updated_at: string | null
  auto_apply_active: boolean // Strict boolean
  voice_preset: string | null
  voice_custom_sample: string | null
  voice_formality: number | null
  voice_playfulness: number | null
  voice_conciseness: number | null
  current_role_title: string | null
  notif_high_match: boolean | null
  notif_application_updates: boolean | null
  notif_weekly_digest: boolean | null
  use_data_for_recommendations: boolean | null
  enable_experimental_features: boolean | null
}

export type ThemePreference = 'system' | 'light' | 'dark'
export type LayoutDensity = 'cozy' | 'compact'

export interface ProfileSettings {
  email: string
  fullName: string
  preferredName: string
  location: string
  timezone: string
  currentRoleTitle: string
  themePreference: ThemePreference
  layoutDensity: LayoutDensity
  notifHighMatch: boolean
  notifApplicationUpdates: boolean
  notifWeeklyDigest: boolean
  useDataForRecommendations: boolean
  enableExperimentalFeatures: boolean
}

const normalizeTheme = (value: ProfileRow['theme_preference']): ThemePreference => {
  if (value === 'light' || value === 'dark') return value
  return 'system'
}

const normalizeLayout = (value: ProfileRow['layout_density']): LayoutDensity => {
  if (value === 'compact') return 'compact'
  return 'cozy'
}

const mapRowToSettings = (row: ProfileRow): ProfileSettings => ({
  email: row.email ?? '',
  fullName: row.full_name ?? '',
  preferredName: row.preferred_name ?? '',
  location: row.location ?? '',
  timezone: row.timezone ?? '',
  currentRoleTitle: row.current_role_title ?? '',
  themePreference: normalizeTheme(row.theme_preference),
  layoutDensity: normalizeLayout(row.layout_density),
  notifHighMatch: row.notif_high_match ?? true,
  notifApplicationUpdates: row.notif_application_updates ?? true,
  notifWeeklyDigest: row.notif_weekly_digest ?? true,
  useDataForRecommendations: row.use_data_for_recommendations ?? true,
  enableExperimentalFeatures: row.enable_experimental_features ?? false,
})

const mapSettingsToRow = (settings: ProfileSettings): Partial<ProfileRow> => ({
  full_name: settings.fullName,
  preferred_name: settings.preferredName,
  location: settings.location,
  timezone: settings.timezone,
  current_role_title: settings.currentRoleTitle,
  theme_preference: settings.themePreference,
  layout_density: settings.layoutDensity,
  notif_high_match: settings.notifHighMatch,
  notif_application_updates: settings.notifApplicationUpdates,
  notif_weekly_digest: settings.notifWeeklyDigest,
  use_data_for_recommendations: settings.useDataForRecommendations,
  enable_experimental_features: settings.enableExperimentalFeatures,
})

export interface UseProfileSettingsReturn {
  settings: ProfileSettings | null
  isLoading: boolean
  saving: boolean
  error: string | null
  saveError: string | null
  refresh: () => Promise<void>
  saveSettings: (patch: Partial<ProfileSettings>) => Promise<boolean>
  updateEmail: (email: string) => Promise<{ success: boolean; error?: string }>
}

export function useProfileSettings(): UseProfileSettingsReturn {
  const { user } = useAuth()
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const defaults: ProfileSettings = useMemo(
    () => ({
      email: user?.email ?? '',
      fullName: '',
      preferredName: '',
      location: '',
      timezone: '',
      currentRoleTitle: '',
      themePreference: 'system',
      layoutDensity: 'cozy',
      notifHighMatch: true,
      notifApplicationUpdates: true,
      notifWeeklyDigest: true,
      useDataForRecommendations: true,
      enableExperimentalFeatures: false,
    }),
    []
  )

  const refresh = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)

    const { data, error: supaError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (supaError) {
      console.error('Failed to fetch profile settings', supaError)
      setError('Unable to load settings right now.')
      setSettings(defaults)
      setIsLoading(false)
      return
    }

    setSettings(mapRowToSettings(data as ProfileRow))
    setIsLoading(false)
  }, [user, defaults])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveSettings = useCallback(
    async (patch: Partial<ProfileSettings>) => {
      if (!user) return false
      const next: ProfileSettings = { ...(settings ?? defaults), ...patch }
      setSaving(true)
      setSaveError(null)

      const payload = mapSettingsToRow(next)
      // Filter out null values to match DB schema expectations (undefined ok, null not ok)
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== null)
      )
      const { error: supaError } = await supabase
        .from('profiles')
        .update(cleanPayload)
        .eq('id', user.id)

      if (supaError) {
        console.error('Failed to save profile settings', supaError)
        setSaveError('We could not save your settings. Please try again.')
        setSaving(false)
        return false
      }

      setSettings(next)
      setSaving(false)
      return true
    },
    [user, settings, defaults]
  )

  const updateEmail = useCallback(
    async (email: string) => {
      if (!user) return { success: false, error: 'User not authenticated' }
      setIsUpdatingEmail(true)

      const { error: supaError } = await supabase.auth.updateUser({ email })

      if (supaError) {
        console.error('Failed to update email', supaError)
        setIsUpdatingEmail(false)
        return { success: false, error: supaError.message }
      }

      setIsUpdatingEmail(false)
      return { success: true }
    },
    [user]
  )

  return {
    settings,
    isLoading,
    saving: saving || isUpdatingEmail,
    error,
    saveError,
    refresh,
    saveSettings,
    updateEmail,
  }
}
