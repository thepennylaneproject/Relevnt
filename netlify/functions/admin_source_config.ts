/**
 * admin_source_config.ts - Admin endpoint for source configuration and sync status
 *
 * Returns information about:
 * - Code configuration (SOURCE_CONFIGS)
 * - Database configuration (job_sources table)
 * - Sync status and discrepancies
 * - Configuration validation
 */

import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS } from './utils/supabase'
import { createAdminClient } from './utils/supabase'
import {
  getAllSourcesSyncStatus,
  identifyOutOfSyncSources,
  getDisabledSources,
  getNewSourceSlugs,
  getObsoleteSources,
  validateSourceConfig,
  generateSourceReport,
  exportSourceConfigAsJSON,
} from '../../src/shared/sourceSync'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-admin-secret'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS()
  }

  // Verify admin access
  const adminSecret = event.headers['x-admin-secret'] || ''
  if (adminSecret !== ADMIN_SECRET) {
    return createResponse(403, {
      success: false,
      error: 'Forbidden: Invalid admin secret',
    })
  }

  try {
    const action = event.queryStringParameters?.action || 'status'

    switch (action) {
      case 'status': {
        // Get current database sources
        const supabase = createAdminClient()
        const { data: dbSources, error: dbError } = await supabase
          .from('job_sources')
          .select('slug, enabled, trust_level, max_age_days, max_pages_per_run, mode, auth_mode, update_frequency')

        if (dbError) {
          throw dbError
        }

        // Get sync status
        const allStatuses = getAllSourcesSyncStatus()
        const outOfSync = identifyOutOfSyncSources(dbSources || [])
        const disabledSources = getDisabledSources()
        const newSources = getNewSourceSlugs((dbSources || []).map(s => s.slug))
        const obsoleteSources = getObsoleteSources((dbSources || []).map(s => s.slug))
        const report = generateSourceReport()

        return createResponse(200, {
          success: true,
          data: {
            summary: {
              totalInCode: report.total,
              enabledInCode: report.enabled,
              disabledInCode: report.disabled,
              totalInDatabase: dbSources?.length || 0,
              outOfSyncCount: outOfSync.length,
              newSourcesNeedingDatabaseSync: newSources.length,
              obsoleteSourcesInDatabase: obsoleteSources.length,
              validationIssues: report.issues.length,
            },
            details: {
              allStatuses,
              outOfSync,
              disabledSources,
              newSources,
              obsoleteSources,
              validationIssues: report.issues,
            },
          },
        })
      }

      case 'validate': {
        // Validate all sources
        const report = generateSourceReport()
        const validations = Object.keys(require('../../src/shared/sourceConfig').SOURCE_CONFIGS).map(slug => ({
          slug,
          ...validateSourceConfig(slug),
        }))

        return createResponse(200, {
          success: true,
          data: {
            report,
            validations,
            issues: report.issues,
          },
        })
      }

      case 'export': {
        // Export all configurations
        const configs = exportSourceConfigAsJSON()
        return createResponse(200, {
          success: true,
          data: configs,
        })
      }

      case 'export-single': {
        // Export single source configuration
        const slug = event.queryStringParameters?.slug
        if (!slug) {
          return createResponse(400, {
            success: false,
            error: 'Missing slug parameter',
          })
        }

        const config = exportSourceConfigAsJSON(slug)
        if (!config[slug]) {
          return createResponse(404, {
            success: false,
            error: `Source not found: ${slug}`,
          })
        }

        return createResponse(200, {
          success: true,
          data: config,
        })
      }

      default:
        return createResponse(400, {
          success: false,
          error: `Unknown action: ${action}. Valid actions: status, validate, export, export-single`,
        })
    }
  } catch (err) {
    console.error('admin_source_config error:', err)
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch source configuration',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
