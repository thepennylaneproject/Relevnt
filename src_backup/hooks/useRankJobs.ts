import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  JobRankingResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useRankJobs
// ============================================================================

/**
 * Rank jobs by fit to user's resume and experience
 */
export interface UseRankJobsReturn {
  rank: (
    resumeContent: string,
    jobs: Array<{ id: string; title: string; description: string }>
  ) => Promise<JobRankingResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<JobRankingResponse | null>;
}

export function useRankJobs(): UseRankJobsReturn {
  const { execute, loading, error, retry } = useAITask();

  const rank = useCallback(
    async (
      resumeContent: string,
      jobs: Array<{ id: string; title: string; description: string }>
    ): Promise<JobRankingResponse | null> => {
      try {
        return (await execute('rank-jobs', {
          resumeContent,
          jobs,
        })) as JobRankingResponse;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    rank,
    loading,
    error,
    retry: () => retry() as Promise<JobRankingResponse | null>,
  };
}