
// Seniority levels for experience matching
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'director' | 'executive'

// Education levels for qualification matching
export type EducationLevel = 'none' | 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'

// Company size categories
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise'

export type JobRow = {
  id: string
  title: string
  company: string | null
  location: string | null
  employment_type: string | null
  remote_type: string | null
  source_slug: string | null
  external_url: string | null
  posted_date: string | null
  created_at: string
  salary_min: number | null
  salary_max: number | null
  competitiveness_level: string | null
  match_score: number | null
  description?: string | null

  // ATS-aligned fields (added 2024-12-16)
  seniority_level: SeniorityLevel | string | null
  experience_years_min: number | null
  experience_years_max: number | null
  required_skills: string[] | null
  preferred_skills: string[] | null
  education_level: EducationLevel | string | null
  industry: string | null
  company_size: CompanySize | string | null
  probability_estimate?: number | null
  growth_score?: number | null
  hiring_momentum?: number | null
}

export type MatchResult = {
  job_id: string
  job: JobRow
  score: number
  reasons: string[]
}

export type UserMatchPreferences = {
  // Required: core identity
  user_id: string

  // High level strategy for matching / ranking
  strategy_profile?: 'balanced' | 'aggressive' | 'conservative'

  // Core weights the engine uses (0–1 range recommended)
  weight_salary: number
  weight_location: number
  weight_remote: number
  weight_mission: number
  weight_growth: number

  // How to treat location when scoring
  location_mode:
  | 'local_only'
  | 'remote_only'
  | 'remote_or_local'
  | 'relocate_if_high_salary'

  // Salary floors by mode (in the user's primary currency)
  min_salary_local: number | null
  min_salary_remote: number | null
  min_salary_relocate: number | null

  // Optional guardrails for matching / auto-apply
  min_match_score?: number | null
  max_daily_auto_applications?: number | null

  // Optional linking to other entities
  primary_resume_id?: string | null
  career_track_id?: string | null
}

export type ResumeRow = {
  id: string
  user_id: string
  is_primary: boolean
  created_at: string
  updated_at: string
  parsed_text: string | null
  content: string | null
  ats_score?: number | null
  skills_extracted?: string[] | null
}

export type CareerTrack = {
  id: string
  user_id: string
  name: string
  description?: string | null

  // Optional “focus” fields – safe even if DB does not have them yet
  target_titles?: string[] | null
  target_level?: string | null
  target_salary_min?: number | null
  target_salary_max?: number | null
  preferred_locations?: string[] | null
  remote_preference?: string | null

  // Optional link to a specific resume for this track
  primary_resume_id?: string | null

  is_default?: boolean | null
  notes?: string | null

  created_at?: string
  updated_at?: string
}

export type ProfessionalProfile = {
  user_id: string

  headline_raw: string | null
  headline_polished: string | null

  target_roles_raw: string | null
  target_roles: string[] | null

  summary_raw: string | null
  summary_polished: string | null

  top_skills_raw: string | null
  top_skills: string[] | null

  links_raw: string | null
  links: string[] | null

  work_auth_raw: string | null
  needs_sponsorship: boolean | null

  relocate_preference: 'no' | 'yes' | 'depends' | null
  relocate_notes: string | null

  work_types: string[] | null

  earliest_start_raw: string | null

  travel_preference: 'none' | 'some' | 'frequent' | null

  evergreen_why_raw: string | null
  evergreen_why_polished: string | null

  evergreen_strengths_raw: string | null
  evergreen_strengths_polished: string | null

  created_at?: string
  updated_at?: string
}

export type NormalizedJob = {
  id: string                // internal id from jobs table
  source_slug: string       // 'remoteok', 'remotive', 'adzuna', etc
  external_id: string       // id from the source, for dedupe
  title: string
  company: string | null
  location: string | null
  employment_type: string | null
  remote_type: 'remote' | 'hybrid' | 'onsite' | null
  external_url: string | null
  posted_date: string | null
  salary_min: number | null
  salary_max: number | null
  description: string | null
  competitiveness_level: string | null
  probability_estimate?: number | null
}

export type Profile = Record<string, unknown>

export interface LinkedInProfileRow {
  id: string
  user_id: string
  linkedin_url: string
  profile_data: any
  analysis_results: LinkedInAnalysis | null
  created_at: string
  updated_at: string
  is_public?: boolean
  share_token?: string
}

export interface LinkedInAnalysis {
  headline_score: number
  summary_score: number
  experience_score: number
  overall_score: number
  suggestions: {
    section: string
    improvement: string
    reason: string
  }[]
  optimized_headline?: string
  optimized_summary?: string
}

export interface PortfolioAnalysisRow {
  id: string
  user_id: string
  portfolio_url: string
  analysis_results: PortfolioAnalysis | null
  created_at: string
  updated_at: string
  is_public?: boolean
  share_token?: string
}

export interface PortfolioAnalysis {
  visual_score: number
  usability_score: number
  content_score: number
  overall_score: number
  suggestions: {
    category: string
    improvement: string
    impact: 'high' | 'medium' | 'low'
  }[]
  perceived_seniority: string
  suggested_tagline?: string
}

export interface InterviewQuestion {
  id: string
  text: string
  type: 'behavioral' | 'technical' | 'situational'
  sample_answer?: string
  talking_points?: string[]
}

export interface InterviewPrepRow {
  id: string
  user_id: string
  application_id?: string
  position: string
  company: string
  interview_date?: string
  interview_type?: string
  questions: InterviewQuestion[]
  ai_feedback?: any
  created_at: string
  updated_at: string
}

export interface InterviewSessionRow {
  id: string
  user_id: string
  job_id?: string
  interview_prep_id?: string
  question: string
  user_answer: string
  feedback: string | null
  score: number | null
  created_at: string
}

export interface InterviewPracticeSession {
  id: string
  user_id: string
  interview_prep_id?: string
  application_id?: string
  job_id?: string
  status: 'active' | 'completed' | 'cancelled'
  questions: InterviewQuestion[]
  practice_data: {
    question: string
    response: string
    feedback: any
    score: number
    timestamp: string
  }[]
  overall_feedback?: any
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'job_alert'
  link?: string
  is_read: boolean
  created_at: string
  metadata?: {
    score?: number
    isHighestEver?: boolean
    isFresh?: boolean
    company?: string
    matchReasons?: string[]
  }
}