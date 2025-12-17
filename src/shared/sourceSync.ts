/**
 * sourceSync.ts - Synchronization utilities for job sources
 *
 * Ensures consistency between:
 * - Code configuration (sourceConfig.ts) - source of truth
 * - Database (job_sources table) - runtime configuration
 * - Admin console - user-facing management
 */

import { SOURCE_CONFIGS, type SourceConfig } from './sourceConfig'
import { ALL_SOURCES, type JobSource } from './jobSources'

/**
 * Represents a source with both code and database configurations
 */
export interface SourceSyncStatus {
  slug: string
  displayName: string
  codeConfig: SourceConfig
  dbConfig: Partial<SourceConfig> | null
  isInSync: boolean
  issues: string[]
}

/**
 * Get all sources with their sync status
 */
export function getAllSourcesSyncStatus(): SourceSyncStatus[] {
  const statuses: SourceSyncStatus[] = []

  // Get all sources from code
  const codeSourceSlugs = Object.keys(SOURCE_CONFIGS)

  codeSourceSlugs.forEach(slug => {
    const codeConfig = SOURCE_CONFIGS[slug]
    const jobSource = ALL_SOURCES.find(s => s.slug === slug)

    const status: SourceSyncStatus = {
      slug,
      displayName: jobSource?.displayName || slug,
      codeConfig,
      dbConfig: null, // Will be populated from DB query
      isInSync: true,
      issues: [],
    }

    // Check for issues
    if (!jobSource) {
      status.issues.push('Defined in sourceConfig.ts but not in jobSources.ts')
    }

    statuses.push(status)
  })

  return statuses
}

/**
 * Compare code configuration with database configuration
 * Returns sources that are out of sync
 */
export function identifyOutOfSyncSources(
  dbSources: Array<{ slug: string; enabled: boolean; trust_level?: string | null; max_age_days?: number | null }>
): SourceSyncStatus[] {
  const allStatuses = getAllSourcesSyncStatus()
  const outOfSync: SourceSyncStatus[] = []

  allStatuses.forEach(status => {
    const dbSource = dbSources.find(s => s.slug === status.slug)

    if (!dbSource) {
      status.issues.push('In code but NOT in database - must be created in admin console')
      status.isInSync = false
      outOfSync.push(status)
      return
    }

    status.dbConfig = {
      slug: dbSource.slug,
      enabled: dbSource.enabled,
      trustLevel: dbSource.trust_level as 'high' | 'medium' | 'low' | undefined,
      maxAgeDays: dbSource.max_age_days || undefined,
    }

    // Check enabled status
    if (status.codeConfig.enabled !== dbSource.enabled) {
      status.issues.push(
        `Enabled status mismatch: code=${status.codeConfig.enabled}, db=${dbSource.enabled}`
      )
      status.isInSync = false
    }

    // Check trust level
    if (status.codeConfig.trustLevel !== dbSource.trust_level) {
      status.issues.push(
        `Trust level mismatch: code=${status.codeConfig.trustLevel}, db=${dbSource.trust_level}`
      )
      status.isInSync = false
    }

    if (!status.isInSync) {
      outOfSync.push(status)
    }
  })

  return outOfSync
}

/**
 * Check if a source is enabled in both code and database
 */
export function isSourceFullyEnabled(
  slug: string,
  dbSource?: { enabled: boolean }
): boolean {
  const codeConfig = SOURCE_CONFIGS[slug]
  if (!codeConfig) return false

  if (!codeConfig.enabled) return false
  if (dbSource && !dbSource.enabled) return false

  return true
}

/**
 * Get the effective configuration for a source
 * (Code config takes precedence as source of truth)
 */
export function getEffectiveSourceConfig(slug: string): SourceConfig | null {
  return SOURCE_CONFIGS[slug] || null
}

/**
 * Get all enabled sources (from code configuration)
 */
export function getEnabledSourceSlugsFromCode(): string[] {
  return Object.values(SOURCE_CONFIGS)
    .filter(config => config.enabled)
    .map(config => config.slug)
}

/**
 * Get all sources (both enabled and disabled)
 */
export function getAllSourceSlugs(): string[] {
  return Object.keys(SOURCE_CONFIGS)
}

