import { useCallback } from 'react';
import { useAITask } from './useAITask';

export interface NetworkingDraftResponse {
  success: boolean;
  data?: {
    draft: string;
    strategy: string;
  };
  error?: string;
}

export function useNetworkingDraft() {
  const { execute, loading, error } = useAITask();

  const generateDraft = useCallback(
    async (
      contactName: string,
      contactRole: string,
      company: string,
      jobTitle: string
    ): Promise<NetworkingDraftResponse | null> => {
      try {
        const result = await execute('networking-draft', {
          contactName,
          contactRole,
          company,
          jobTitle,
        });
        return result as NetworkingDraftResponse;
      } catch (err) {
        return null;
      }
    },
    [execute]
  );

  return {
    generateDraft,
    loading,
    error,
  };
}
