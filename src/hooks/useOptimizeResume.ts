import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  ResumeOptimizationResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useOptimizeResume
// ============================================================================

/**
 * Optimize resume for ATS and hiring managers
 */
export interface UseOptimizeResumeReturn {
  optimize: (
    resumeContent: string,
    jobDescription?: string
  ) => Promise<ResumeOptimizationResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<ResumeOptimizationResponse | null>;
}

export function useOptimizeResume(): UseOptimizeResumeReturn {
  const { execute, loading, error, retry } = useAITask();

  const optimize = useCallback(
    async (
      resumeContent: string,
      jobDescription?: string
    ): Promise<ResumeOptimizationResponse | null> => {
      try {
        return (await execute('optimize-resume', {
          resumeContent,
          jobDescription,
        })) as ResumeOptimizationResponse;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    optimize,
    loading,
    error,
    retry: () => retry() as Promise<ResumeOptimizationResponse | null>,
  };
}