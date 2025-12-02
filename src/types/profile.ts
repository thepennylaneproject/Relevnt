// src/types/profile.ts

export interface ParsedExperienceItem {
  title: string;
  company: string;
  location?: string;
  startDate?: string;  // ISO date string or free-form
  endDate?: string;    // ISO date or free-form
  bullets: string[];
}

export interface ParsedEducationItem {
  institution: string;
  credential: string;
  startDate?: string;
  endDate?: string;
}

export interface ParsedCertification {
  name: string;
  issuer?: string;
  year?: string;
}

export interface ParsedProject {
  name: string;
  role?: string;
  bullets: string[];
  impact?: string;
}

export type LanguageProficiency = 'basic' | 'conversational' | 'fluent' | 'native';

export interface ParsedLanguage {
  name: string;
  level?: LanguageProficiency;
}

export interface ParsedResumeFields {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];

  experience?: ParsedExperienceItem[];
  education?: ParsedEducationItem[];

  certifications?: ParsedCertification[];
  projects?: ParsedProject[];
  languages?: ParsedLanguage[];

  keywords?: string[];
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  title?: string;
  parsed_text?: string | null;
  parsed_fields?: ParsedResumeFields | null;
  raw_text?: string | null;
  created_at: string;
  updated_at?: string;
  // other columns...
}

export interface Profile {
  id: string;
  user_id: string;

  name: string;
  headline?: string;
  target_titles?: string[];
  target_industries?: string[];

  primary_resume_id?: string | null;

  active_experience_ids?: string[];
  active_project_ids?: string[];
  active_certification_ids?: string[];
  active_language_ids?: string[];

  profile_keywords?: string[];

  created_at: string;
  updated_at: string;
}