import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  ResumeExtractionResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useExtractResume
// ============================================================================

/**
 * Extract structured data from resume text
 */
export interface UseExtractResumeReturn {
  extract: (resumeText: string) => Promise<ResumeExtractionResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<ResumeExtractionResponse | null>;
}

export function useExtractResume(): UseExtractResumeReturn {
  const { execute, loading, error, retry } = useAITask();

  const extract = useCallback(
    async (resumeText: string): Promise<ResumeExtractionResponse | null> => {
      try {
        return (await execute('extract-resume', {
          resumeText,
        })) as ResumeExtractionResponse;
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
    retry: () => retry() as Promise<ResumeExtractionResponse | null>,
  };
}