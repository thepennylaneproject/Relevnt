import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  JobAnalysisResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useAnalyzeJobDescription
// ============================================================================

/**
 * Analyze job description to extract key skills and qualifications
 */
export interface UseAnalyzeJobDescriptionReturn {
  analyze: (jobDescription: string) => Promise<JobAnalysisResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<JobAnalysisResponse | null>;
}

export function useAnalyzeJobDescription(): UseAnalyzeJobDescriptionReturn {
  const { execute, loading, error, retry } = useAITask();

  const analyze = useCallback(
    async (jobDescription: string): Promise<JobAnalysisResponse | null> => {
      try {
        return (await execute('analyze-job-description', {
          jobDescription,
        })) as JobAnalysisResponse;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    analyze,
    loading,
    error,
    retry: () => retry() as Promise<JobAnalysisResponse | null>,
  };
}