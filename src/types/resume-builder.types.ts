// src/types/resume-builder.types.ts
export interface ResumeContact {
  fullName: string
  email: string
  phone: string
  location: string
  headline?: string
  links?: { label: string; url: string }[]
}

export interface ResumeSummary {
  headline?: string
  summary: string
}

export interface ResumeSkillGroup {
  label: string  // "Core Skills", "Tools", "Leadership", etc
  skills: string[]
}

export interface ResumeExperienceItem {
  id: string
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  bullets: string
}

export interface ResumeEducationItem {
  id: string
  institution: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  location?: string
}

export interface ResumeCertificationItem {
  id: string
  name: string
  issuer?: string
  year?: string
  link?: string
}

export interface ResumeProjectItem {
  id: string
  name: string
  description: string
  link?: string
  techStack?: string[]
  role?: string
}

export interface ResumeDraft {
  id?: string
  contact: ResumeContact
  summary: ResumeSummary
  skillGroups: ResumeSkillGroup[]
  experience: ResumeExperienceItem[]
  education: ResumeEducationItem[]
  certifications: ResumeCertificationItem[]
  projects: ResumeProjectItem[]
  lastUpdatedAt?: string
}