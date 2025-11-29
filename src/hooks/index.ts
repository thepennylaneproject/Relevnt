/**
 * ============================================================================
 * HOOKS INDEX - Updated Export Point
 * ============================================================================
 * 
 * 🎓 LEARNING NOTE: This single file is the entry point for all hooks.
 * Components import from here, not directly from individual hook files.
 * 
 * Benefit: If we move a hook file, we only update imports in ONE place.
 * ============================================================================
 */

// ============================================================================
// BASE HOOK (all AI tasks use this)
// ============================================================================

export { useAITask, type UseAITaskReturn } from './useAITask';

// ============================================================================
// REFACTORED AI TASK HOOKS
// ============================================================================

// Resume Operations
export { useAnalyzeResume, type UseAnalyzeResumeReturn } from './useAnalyzeResume';
export { useExtractResume, type UseExtractResumeReturn } from './useExtractResume';
export { useOptimizeResume, type UseOptimizeResumeReturn } from './useOptimizeResume';
export { useRefineBulletPoints, type UseRefineBulletPointsReturn } from './useRefineBulletPoints';

// Job Operations
export { useAnalyzeJobDescription, type UseAnalyzeJobDescriptionReturn } from './useAnalyzeJobDescription';
export { useExtractJobs, type UseExtractJobsReturn } from './useExtractJobs';
export { default as useMatchJobs } from './useMatchJobs'
export type { UseMatchJobsResult } from './useMatchJobs'
// Career Operations
export { useAnalyzeSkillsGap, type UseAnalyzeSkillsGapReturn } from './useAnalyzeSkillsGap';
export { useGenerateCoverLetter, type UseGenerateCoverLetterReturn } from './useGenerateCoverLetter';
export { usePrepareInterview, type UsePrepareInterviewReturn } from './usePrepareInterview';
export { useProfessionalProfile } from './useProfessionalProfile'
// ============================================================================
// DATABASE HOOKS
// ============================================================================

export { useResumes, type UseResumesReturn, type Resume } from './useResumes';
export {
  useJobs,
  type UseJobsReturn,
  type UseJobsOptions,
  type Job
} from './useJobs';
export {
  useApplications,
  type UseApplicationsReturn,
  type UseApplicationsOptions,
  type Application,
  type ApplicationStatus
} from './useApplications';
export {
  useCareerProfile,
  type UseCareerProfileReturn,
  type CareerProfile,
  type VoiceProfile,
  type BulletPoint
} from './useCareerProfile';
export {
  useJobPreferences,
  type UseJobPreferencesReturn,
} from './useJobPreferences'
export { useJobSources } from './useJobSources'
// ============================================================================
// AUTH HOOKS (unchanged)
// ============================================================================

export { useAuth } from './useAuth';

// ============================================================================
// THEME/COLOR HOOKS
// ============================================================================

export {
  useRelevntColors,
  useTierColors,
  useStatusColors,
  type RelevntColors
} from './useRelevntColors';
export { useProfileSettings, type ProfileSettings, type ThemePreference, type LayoutDensity } from './useProfileSettings';
export { useSkillInsights } from './useSkillInsights';
export { useSkillGaps, type SkillGap } from './useSkillGaps';
export { useLearningPaths, type LearningPath } from './useLearningPaths';
export { useLearningCourses, type LearningCourse } from './useLearningCourses';
export * from './useAITask'
export * from './useResumes'
export * from './useExtractResume'
export * from './useAnalyzeResume'
export * from './useOptimizeResume'
// ...existing exports above...
// src/hooks/index.ts

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// All AI response types
export type {
    ResumeExtractionResponse,
    ResumeAnalysisResponse,
    ResumeOptimizationResponse,
    BulletPointRefinementResponse,
    JobAnalysisResponse,
    JobExtractionResponse,
    JobMatchingResponse,
    JobRankingResponse,
    SkillsGapResponse,
    CoverLetterResponse,
    InterviewPrepResponse,
    UsageStats,
    AIError,
    TaskName,
} from '../types/ai-responses.types';
export type { ProfessionalProfile } from '../shared/types'
// Configuration
export { TIER_LIMITS, getTaskLimit } from '../types/ai-responses.types';
export type { UserTierForAI } from '../types/ai-responses.types';
