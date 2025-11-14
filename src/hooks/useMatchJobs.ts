/**
 * useMatchJobs Hook
 * 
 * Matches resume to job listings and returns compatibility scores
 */

import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type { JobMatchingResponse } from '../types/ai-responses.types';

export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  reasoning: string;
}

export interface UseMatchJobsReturn {
  /**
   * Match resume to job listings
   */
  match: (
    resumeContent: string,
    jobs: Array<{ id: string; title: string; description: string }>
  ) => Promise<JobMatchingResponse | null>;

  /**
   * Currently matched jobs
   */
  matches: JobMatch[];

  /**
   * Is matching in progress?
   */
  loading: boolean;

  /**
   * Last error
   */
  error: any;

  /**
   * Retry last match operation
   */
  retry: () => Promise<JobMatchingResponse | null>;
}

export function useMatchJobs(): UseMatchJobsReturn {
  const { execute, loading, error, retry } = useAITask();

  const match = useCallback(
    async (
      resumeContent: string,
      jobs: Array<{ id: string; title: string; description: string }>
    ): Promise<JobMatchingResponse | null> => {
      try {
        const response = (await execute('match-jobs', {
          resumeContent,
          jobs,
        })) as JobMatchingResponse;

        return response;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    match,
    matches: [], // In production, you'd extract from last response
    loading,
    error,
    retry: () => retry() as Promise<JobMatchingResponse | null>,
  };
}