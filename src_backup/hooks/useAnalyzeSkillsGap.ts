import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  SkillsGapResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useAnalyzeSkillsGap
// ============================================================================

/**
 * Analyze skills gap between resume and job requirements
 */
export interface UseAnalyzeSkillsGapReturn {
  analyze: (
    resumeContent: string,
    jobDescription: string
  ) => Promise<SkillsGapResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<SkillsGapResponse | null>;
}

export function useAnalyzeSkillsGap(): UseAnalyzeSkillsGapReturn {
  const { execute, loading, error, retry } = useAITask();

  const analyze = useCallback(
    async (
      resumeContent: string,
      jobDescription: string
    ): Promise<SkillsGapResponse | null> => {
      try {
        return (await execute('analyze-skills-gap', {
          resumeContent,
          jobDescription,
        })) as SkillsGapResponse;
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
    retry: () => retry() as Promise<SkillsGapResponse | null>,
  };
}