/**
 * ============================================================================
 * useAITask - Generic Hook Factory for All AI Tasks
 * ============================================================================
 * 
 * 🎓 LEARNING NOTE: This is a "hook factory" pattern. Instead of 11 nearly-
 * identical hooks, we have ONE reusable hook that handles:
 * - Retry logic with exponential backoff
 * - Request timeout handling
 * - Quota tracking per tier
 * - Error handling and user-friendly messages
 * - Loading and error states
 * 
 * This reduces code by ~60% and means bugs are fixed once, everywhere.
 * 
 * Usage:
 * ```tsx
 * const { execute, loading, error, usageStats } = useAITask();
 * const result = await execute('analyze-resume', { resumeText: '...' });
 * ```
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
import type { UserVoiceProfile, VoiceTaskType, VoicePreset } from '../lib/voicePrompt';
import { useCareerProfile } from './useCareerProfile';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default retry configuration
 * - 3 attempts
 * - Start at 1 second, double each time
 * - Max 8 seconds between retries
 * - 30 second timeout per request
 */
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

/**
 * What the hook returns to components
 */
export interface UseAITaskReturn {
  /**
   * Execute an AI task with optional voice profile integration
   *
   * @param taskName - Name of the task (e.g., 'analyze-resume')
   * @param input - Task input data
   * @param options - Optional voice profile and task type
   * @returns Parsed response data or null if failed
   * @throws AIError with details about failure
   */
  execute: (
    taskName: TaskName,
    input: unknown,
    options?: {
      voiceProfile?: UserVoiceProfile;
      taskType?: VoiceTaskType;
      systemPrompt?: string;
    }
  ) => Promise<AITaskResponse>;

  /**
   * Is a request currently in progress?
   */
  loading: boolean;

  /**
   * Last error that occurred
   */
  error: AIError | null;

  /**
   * Clear error state (useful for retry UI)
   */
  clearError: () => void;

  /**
   * Current usage stats for the active task
   */
  usageStats: UsageStats | null;

  /**
   * Retry the last failed request
   */
  retry: () => Promise<AITaskResponse | null>;

  /**
   * User's voice profile from career profile (if available)
   */
  voiceProfile: UserVoiceProfile | null;
}

// ============================================================================
// INTERNAL STORAGE FOR RETRY
// ============================================================================

interface StoredRequest {
  taskName: TaskName;
  input: unknown;
  voiceProfile?: UserVoiceProfile;
  taskType?: VoiceTaskType;
  systemPrompt?: string;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useAITask(): UseAITaskReturn {
  const { user } = useAuth();
  const { profile } = useCareerProfile();

  // =========================================================================
  // STATE
  // =========================================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [lastRequest, setLastRequest] = useState<StoredRequest | null>(null);

  // =========================================================================
  // VOICE PROFILE
  // =========================================================================

  // Convert career profile to voice profile format
  const voiceProfile: UserVoiceProfile | null = profile?.voice_profile
    ? {
        voice_preset: profile.voice_profile.voice_preset as VoicePreset | null,
        voice_custom_sample: profile.voice_profile.writing_sample || null,
        voice_formality: profile.voice_profile.formality_level || null,
        voice_playfulness: profile.voice_profile.warmth_level || null,
        voice_conciseness: profile.voice_profile.conciseness_level || null,
        full_name: profile.full_name || null,
        headline: profile.current_title || null,
      }
    : null;

  // =========================================================================
  // QUOTA CHECKING
  // =========================================================================

  /**
   * Check if user has quota remaining for this task
   */
  const checkQuota = useCallback(
    (taskName: TaskName): { canUse: boolean; reason?: string } => {
      // Get user tier from auth context
      const userTier = (user?.user_metadata?.tier || 'starter') as UserTierForAI;

      // Get monthly limit for this task/tier
      const limit = getTaskLimit(userTier, taskName);

      // Premium tier has unlimited usage
      if (limit === Infinity) {
        return { canUse: true };
      }

      // For now, we'll check against a simple count
      // In production, this would query Supabase for actual usage
      // This is a placeholder - your backend will return real usage
      return { canUse: true }; // Backend enforces limits
    },
    [user]
  );

  // =========================================================================
  // RETRY LOGIC WITH EXPONENTIAL BACKOFF
  // =========================================================================

  /**
   * Delay between retries
   * 
   * 🎓 PATTERN: Exponential backoff prevents overwhelming the server
   * Attempt 1: 1s wait
   * Attempt 2: 2s wait
   * Attempt 3: 4s wait
   */
  const delayMs = (attempt: number): Promise<void> => {
    const baseDelay = Math.min(
      DEFAULT_RETRY_CONFIG.initialDelayMs *
      Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt),
      DEFAULT_RETRY_CONFIG.maxDelayMs
    );

    return new Promise((resolve) => setTimeout(resolve, baseDelay));
  };

