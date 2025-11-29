import { useCallback } from 'react'
import { useAITask } from './useAITask'
import type {
  ResumeAnalysisResponse,
  UsageStats,
  AIError,
} from '../types/ai-responses.types'

export interface UseAnalyzeResumeReturn {
  analyze: (resumeText: string) => Promise<ResumeAnalysisResponse | null>
  loading: boolean
  error: AIError | null
  usageStats: UsageStats | null
  retry: () => Promise<ResumeAnalysisResponse | null>
}

export function useAnalyzeResume(): UseAnalyzeResumeReturn {
  const { execute, loading, error, usageStats, retry } = useAITask()

  const analyze = useCallback(
    async (resumeText: string): Promise<ResumeAnalysisResponse | null> => {
      try {
        const response = (await execute('analyze-resume', {
          resumeText,
        })) as ResumeAnalysisResponse

        return response
      } catch {
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