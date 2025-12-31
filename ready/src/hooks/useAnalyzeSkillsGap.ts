/**
 * useAnalyzeSkillsGap - Hook for analyzing skills gap
 * 
 * Compare skills against target role requirements
 */

import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type { SkillsGapResponse } from '../types/ai-responses.types';

export interface UseAnalyzeSkillsGapReturn {
  analyze: (
    resumeContent: string,
    targetRole: string
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
      targetRole: string
    ): Promise<SkillsGapResponse | null> => {
      try {
        return (await execute('skills-gap', {
          resumeContent,
          targetRole,
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
