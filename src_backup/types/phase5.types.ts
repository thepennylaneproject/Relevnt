/**
 * ============================================================================
 * PHASE 5 TYPE DEFINITIONS
 * ============================================================================
 * ðŸŽ" PURPOSE: Type definitions for all Phase 5 features
 * 
 * This file contains TypeScript interfaces and types for:
 * - Resume analysis results
 * - Job data structures
 * - Application tracking
 * - Interview preparation
 * 
 * ðŸŽ" PATTERN: Keeping types in a central file makes them easy to
 * maintain and ensures consistency across hooks and components
 * ============================================================================
 */

// ============================================================================
// RESUME TYPES
// ============================================================================

/**
 * Resume metadata - stored in database
 */
export interface Resume {
  id: string
  user_id: string
  title: string
  is_default: boolean
  version_number: number
  ats_score: number | null
  created_at: string
  updated_at: string
}

/**
 * Complete resume data - includes full content
 */
export interface ResumeComplete extends Resume {
  personal_info: PersonalInfo
  summary: string | null
  work_experience: WorkExperience[]
  education: Education[]
  skills: string[]
  certifications: Certification[]
  projects: Project[]
  languages: Language[]
  ats_suggestions: ATSSuggestion[]
  keywords: string[]
}

/**
 * Resume analysis result from AI
 */
export interface ResumeAnalysis {
  ats_score: number
  overall_assessment: 'Excellent' | 'Good' | 'Needs Improvement'
  strengths: string[]
  weaknesses: string[]
  suggestions: ResumeSuggestion[]
  keywords_found: string[]
  missing_keywords: string[]
  keyword_density: KeywordDensity[]
  formatting_issues: string[]
  content_recommendations: string[]
}

/**
 * Individual resume suggestion
 */
export interface ResumeSuggestion {
  category: 'Format' | 'Keywords' | 'Content' | 'Structure' | 'Clarity'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  reason: string
  example?: string
}

/**
 * Personal information section
 */
export interface PersonalInfo {
  full_name: string
  email: string
  phone: string
  location?: string
  linkedin_url?: string
  portfolio_url?: string
  github_url?: string
}

/**
 * Work experience entry
 */
export interface WorkExperience {
  id: string
  company: string
  position: string
  location?: string
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string
  achievements: string[]
  skills_used: string[]
}

/**
 * Education entry
 */
export interface Education {
  id: string
  school: string
  degree: string
  field_of_study: string
  start_date: string
  end_date: string | null
  is_current: boolean
  gpa?: number
  activities?: string
  description?: string
}

/**
 * Certification entry
 */
export interface Certification {
  id: string
  name: string
  issuer: string
  issue_date: string
  expiration_date?: string
  credential_id?: string
  credential_url?: string
}

/**
 * Project entry
 */
export interface Project {
  id: string
  title: string
  description: string
  technologies: string[]
  start_date: string
  end_date?: string
  url?: string
  repository_url?: string
}

/**
 * Language proficiency
 */
export interface Language {
  id: string
  name: string
  proficiency: 'Elementary' | 'Limited Working' | 'Professional Working' | 'Full Professional' | 'Native'
}

/**
 * ATS analysis suggestion
 */
export interface ATSSuggestion {
  issue: string
  severity: 'critical' | 'warning' | 'info'
  suggestion: string
}

/**
 * Keyword density for analysis
 */
export interface KeywordDensity {
  keyword: string
  percentage: number
  count: number
}

// ============================================================================
// JOB TYPES
// ============================================================================

/**
 * Job posting metadata
 */
export interface Job {
  id: string
  user_id: string
  title: string
  company: string
  location: string | null
  job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Freelance' | null
  salary_range: string | null
  description: string | null
  match_score: number | null
  status: 'Saved' | 'Applied' | 'Interviewing' | 'Rejected' | 'Offered'
  posted_date: string | null
  saved_date: string
  created_at: string
  updated_at: string
}

