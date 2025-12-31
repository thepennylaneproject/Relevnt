/**
 * useAITask - Generic Hook for Ready AI Tasks
 * 
 * Handles retry logic, timeout, quota tracking, and error handling
 * for all interview preparation and career coaching AI tasks.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type {
  TaskName,
  AITaskResponse,
  AIError,
  RetryConfig,
  UsageStats,
  UserTierForAI,
} from '../types/ai-responses.types';
import { getTaskLimit } from '../types/ai-responses.types';
import { getAIClient } from '../services/aiClient';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 8000,
  timeoutMs: 30000,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UseAITaskReturn {
  execute: (
    taskName: TaskName,
    input: unknown,
    options?: {
      systemPrompt?: string;
    }
  ) => Promise<AITaskResponse>;
  loading: boolean;
  error: AIError | null;
  clearError: () => void;
  usageStats: UsageStats | null;
  retry: () => Promise<AITaskResponse | null>;
}

interface StoredRequest {
  taskName: TaskName;
  input: unknown;
  systemPrompt?: string;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useAITask(): UseAITaskReturn {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [lastRequest, setLastRequest] = useState<StoredRequest | null>(null);

  // =========================================================================
  // TIER NORMALIZATION
  // =========================================================================

  const normalizeUserTierForAI = (rawTier: string | undefined | null): UserTierForAI => {
    const tier = (rawTier || '').toLowerCase();

    if (tier === 'admin') return 'premium' as UserTierForAI;
    if (tier === 'premium') return 'premium' as UserTierForAI;
    if (tier === 'pro') return 'pro' as UserTierForAI;
    if (tier === 'starter') return 'starter' as UserTierForAI;

    return 'starter' as UserTierForAI;
  };

  // =========================================================================
  // QUOTA CHECKING
  // =========================================================================

  const checkQuota = useCallback(
    (taskName: TaskName): { canUse: boolean; reason?: string } => {
      const rawTier = user?.user_metadata?.tier as string | undefined;
      const normalizedTier = normalizeUserTierForAI(rawTier);
      const limit = getTaskLimit(normalizedTier, taskName);

      if (limit === Infinity) {
        return { canUse: true };
      }

      // Placeholder: backend will enforce actual usage limits
      return { canUse: true };
    },
    [user]
  );

  // =========================================================================
  // RETRY LOGIC
  // =========================================================================

  const delayMs = (attempt: number): Promise<void> => {
    const baseDelay = Math.min(
      DEFAULT_RETRY_CONFIG.initialDelayMs *
      Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt),
      DEFAULT_RETRY_CONFIG.maxDelayMs
    );
    return new Promise((resolve) => setTimeout(resolve, baseDelay));
  };

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  const createError = useCallback(
    (error: unknown, attempt: number = 0): AIError => {
      if (error instanceof Error) {
        if (error.message === 'Request timeout') {
          return {
            message: 'Request took too long. Please try again.',
            code: 'TIMEOUT',
            retryable: attempt < DEFAULT_RETRY_CONFIG.maxRetries,
            details: error.message,
          };
        }

        if (error.message.includes('Failed to fetch')) {
          return {
            message: 'Network connection failed. Check your internet.',
            code: 'NETWORK_ERROR',
            retryable: true,
            details: error.message,
          };
        }

        if (error.message.includes('quota')) {
          return {
            message: 'You\'ve reached your monthly limit. Upgrade your tier to continue.',
            code: 'QUOTA_EXCEEDED',
            retryable: false,
            details: error.message,
          };
        }

        return {
          message: `Request failed: ${error.message}`,
          code: 'UNKNOWN',
          retryable: attempt < DEFAULT_RETRY_CONFIG.maxRetries,
          details: error,
        };
      }

      return {
        message: 'An unexpected error occurred. Please try again.',
        code: 'UNKNOWN',
        retryable: attempt < DEFAULT_RETRY_CONFIG.maxRetries,
        details: error,
      };
    }, []);

  // =========================================================================
  // MAIN EXECUTE FUNCTION
  // =========================================================================

  const execute = useCallback(
    async (
      taskName: TaskName,
      input: unknown,
      options?: {
        systemPrompt?: string;
      }
    ): Promise<AITaskResponse> => {
      setLoading(true);
      setError(null);

      setLastRequest({
        taskName,
        input,
        systemPrompt: options?.systemPrompt,
      });

      let lastError: AIError | null = null;

      const aiClient = getAIClient();

      // Set auth token
      const session = await supabase.auth.getSession();
      const token =
        session.data.session?.access_token ||
        (user as any)?.access_token ||
        localStorage.getItem('auth_token') ||
        '';

      if (token) {
        aiClient.setToken(token);
      }

      // Try up to maxRetries times
      for (
        let attempt = 0;
        attempt <= DEFAULT_RETRY_CONFIG.maxRetries;
        attempt++
      ) {
        try {
          const quotaCheck = checkQuota(taskName);
          if (!quotaCheck.canUse) {
            throw new Error(`Quota exceeded: ${quotaCheck.reason}`);
          }

          const data = await aiClient.call({
            task: taskName,
            input: input as string | undefined,
            systemPrompt: options?.systemPrompt,
          });

          if (!data.success) {
            throw new Error(data.error || 'API returned error');
          }

          if ((data as any).usage) {
            setUsageStats((data as any).usage);
          }

          setLoading(false);
          return data as AITaskResponse;
        } catch (err) {
          lastError = createError(err, attempt);

          if (!lastError.retryable || attempt >= DEFAULT_RETRY_CONFIG.maxRetries) {
            setError(lastError);
            setLoading(false);
            throw lastError;
          }

          console.warn(
            `Attempt ${attempt + 1} failed, retrying in ${Math.min(
              DEFAULT_RETRY_CONFIG.initialDelayMs *
              Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt),
              DEFAULT_RETRY_CONFIG.maxDelayMs
            )}ms...`
          );

          await delayMs(attempt);
        }
      }

      if (lastError) {
        setError(lastError);
        throw lastError;
      }

      throw new Error('Unknown error occurred');
    },
    [user, createError, checkQuota]
  );

  // =========================================================================
  // RETRY FUNCTION
  // =========================================================================

  const retry = useCallback(async (): Promise<AITaskResponse | null> => {
    if (!lastRequest) {
      setError({
        message: 'No previous request to retry',
        code: 'UNKNOWN',
        retryable: false,
      });
      return null;
    }

    try {
      const result = await execute(lastRequest.taskName, lastRequest.input, {
        systemPrompt: lastRequest.systemPrompt,
      });
      return result;
    } catch (err) {
      return null;
    }
  }, [execute, lastRequest]);

  // =========================================================================
  // ERROR CLEARING
  // =========================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    execute,
    loading,
    error,
    clearError,
    usageStats,
    retry,
  };
}
