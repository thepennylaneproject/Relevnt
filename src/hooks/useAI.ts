/**
 * useAI Hook
 * 
 * Main hook for interacting with AI services
 * Routes requests to appropriate AI providers based on task and tier
 */

import { useState, useCallback } from 'react';

interface AIResponseData {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface UseAIReturn<T> {
  execute: (taskName: string, input: unknown) => Promise<T>;
  loading: boolean;
  error: Error | null;
}

interface AIHookConfig {
  taskName?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  options?: Record<string, unknown>;
}

export function useAI(config?: AIHookConfig): UseAIReturn<AIResponseData> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (taskName: string, input: unknown): Promise<AIResponseData> => {
      setLoading(true);
      setError(null);

      try {
        // Call AI API endpoint
        const response = await fetch('/.netlify/functions/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: taskName,
            input,
            ...config?.options,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setLoading(false);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        throw error;
      }
    },
    [config?.options]
  );

  return {
    execute,
    loading,
    error,
  };
}

export type { AIHookConfig, AIResponseData, UseAIReturn };