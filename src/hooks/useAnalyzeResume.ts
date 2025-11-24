/**
 * ============================================================================
 * useAnalyzeResume Hook
 * ============================================================================
 *
 * Analyzes a resume for ATS compatibility and provides improvement suggestions.
 *
 * Built on the generic useAITask engine so we:
 * - Share retry / timeout / quota logic with all AI tasks
 * - Keep components dead simple
 * - Only define: payload in, typed response out
 * ============================================================================
 */

import { useCallback } from 'react'
import { useAITask } from './useAITask'
import type {
  ResumeAnalysisResponse,
  UsageStats,
  AIError,
} from '../types/ai-responses.types'

export interface UseAnalyzeResumeReturn {
  /**
   * Run ATS-style analysis for a resume.
   *
   * @param resumeText Raw resume text
   * @returns Structured analysis result or null on failure
   */
  analyze: (resumeText: string) => Promise<ResumeAnalysisResponse | null>

  /**
   * True while the request is in flight.
   */
  loading: boolean

  /**
   * Last error from the AI task engine, if any.
   */
  error: AIError | null

  /**
   * Current usage stats (credits, limits, etc.) if available.
   */
  usageStats: UsageStats | null

  /**
   * Re-run the last failed analyze-resume call.
   */
  retry: () => Promise<ResumeAnalysisResponse | null>
}

/**
 * Hook to analyze a resume for ATS compatibility.
 *
 * Usage:
 * ```tsx
 * const { analyze, loading, error } = useAnalyzeResume()
 *
 * const handleAnalyze = async () => {
 *   const result = await analyze(resumeText)
 *   console.log('ATS Score:', result?.data.atsScore)
 * }
 * ```
 */
export function useAnalyzeResume(): UseAnalyzeResumeReturn {
  const { execute, loading, error, usageStats, retry } = useAITask()

  /**
   * Thin, typed wrapper around the shared execute() function.
   */
  const analyze = useCallback(
    async (resumeText: string): Promise<ResumeAnalysisResponse | null> => {
      try {
        const response = (await execute('analyze-resume', {
          resumeText,
        })) as ResumeAnalysisResponse

        return response
      } catch {
        // useAITask already logs and stores error
        return null
      }
    },
    [execute]
  )

  return {
    analyze,
    loading,
    error: error as AIError | null,
    usageStats: usageStats as UsageStats | null,
    retry: () => retry() as Promise<ResumeAnalysisResponse | null>,
  }
}