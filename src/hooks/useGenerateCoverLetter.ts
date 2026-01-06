import { useCallback } from 'react';
import { useAITask } from './useAITask';
import { usePersonas } from './usePersonas';
import type {
  CoverLetterResponse,
} from '../types/ai-responses.types';
import type { UserVoiceProfile } from '../lib/voicePrompt';

// ============================================================================
// useGenerateCoverLetter
// ============================================================================

/**
 * Generate a tailored cover letter for a job
 * 
 * Voice settings priority:
 * 1. Active persona voice settings (if set)
 * 2. Profile-level voice settings (fallback)
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
  const { execute, loading, error, retry, voiceProfile: profileVoice } = useAITask();
  const { activePersona } = usePersonas();


  const generate = useCallback(
    async (
      resumeContent: string,
      jobDescription: string,
      companyName: string
    ): Promise<CoverLetterResponse | null> => {
      try {
        // Build merged voice profile: persona settings override profile defaults
        const personaPrefs = activePersona?.preferences
        const mergedVoice: UserVoiceProfile | undefined = profileVoice
          ? {
              ...profileVoice,
              // Persona voice overrides (if set, otherwise use profile defaults)
              voice_formality: personaPrefs?.voice_formality ?? profileVoice.voice_formality,
              voice_playfulness: personaPrefs?.voice_playfulness ?? profileVoice.voice_playfulness,
              voice_conciseness: personaPrefs?.voice_conciseness ?? profileVoice.voice_conciseness,
            }
          : undefined

        return (await execute(
          'generate-cover-letter',
          {
            resumeContent,
            jobDescription,
            companyName,
          },
          {
            voiceProfile: mergedVoice,
            taskType: 'cover_letter',
          }
        )) as CoverLetterResponse;
      } catch (err) {
        return null;
      }
    },
    [execute, profileVoice, activePersona]
  );

  return {
    generate,
    loading,
    error,
    retry: () => retry() as Promise<CoverLetterResponse | null>,
  };
}