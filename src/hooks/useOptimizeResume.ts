/**
 * ============================================================================
 * useOptimizeResume Hook
 * ============================================================================
 *
 * Optimizes a resume for ATS and human readers:
 * - Rewrites content for clarity and impact
 * - Improves keyword alignment with a target job description
 * - Surfaces an updated ATS score and suggestions
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
  ResumeOptimizationResponse,
  UsageStats,
  AIError,
} from '../types/ai-responses.types'

// ============================================================================
// Return type
// ============================================================================

export interface UseOptimizeResumeReturn {
  /**
   * Optimize resume content, optionally against a specific job description.
   */
  optimize: (
    resumeContent: string,
    jobDescription?: string
  ) => Promise<ResumeOptimizationResponse | null>

  /**
   * True while optimization is in progress.
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
   * Retry the last failed optimize-resume call.
   */
  retry: () => Promise<ResumeOptimizationResponse | null>
}

// ============================================================================
// Hook implementation
// ============================================================================

export function useOptimizeResume(): UseOptimizeResumeReturn {
  const { execute, loading, error, usageStats, retry } = useAITask()

  const optimize = useCallback(
    async (
      resumeContent: string,
      jobDescription?: string
    ): Promise<ResumeOptimizationResponse | null> => {
      try {
        const response = (await execute('optimize-resume', {
          resumeContent,
          jobDescription,
        })) as ResumeOptimizationResponse

        return response
      } catch {
        // useAITask already logs and stores the error
        return null
      }
    },
    [execute]
  )

  return {
    optimize,
    loading,
    error: error as AIError | null,
    usageStats: usageStats as UsageStats | null,
    retry: () => retry() as Promise<ResumeOptimizationResponse | null>,
  }
}