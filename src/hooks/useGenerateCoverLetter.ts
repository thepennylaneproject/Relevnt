import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  CoverLetterResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useGenerateCoverLetter
// ============================================================================

/**
 * Generate a tailored cover letter for a job
 */
export interface UseGenerateCoverLetterReturn {
  generate: (
    resumeContent: string,
    jobDescription: string,
    companyName: string
  ) => Promise<CoverLetterResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<CoverLetterResponse | null>;
}

export function useGenerateCoverLetter(): UseGenerateCoverLetterReturn {
  const { execute, loading, error, retry } = useAITask();

  const generate = useCallback(
    async (
      resumeContent: string,
      jobDescription: string,
      companyName: string
    ): Promise<CoverLetterResponse | null> => {
      try {
        return (await execute('generate-cover-letter', {
          resumeContent,
          jobDescription,
          companyName,
        })) as CoverLetterResponse;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    generate,
    loading,
    error,
    retry: () => retry() as Promise<CoverLetterResponse | null>,
  };
}