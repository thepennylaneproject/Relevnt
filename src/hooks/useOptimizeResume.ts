import { useCallback } from 'react'
import { useAITask } from './useAITask'
import type {
  ResumeOptimizationResponse,
  UsageStats,
  AIError,
} from '../types/ai-responses.types'

export interface UseOptimizeResumeReturn {
  optimize: (
    resumeText: string,
    jobDescription?: string
  ) => Promise<ResumeOptimizationResponse | null>
  loading: boolean
  error: AIError | null
  usageStats: UsageStats | null
  retry: () => Promise<ResumeOptimizationResponse | null>
}

export function useOptimizeResume(): UseOptimizeResumeReturn {
  const { execute, loading, error, usageStats, retry } = useAITask()

  const optimize = useCallback(
    async (
      resumeText: string,
      jobDescription?: string
    ): Promise<ResumeOptimizationResponse | null> => {
      try {
        const response = (await execute('optimize-resume', {
          resumeText,
          jobDescription,
        })) as ResumeOptimizationResponse

        return response
      } catch {
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