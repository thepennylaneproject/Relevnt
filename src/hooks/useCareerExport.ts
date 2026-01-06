/**
 * =============================================================================
 * CUSTOM HOOK: useCareerExport
 * =============================================================================
 * React hook for managing career data export operations
 * =============================================================================
 */

import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import type { ExportFormat, ExportProgress } from '../types/export.types'
import {
  generateCareerExport,
  downloadJSON,
  generatePDFSummary,
  downloadBothFormats,
} from '../services/exportService'

export interface UseCareerExportReturn {
  /** Current export progress state */
  progress: ExportProgress

  /** Whether an export is in progress */
  isExporting: boolean

  /** Error message if export failed */
  error: string | null

  /** Export data in specified format */
  exportData: (format: ExportFormat) => Promise<void>

  /** Reset export state */
  reset: () => void
}

export function useCareerExport(): UseCareerExportReturn {
  const { user } = useAuth()
  const [progress, setProgress] = useState<ExportProgress>({
    stage: 'idle',
    message: '',
    progress: 0,
  })
  const [error, setError] = useState<string | null>(null)

  const isExporting = progress.stage !== 'idle' && progress.stage !== 'complete' && progress.stage !== 'error'

  const reset = useCallback(() => {
    setProgress({
      stage: 'idle',
      message: '',
      progress: 0,
    })
    setError(null)
  }, [])

  const exportData = useCallback(
    async (format: ExportFormat) => {
      if (!user) {
        setError('You must be logged in to export data')
        return
      }

      try {
        setError(null)
        setProgress({
          stage: 'fetching',
          message: 'Gathering your career data...',
          progress: 20,
        })

        if (format === 'both') {
          setProgress({
            stage: 'generating',
            message: 'Generating export files...',
            progress: 50,
          })

          await downloadBothFormats(user)

          setProgress({
            stage: 'downloading',
            message: 'Download started!',
            progress: 90,
          })
        } else {
          // Fetch data
          const data = await generateCareerExport(user)

          setProgress({
            stage: 'generating',
            message: `Generating ${format.toUpperCase()} file...`,
            progress: 60,
          })

          // Generate and download based on format
          if (format === 'json') {
            downloadJSON(data)
          } else if (format === 'pdf') {
            generatePDFSummary(data)
          }

          setProgress({
            stage: 'downloading',
            message: 'Download started!',
            progress: 90,
          })
        }

        // Mark as complete
        setTimeout(() => {
          setProgress({
            stage: 'complete',
            message: 'Export complete!',
            progress: 100,
          })

          // Auto-reset after 3 seconds
          setTimeout(reset, 3000)
        }, 500)

      } catch (err) {
        console.error('Export failed:', err)
        const message = err instanceof Error ? err.message : 'Failed to export data'
        setError(message)
        setProgress({
          stage: 'error',
          message: 'Export failed',
          progress: 0,
        })
      }
    },
    [user, reset]
  )

  return {
    progress,
    isExporting,
    error,
    exportData,
    reset,
  }
}