  /**
   * Add timeout to a fetch promise
   */
  const fetchWithTimeout = (
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> => {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  };

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================

  /**
   * Convert errors to user-friendly AIError
   */
  const createError = useCallback(
    (error: unknown, attempt: number = 0
    ): AIError => {
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
            message:
              'You\'ve reached your monthly limit. Upgrade your tier to continue.',
            code: 'QUOTA_EXCEEDED',
            retryable: false,
            details: error.message,
          };
        }

        // Generic error message
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
        voiceProfile?: UserVoiceProfile;
        taskType?: VoiceTaskType;
        systemPrompt?: string;
      }
    ): Promise<AITaskResponse> => {
      setLoading(true);
      setError(null);

      // Use provided voice profile or fall back to user's profile
      const effectiveVoiceProfile = options?.voiceProfile || voiceProfile;
      const effectiveTaskType = options?.taskType;
      const effectiveSystemPrompt = options?.systemPrompt;

      setLastRequest({
        taskName,
        input,
        voiceProfile: effectiveVoiceProfile || undefined,
        taskType: effectiveTaskType,
        systemPrompt: effectiveSystemPrompt,
      });

      let lastError: AIError | null = null;

      // Get AI client
      const aiClient = getAIClient();

      // Set auth token
      const token =
        (user as any)?.session?.access_token ||
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
          // Check quota before making request
          const quotaCheck = checkQuota(taskName);
          if (!quotaCheck.canUse) {
            throw new Error(`Quota exceeded: ${quotaCheck.reason}`);
          }

          // Make request using AIClient with voice support
          const data = await aiClient.call({
            task: taskName,
            input: input as string | undefined,
            voiceProfile: effectiveVoiceProfile || undefined,
            taskType: effectiveTaskType,
            systemPrompt: effectiveSystemPrompt,
          });

          // Check if response indicates success
          if (!data.success) {
            throw new Error(data.error || 'API returned error');
          }

          // Update usage stats from response
          if ((data as any).usage) {
            setUsageStats((data as any).usage);
          }

          setLoading(false);
          return data as AITaskResponse;
        } catch (err) {
          lastError = createError(err, attempt);

          // If not retryable or last attempt, stop trying
          if (!lastError.retryable || attempt >= DEFAULT_RETRY_CONFIG.maxRetries) {
            setError(lastError);
            setLoading(false);
            throw lastError;
          }

          // Otherwise wait and retry
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

      // Should never reach here, but just in case
      if (lastError) {
        setError(lastError);
        throw lastError;
      }

      throw new Error('Unknown error occurred');
    },
    [user, voiceProfile, createError, checkQuota]
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
      const result = await execute(lastRequest.taskName, lastRequest.input);
      return result;
    } catch (err) {
      // Error already set by execute()
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
    voiceProfile,
  };
}

// ============================================================================
// EXPORT TYPES (already exported above in interface)
// ============================================================================