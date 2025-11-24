/**
 * ============================================================================
 * useExtractResume Hook
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

import { useCallback } from 'react'
import { useAITask } from './useAITask'
import type {
  ResumeExtractionResponse,
  UsageStats,
  AIError,
} from '../types/ai-responses.types'

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
  const { execute, loading, error, usageStats, retry } = useAITask()

  const extract = useCallback(
    async (resumeText: string): Promise<ResumeExtractionResponse | null> => {
      try {
        const response = (await execute('extract-resume', {
          resumeText,
        })) as ResumeExtractionResponse

        return response
      } catch {
        // useAITask already logs and stores the error
        return null
      }
    },
    [execute]
  )

  return {
    extract,
    loading,
    error: error as AIError | null,
    usageStats: usageStats as UsageStats | null,
    retry: () => retry() as Promise<ResumeExtractionResponse | null>,
  }
}