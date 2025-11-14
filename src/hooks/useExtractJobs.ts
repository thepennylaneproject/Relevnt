import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  JobExtractionResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useExtractJobs
// ============================================================================

/**
 * Extract job listings from text or HTML content
 */
export interface UseExtractJobsReturn {
  extract: (content: string) => Promise<JobExtractionResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<JobExtractionResponse | null>;
}

export function useExtractJobs(): UseExtractJobsReturn {
  const { execute, loading, error, retry } = useAITask();

  const extract = useCallback(
    async (content: string): Promise<JobExtractionResponse | null> => {
      try {
        return (await execute('extract-jobs', {
          content,
        })) as JobExtractionResponse;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    extract,
    loading,
    error,
    retry: () => retry() as Promise<JobExtractionResponse | null>,
  };
}