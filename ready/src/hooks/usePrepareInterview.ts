/**
 * usePrepareInterview - Hook for generating interview prep questions
 */

import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type { InterviewPrepResponse } from '../types/ai-responses.types';

export interface UsePrepareInterviewReturn {
  prepare: (
    position: string,
    company?: string,
    focusArea?: string
  ) => Promise<InterviewPrepResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<InterviewPrepResponse | null>;
}

export function usePrepareInterview(): UsePrepareInterviewReturn {
  const { execute, loading, error, retry } = useAITask();

  const prepare = useCallback(
    async (
      position: string,
      company?: string,
      focusArea?: string
    ): Promise<InterviewPrepResponse | null> => {
      try {
        return (await execute('interview-prep', {
          position,
          company: company || 'General Practice',
          focusArea,
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
