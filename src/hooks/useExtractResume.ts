/**
// ============================================================================
 * //useExtractResume Hook
 * ============================================================================
 *
 * Extracts structured data from raw resume text:
 * - Personal info
 * - Experience / education
 * - Skills and keywords
 *
 * Built on the shared useAITask engine so we inherit:
 * - Retry logic
 * - Quota / usage tracking
 * - Centralized error handling
 * ============================================================================
 */

import { useCallback, useState } from 'react'
import type { ResumeExtractionResponse } from '../types/ai-responses.types'
import type { AIError, UsageStats } from '../types/ai-responses.types'

// ============================================================================
// Return type
// ============================================================================

export interface UseExtractResumeReturn {
  /**
   * Extract structured resume data from raw text.
   */
  extract: (resumeText: string) => Promise<ResumeExtractionResponse | null>

  /**
   * True while extraction is in progress.
   */
  loading: boolean

  /**
   * Last error from the AI engine, if any.
   */
  error: AIError | null

  /**
   * Current usage / quota stats, if available.
   */
  usageStats: UsageStats | null

  /**
   * Retry the last failed extract-resume call.
   */
  retry: () => Promise<ResumeExtractionResponse | null>
}

// ============================================================================
// Hook implementation
// ============================================================================

export function useExtractResume(): UseExtractResumeReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AIError | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)

  const extract = useCallback(async (resumeText: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/.netlify/functions/parse_resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError({
          code: data?.code ?? 'parse_resume_error',
          message: data?.error || 'Failed to parse resume',
          retryable: false,
        })
        return null
      }

      return data as ResumeExtractionResponse
    } catch (err: any) {
      setError({
        code: 'NETWORK_ERROR',
        message: err?.message || 'Unknown error',
        retryable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    extract,
    loading,
    error,
    usageStats,
    retry: () => extract(''), 
  }
}