/**
 * Complete job with parsed data
 */
export interface JobComplete extends Job {
  requirements: JobRequirement[]
  responsibilities: string[]
  benefits: string[]
  skills_required: string[]
  experience_required: string | null
  education_required: string | null
  external_job_id: string | null
  external_source: string | null
  external_url: string | null
  company_logo_url: string | null
  match_reasons: MatchReason[]
}

/**
 * Job requirement
 */
export interface JobRequirement {
  requirement: string
  required: boolean
  nice_to_have: boolean
  matched_with_user: boolean
}

/**
 * Why a job matches with a user
 */
export interface MatchReason {
  reason: string
  score: number
  supported_by: string[]
}

/**
 * Job extraction result from AI
 */
export interface JobExtractionResult {
  title: string
  company: string
  location: string | null
  job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Freelance' | null
  salary_range: string | null
  description: string
  requirements: JobRequirement[]
  responsibilities: string[]
  benefits: string[]
  skills_required: string[]
  experience_required: string | null
  education_required: string | null
}

// ============================================================================
// APPLICATION TYPES
// ============================================================================

/**
 * Job application tracking
 */
export interface Application {
  id: string
  user_id: string
  job_id: string | null
  resume_id: string | null
  company: string
  position: string
  location: string | null
  status: 'Applied' | 'Reviewing' | 'Interview' | 'Offer' | 'Rejected' | 'Archived'
  cover_letter: string | null
  notes: string | null
  salary_expectation: string | null
  recruiter_name: string | null
  recruiter_email: string | null
  recruiter_phone: string | null
  applied_date: string
  follow_up_date: string | null
  interview_date: string | null
  offer_date: string | null
  response_deadline: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// INTERVIEW PREP TYPES
// ============================================================================

/**
 * Interview question
 */
export interface InterviewQuestion {
  id: string
  question: string
  category: 'Behavioral' | 'Technical' | 'Problem-Solving' | 'Situational' | 'Company-Specific'
  difficulty: 'Entry-Level' | 'Mid-Level' | 'Senior-Level'
  suggested_answer: string
  tips: string[]
  follow_up_questions?: string[]
}

/**
 * Practice session
 */
export interface PracticeSession {
  id: string
  user_id: string
  question_id: string
  user_answer: string
  ai_feedback: string
  score: number
  created_at: string
}

/**
 * Interview prep result from AI
 */
export interface InterviewPrepResult {
  questions: InterviewQuestion[]
  tips: string[]
  suggested_preparation_areas: string[]
  success_probability_estimate: number
}

// ============================================================================
// USAGE TRACKING TYPES
// ============================================================================

/**
 * Track AI usage for billing and limits
 */
export interface AIUsageRecord {
  id: string
  user_id: string
  feature: 'resume-analysis' | 'job-extraction' | 'job-ranking' | 'interview-prep' | 'cover-letter'
  resume_id?: string
  job_id?: string
  cost: number
  provider: string
  model: string
  tokens_used: number
  created_at: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 * 
 * ðŸŽ" PATTERN: All AI API endpoints return this format
 */
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  cost: number
  provider: string
  model: string
  tokens_used: number
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Async operation states (for loading/error handling)
 * 
 * ðŸŽ" PATTERN: Use this for any async operation in the UI
 */
export type AsyncState<T> = 
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: string }

/**
 * Helper type for pagination
 */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/**
 * Helper type for sorting
 */
export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Resume upload form state
 */
export interface ResumeUploadFormState {
  title: string
  file: File | null
  isSubmitting: boolean
  error: string | null
}

/**
 * Job input form state
 */
export interface JobInputFormState {
  title: string
  company: string
  description: string
  isSubmitting: boolean
  error: string | null
}

/**
 * Application form state
 */
export interface ApplicationFormState {
  company: string
  position: string
  location: string
  status: Application['status']
  appliedDate: string
  isSubmitting: boolean
  error: string | null
}
