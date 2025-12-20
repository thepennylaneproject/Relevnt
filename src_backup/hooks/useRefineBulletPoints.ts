import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type {
  BulletPointRefinementResponse,
} from '../types/ai-responses.types';

// ============================================================================
// useRefineBulletPoints
// ============================================================================

/**
 * Refine resume bullet points for impact and clarity
 */
export interface UseRefineBulletPointsReturn {
  refine: (
    bulletPoints: string[]
  ) => Promise<BulletPointRefinementResponse | null>;
  loading: boolean;
  error: any;
  retry: () => Promise<BulletPointRefinementResponse | null>;
}

export function useRefineBulletPoints(): UseRefineBulletPointsReturn {
  const { execute, loading, error, retry, voiceProfile } = useAITask();

  const refine = useCallback(
    async (
      bulletPoints: string[]
    ): Promise<BulletPointRefinementResponse | null> => {
      try {
        return (await execute(
          'refine-bullet-points',
          {
            bulletPoints,
          },
          {
            voiceProfile: voiceProfile || undefined,
            taskType: 'resume_bullets',
          }
        )) as BulletPointRefinementResponse;
      } catch (err) {
        return null;
      }
    },
    [execute, voiceProfile]
  );

  return {
    refine,
    loading,
    error,
    retry: () => retry() as Promise<BulletPointRefinementResponse | null>,
  };
}
