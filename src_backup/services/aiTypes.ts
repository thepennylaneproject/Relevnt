/**
 * ============================================================================
 * RELEVNT AI SYSTEM - TYPE DEFINITIONS
 * ============================================================================
 * Complete type definitions for all AI tasks and responses
 * ============================================================================
 */

// ============================================================================
// GENERIC RESPONSE WRAPPER - MUST BE USED BY ALL ENDPOINTS
// ============================================================================

/**
 * ✅ Base response data interface - all responses must extend this
 */
export interface AIResponseData {
  success: boolean;
  error?: string;
}

/**
 * ✅ Generic AI Response wrapper used by useAI hook
 */
export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
  };
  timestamp?: string;
}

// ============================================================================
// TASK 1: EXTRACT JOBS
// ============================================================================

export interface JobData {
  id: string;
  title: string;
  company: string;
  description: string;
  salary?: string;
  location?: string;
  requirements?: string[];
}

export interface ExtractJobsData {
  jobs: JobData[];
}

export interface ExtractJobsResponse extends AIResponseData {
  data?: ExtractJobsData;
}

// ============================================================================
// TASK 2: RANK JOBS
// ============================================================================

export interface RankJobsData {
  score: number;
  analysis: string;
  strengths?: string[];
  gaps?: string[];
}

export interface RankJobsResponse extends AIResponseData {
  data?: RankJobsData;
}

// ============================================================================
// TASK 3: GENERATE COVER LETTER
// ============================================================================

export interface GenerateCoverLetterData {
  letter: string;
}

export interface GenerateCoverLetterResponse extends AIResponseData {
  data?: GenerateCoverLetterData;
}

// ============================================================================
// TASK 4: OPTIMIZE RESUME
// ============================================================================

export interface OptimizeResumeData {
  optimizedResume: string;
  score: number;
  suggestions: string[];
}

export interface OptimizeResumeResponse extends AIResponseData {
  data?: OptimizeResumeData;
}

// ============================================================================
// TASK 5: MATCH JOBS
// ============================================================================

export interface MatchJobsData {
  matches: JobData[];
}

export interface MatchJobsResponse extends AIResponseData {
  data?: MatchJobsData;
}

// ============================================================================
// TASK 6: ANALYZE SKILLS GAP
// ============================================================================

export interface AnalyzeSkillsGapData {
  gaps: string[];
  recommendations: string[];
}

export interface AnalyzeSkillsGapResponse extends AIResponseData {
  data?: AnalyzeSkillsGapData;
}

// ============================================================================
// TASK 7: PREPARE INTERVIEW
// ============================================================================

export interface PrepareInterviewData {
  preparation: {
    questions: string[];
    tips?: string[];
    focusAreas?: string[];
  };
}

export interface PrepareInterviewResponse extends AIResponseData {
  data?: PrepareInterviewData;
}

// ============================================================================
// TASK 8: EXTRACT RESUME
// ============================================================================

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    year: string;
  }>;
}

export interface ExtractResumeData {
  resume: ResumeData;
}

export interface ExtractResumeResponse extends AIResponseData {
  data?: ExtractResumeData;
}

// ============================================================================
// TASK 9: REFINE BULLET POINTS
// ============================================================================

export interface RefineBulletPointsData {
  refined: Array<{
    original: string;
    improved: string;
  }>;
}

export interface RefineBulletPointsResponse extends AIResponseData {
  data?: RefineBulletPointsData;
}

// ============================================================================
// TASK 10: ANALYZE JOB DESCRIPTION
// ============================================================================

export interface AnalyzeJobDescriptionData {
  analysis: {
    requirements: {
      required: string[];
      nice_to_have: string[];
    };
    responsibilities?: string[];
    benefits?: string[];
  };
}

export interface AnalyzeJobDescriptionResponse extends AIResponseData {
  data?: AnalyzeJobDescriptionData;
}

// ============================================================================
// HOOK STATE & CONFIG TYPES
// ============================================================================

export interface AIHookState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AIHookConfig {
  taskName?: string;
  options?: Record<string, unknown>;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export const AI_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;