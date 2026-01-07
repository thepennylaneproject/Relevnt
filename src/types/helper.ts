/**
 * Helper Settings Summary
 * 
 * Provides structured settings data for AI helper operations.
 * Used to gate helper activation and pass constraints to application_helper.
 */

/**
 * Missing settings keys - use these exact strings everywhere:
 * - "persona" - no active persona selected
 * - "seniority_levels" - no seniority levels selected
 * - "remote_preference" - no remote preference set
 */
export type MissingSettingKey = 'persona' | 'seniority_levels' | 'remote_preference'

/**
 * Human-readable labels for missing settings
 */
export const MISSING_SETTING_LABELS: Record<MissingSettingKey, string> = {
  persona: 'Active persona',
  seniority_levels: 'Seniority',
  remote_preference: 'Remote preference',
}

/**
 * Valid remote preference values.
 * Matches UI button IDs in JobSearchSection.
 */
export type RemotePreference = 'remote' | 'hybrid' | 'onsite'

export interface SettingsSummary {
  /** True when minimum viable configuration is complete */
  settings_configured: boolean

  /** List of missing required config keys */
  missing: MissingSettingKey[]

  /** Active persona info */
  persona: {
    id: string | null
    title: string | null
  }

  /**
   * Hard constraints that must be obeyed by the helper.
   * 
   * needs_sponsorship semantics:
   * - true: exclude non-sponsoring roles (hard constraint)
   * - false: do not filter by sponsorship
   * - null: unknown, do not filter, do not claim certainty
   */
  hard_constraints: {
    seniority_levels: string[]
    remote_preference: RemotePreference | null
    min_salary: number | null
    needs_sponsorship: boolean | null
  }

  /** Soft preferences that may be bent with explicit note */
  soft_preferences: {
    skill_emphasis: string[]
    relocation: string | null
    travel: string | null
  }

  /** Operational settings */
  operational: {
    automation_enabled: boolean
    auto_apply_max_apps_per_day: number | null
    notifications: {
      high_match: boolean
      application_updates: boolean
      weekly_digest: boolean
    }
  }
}

/**
 * Response shape when settings are incomplete.
 * Client can render `message` directly if desired.
 */
export interface IncompleteSettingsResponse {
  ok: false
  incomplete_settings: true
  missing: MissingSettingKey[]
  message: string
}