/**
 * Get sources that are disabled and why
 */
export function getDisabledSources(): Array<{ slug: string; reason: string }> {
  return Object.entries(SOURCE_CONFIGS)
    .filter(([_, config]) => !config.enabled)
    .map(([slug, config]) => ({
      slug,
      reason: config.notes || 'No reason specified',
    }))
}

/**
 * Get sources that are new (in code but might not be in database)
 */
export function getNewSourceSlugs(dbSlugs: string[]): string[] {
  const codeSlugs = Object.keys(SOURCE_CONFIGS)
  return codeSlugs.filter(slug => !dbSlugs.includes(slug))
}

/**
 * Get sources that might be obsolete (in database but not in code)
 */
export function getObsoleteSources(dbSlugs: string[]): string[] {
  const codeSlugs = Object.keys(SOURCE_CONFIGS)
  return dbSlugs.filter(slug => !codeSlugs.includes(slug))
}

/**
 * Validate source configuration
 */
export function validateSourceConfig(slug: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = SOURCE_CONFIGS[slug]

  if (!config) {
    errors.push(`Source '${slug}' not found in sourceConfig.ts`)
    return { valid: false, errors }
  }

  // Check required fields
  if (!config.slug) errors.push('Missing slug')
  if (!config.mode) errors.push('Missing mode')
  if (config.trustLevel === undefined) errors.push('Missing trustLevel')
  if (config.maxAgeDays === undefined) errors.push('Missing maxAgeDays')
  if (config.maxPagesPerRun === undefined) errors.push('Missing maxPagesPerRun')

  // Check valid values
  const validModes = ['fresh-only', 'shallow-curated', 'wide-capped']
  if (!validModes.includes(config.mode)) {
    errors.push(`Invalid mode: ${config.mode}`)
  }

  const validTrustLevels = ['high', 'medium', 'low']
  if (!validTrustLevels.includes(config.trustLevel)) {
    errors.push(`Invalid trustLevel: ${config.trustLevel}`)
  }

  if (config.maxAgeDays < 1 || config.maxAgeDays > 365) {
    errors.push(`maxAgeDays out of range: ${config.maxAgeDays} (should be 1-365)`)
  }

  if (config.maxPagesPerRun < 1) {
    errors.push(`maxPagesPerRun must be >= 1: ${config.maxPagesPerRun}`)
  }

  if (config.cooldownMinutes !== undefined && config.cooldownMinutes < 0) {
    errors.push(`cooldownMinutes cannot be negative: ${config.cooldownMinutes}`)
  }

  // Check if source exists in jobSources
  const sourceExists = ALL_SOURCES.some(s => s.slug === slug)
  if (!sourceExists && config.enabled) {
    errors.push(`Source not found in jobSources.ts - cannot enable`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get a summary report of all sources
 */
export function generateSourceReport(): {
  total: number
  enabled: number
  disabled: number
  inDatabase: number
  missingFromDatabase: number
  issues: Array<{ slug: string; severity: 'error' | 'warning'; message: string }>
} {
  const codeSlugs = Object.keys(SOURCE_CONFIGS)
  const enabledCount = Object.values(SOURCE_CONFIGS).filter(c => c.enabled).length

  const issues: Array<{ slug: string; severity: 'error' | 'warning'; message: string }> = []

  codeSlugs.forEach(slug => {
    const validation = validateSourceConfig(slug)
    if (!validation.valid) {
      validation.errors.forEach(error => {
        issues.push({
          slug,
          severity: 'error',
          message: error,
        })
      })
    }
  })

  return {
    total: codeSlugs.length,
    enabled: enabledCount,
    disabled: codeSlugs.length - enabledCount,
    inDatabase: 0, // Will be populated from actual DB query
    missingFromDatabase: 0, // Will be populated from actual DB query
    issues,
  }
}

/**
 * Export configuration as JSON for documentation/review
 */
export function exportSourceConfigAsJSON(slug?: string): Record<string, SourceConfig> {
  if (slug) {
    const config = SOURCE_CONFIGS[slug]
    return config ? { [slug]: config } : {}
  }
  return SOURCE_CONFIGS
}
