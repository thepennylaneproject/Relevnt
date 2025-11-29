import { useCallback } from 'react'
import { useAITask } from './useAITask'
import type {
  ResumeExtractionResponse,
  UsageStats,
  AIError,
} from '../types/ai-responses.types'

export interface UseExtractResumeReturn {
  extract: (resumeText: string) => Promise<ResumeExtractionResponse | null>
  loading: boolean
  error: AIError | null
  usageStats: UsageStats | null
  retry: () => Promise<ResumeExtractionResponse | null>
}

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
        // useAITask already set error state
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