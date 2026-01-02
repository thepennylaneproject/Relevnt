/**
 * =============================================================================
 * CAREER EXPORT TYPES
 * =============================================================================
 * Type definitions for exporting user career data in portable formats
 * =============================================================================
 */

import type { Resume } from '../hooks/useResumes'
import type { Application } from '../hooks/useApplications'
import type { UserPersona } from './v2-personas'
import type { FeedbackSignal } from '../services/feedbackService'

/**
 * Version of the export format for future compatibility
 */
export const CAREER_EXPORT_VERSION = '1.0.0'

/**
 * Simplified user profile for export
 */
export interface ExportUserProfile {
  fullName: string
  preferredName: string
  email: string
  location: string
  currentRoleTitle: string
  timezone: string
  createdAt: string
}

/**
 * Complete career data export bundle
 */
export interface CareerExport {
  /** Export metadata */
  exportDate: string
  version: string

  /** User profile information */
  user: ExportUserProfile

  /** All user resumes */
  resumes: Resume[]

  /** All user personas with preferences */
  personas: UserPersona[]

  /** All job applications with events */
  applications: Application[]

  /** All feedback signals */
  feedbackHistory: FeedbackSignal[]

  /** Summary statistics */
  summary: {
    totalResumes: number
    totalPersonas: number
    totalApplications: number
    totalFeedbackSignals: number
    accountAge: string
    exportSize: string
  }
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'pdf' | 'both'

/**
 * Export progress state
 */
export interface ExportProgress {
  stage: 'idle' | 'fetching' | 'generating' | 'downloading' | 'complete' | 'error'
  message: string
  progress: number // 0-100
}
