import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  InterviewPrepResponse,
} from '../types/ai-responses.types';

// ============================================================================
// usePrepareInterview
// ============================================================================

/**
 * Generate interview preparation with practice questions and tips
 */
export interface UsePrepareInterviewReturn {
  prepare: (
    jobTitle: string,
    company: string,
    resumeContent: string
  ) => Promise<InterviewPrepResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<InterviewPrepResponse | null>;
}

export function usePrepareInterview(): UsePrepareInterviewReturn {
  const { execute, loading, error, retry } = useAITask();

  const prepare = useCallback(
    async (
      jobTitle: string,
      company: string,
      resumeContent: string
    ): Promise<InterviewPrepResponse | null> => {
      try {
        return (await execute('prepare-interview', {
          jobTitle,
          company,
          resumeContent,
        })) as InterviewPrepResponse;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    prepare,
    loading,
    error,
    retry: () => retry() as Promise<InterviewPrepResponse | null>,
  };
}