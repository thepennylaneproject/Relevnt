/**
 * ============================================================================
 * useRefineBulletPoints Hook
 * ============================================================================
 *
 * Refines resume bullet points for:
 * - Clarity
 * - Impact
 * - Quantification and results
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
  BulletPointRefinementResponse,
  UsageStats,
  AIError,
} from '../types/ai-responses.types'

// ============================================================================
// Return type
// ============================================================================

export interface UseRefineBulletPointsReturn {
  /**
   * Refine a list of resume bullet points for clarity and impact.
   */
  refine: (bulletPoints: string[]) => Promise<BulletPointRefinementResponse | null>

  /**
   * True while refinement is in progress.
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
   * Retry the last failed refine-bullet-points call.
   */
  retry: () => Promise<BulletPointRefinementResponse | null>
}

// ============================================================================
// Hook implementation
// ============================================================================

export function useRefineBulletPoints(): UseRefineBulletPointsReturn {
  const { execute, loading, error, usageStats, retry } = useAITask()

  const refine = useCallback(
    async (bulletPoints: string[]): Promise<BulletPointRefinementResponse | null> => {
      try {
        const response = (await execute('refine-bullet-points', {
          bulletPoints,
        })) as BulletPointRefinementResponse

        return response
      } catch {
        // useAITask already logs and stores the error
        return null
      }
    },
    [execute]
  )

  return {
    refine,
    loading,
    error: error as AIError | null,
    usageStats: usageStats as UsageStats | null,
    retry: () => retry() as Promise<BulletPointRefinementResponse | null>,
  }
}