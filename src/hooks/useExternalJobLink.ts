/**
 * useExternalJobLink Hook
 * 
 * Intercepts external job link clicks and automatically stages applications.
 * This creates a frictionless experience where users' job browsing automatically
 * populates their application pipeline.
 */

import { useCallback } from 'react'
import { useApplications } from './useApplications'
import { useToast } from '../components/ui/Toast'

interface JobLinkParams {
  jobId: string
  jobTitle: string
  company: string
  externalUrl: string
}

export function useExternalJobLink() {
  const { createApplication } = useApplications()
  const { showToast } = useToast()

  const handleExternalClick = useCallback(
    async (params: JobLinkParams) => {
      // Fire and forget - don't block navigation
      try {
        await createApplication(params.jobId, {
          company: params.company,
          position: params.jobTitle,
          status: 'staged',
          notes: `Viewed on ${new Date().toLocaleDateString()}`,
        })

        // Show non-blocking toast notification
        showToast(
          'Staged this role in your Pipeline',
          'info',
          5000
        )
      } catch (error) {
        // Don't block user flow even if staging fails
        console.error('Failed to stage application:', error)
      }
    },
    [createApplication, showToast]
  )

  return { handleExternalClick }
}
