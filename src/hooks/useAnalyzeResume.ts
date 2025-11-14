/**
 * useAnalyzeResume Hook
 * 
 * Analyzes resume for ATS compatibility and provides improvement suggestions
 * 
 * 🎓 PATTERN: This hook is now built on the generic useAITask factory.
 * Removed 40+ lines of duplicate code, now just:
 * 1. Define response type
 * 2. Call factory hook
 * 3. Create wrapper function that calls execute()
 * 4. Return everything
 * 
 * Benefits:
 * - Retry logic? Handled by factory
 * - Quota tracking? Handled by factory
 * - Timeout handling? Handled by factory
 * - Error handling? Handled by factory
 * - Single place to fix bugs across all hooks
 */

import { useCallback } from 'react';
import { useAITask } from './useAITask';
import type { ResumeAnalysisResponse } from '../types/ai-responses.types';

export interface UseAnalyzeResumeReturn {
  /**
   * Analyze a resume for ATS compatibility
   * 
   * @param resumeText - Raw resume text
   * @returns Analysis result with ATS score and improvements
   */
  analyze: (resumeText: string) => Promise<ResumeAnalysisResponse | null>;

  /**
   * Is analysis in progress?
   */
  loading: boolean;

  /**
   * Last error that occurred
   */
  error: any;

  /**
   * Current usage stats (e.g., 2/5 remaining this month)
   */
  usageStats: any;

  /**
   * Retry the last failed analysis
   */
  retry: () => Promise<ResumeAnalysisResponse | null>;
}

/**
 * Hook to analyze resume for ATS compatibility
 * 
 * Usage:
 * ```tsx
 * const { analyze, loading, error } = useAnalyzeResume();
 * 
 * const handleAnalyze = async () => {
 *   const result = await analyze(resumeText);
 *   console.log('ATS Score:', result?.data.atsScore);
 * }
 * ```
 */
export function useAnalyzeResume(): UseAnalyzeResumeReturn {
  const { execute, loading, error, usageStats, retry } = useAITask();

  /**
   * Wrapper around factory's execute() for this specific task
   * Type-safe because TypeScript knows 'analyze-resume' returns ResumeAnalysisResponse
   */
  const analyze = useCallback(
    async (resumeText: string): Promise<ResumeAnalysisResponse | null> => {
      try {
        const response = (await execute('analyze-resume', {
          resumeText,
        })) as ResumeAnalysisResponse;

        return response;
      } catch (err) {
        // Error already handled by factory and stored in `error` state
        return null;
      }
    },
    [execute]
  );

  return {
    analyze,
    loading,
    error,
    usageStats,
    retry: () => retry() as Promise<ResumeAnalysisResponse | null>,
  };
}