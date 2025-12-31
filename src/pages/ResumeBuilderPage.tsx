// src/pages/ResumeBuilderPage.tsx
// Premium resume builder with integrated AI coaching, ATS scoring, and job targeting

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// Layout components
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Button } from '../components/ui/Button'

// Resume section editors
import { ContactSection } from '../components/ResumeBuilder/ContactSection'
import { SummarySection } from '../components/ResumeBuilder/SummarySection'
import { SkillsSection } from '../components/ResumeBuilder/SkillsSection'
import { ExperienceSection } from '../components/ResumeBuilder/ExperienceSection'
import { EducationSection } from '../components/ResumeBuilder/EducationSection'
import { CertificationsSection } from '../components/ResumeBuilder/CertificationsSection'
import { ProjectsSection } from '../components/ResumeBuilder/ProjectsSection'

// Resume tools
import { ResumePreview } from '../components/ResumeBuilder/ResumePreview'
import { ResumeUpload } from '../components/ResumeBuilder/ResumeUpload'
import { ResumeExport } from '../components/ResumeBuilder/ResumeExport'

// AI and Analysis components
import { AICoachSidebar } from '../components/ResumeBuilder/AICoachSidebar'
import { ATSScoreCard } from '../components/ResumeBuilder/ATSScoreCard'
import { ATSSuggestions } from '../components/ResumeBuilder/ATSSuggestions'
import { JobTargetingPanel } from '../components/ResumeBuilder/JobTargetingPanel'
import { NewResumeWizard } from '../components/ResumeBuilder/NewResumeWizard'
import { ResumePerformancePanel } from '../components/ResumeBuilder/ResumePerformancePanel'

// UI components
import { IconName } from '../components/ui/Icon'
import { ResumeIconName } from '../components/ui/HandDrawnIcon'

// Hooks and utilities
import { copy } from '../lib/copy'
import { useResumeBuilder } from '../hooks/useResumeBuilder'
import { useResumeAnalysis } from '../hooks/useResumeAnalysis'
import type { ResumeDraft } from '../types/resume-builder.types'
import '../styles/resume-builder.css'

// ============================================================================
// TYPES
// ============================================================================

type ActiveSection =
  | 'contact'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'projects'

type ActivePanel = 'preview' | 'ats' | 'targeting'

const SECTION_META: {
  id: ActiveSection
  label: string
  resumeIconName: ResumeIconName
}[] = [
  { id: 'contact', label: 'Contact', resumeIconName: 'contact' },
  { id: 'summary', label: 'Summary', resumeIconName: 'summary' },
  { id: 'skills', label: 'Skills', resumeIconName: 'skills' },
  { id: 'experience', label: 'Experience', resumeIconName: 'experience' },
  { id: 'education', label: 'Education', resumeIconName: 'education' },
  { id: 'certifications', label: 'Certifications', resumeIconName: 'certifications' },
  { id: 'projects', label: 'Projects', resumeIconName: 'projects' },
]

// ============================================================================
// HELPER: Convert draft to text for job targeting
// ============================================================================

function draftToText(draft: ResumeDraft): string {
  const parts: string[] = []

  if (draft.contact.fullName) parts.push(draft.contact.fullName)
  if (draft.contact.headline) parts.push(draft.contact.headline)
  if (draft.summary.summary) parts.push(draft.summary.summary)

  draft.skillGroups.forEach(g => {
    parts.push(g.skills.join(' '))
  })

  draft.experience.forEach(e => {
    parts.push(`${e.title} ${e.company} ${e.bullets}`)
  })

  return parts.join(' ')
}

// ============================================================================
// COMPONENT
// ============================================================================

type ResumeBuilderPageProps = {
  embedded?: boolean
}

const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({ embedded = false }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const resumeIdFromUrl = searchParams.get('id') || undefined

  // UI State
  const [activeSection, setActiveSection] = useState<ActiveSection>('contact')
  const [activePanel, setActivePanel] = useState<ActivePanel>('preview')
  const [showCoach, setShowCoach] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  // Resume data and autosave
  const {
    resumeId,
    draft,
    setDraft,
    updateContact,
    updateSummary,
    setSkillGroups,
    setExperience,
    setEducation,
    setCertifications,
    setProjects,
    status,
    isDirty,
    lastSavedAt,
    manualSave,
  } = useResumeBuilder({ resumeId: resumeIdFromUrl })

  // Keep URL in sync once a draft is created
  React.useEffect(() => {
    if (resumeId && resumeId !== resumeIdFromUrl) {
      const next = new URLSearchParams(searchParams)
      next.set('id', resumeId)
      setSearchParams(next, { replace: true })
    }
  }, [resumeId, resumeIdFromUrl, searchParams, setSearchParams])

  // ATS Analysis
  const { analysis, analyze, loading: analyzing } = useResumeAnalysis()

  // Format save status
  const saveStatusText = useMemo(() => {
    if (status === 'saving') return 'Saving...'
    if (status === 'loading') return 'Loading...'
    if (status === 'error') return 'Error saving'
    if (isDirty) return 'Unsaved changes'
    if (lastSavedAt) {
      const date = new Date(lastSavedAt)
      const now = new Date()
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
      if (diffSec < 5) return 'Saved'
      if (diffSec < 60) return `Saved ${diffSec}s ago`
      if (diffSec < 3600) return `Saved ${Math.floor(diffSec / 60)}m ago`
      return `Saved at ${date.toLocaleTimeString()}`
    }
    return ''
  }, [status, isDirty, lastSavedAt])

  // Check if resume has content
  const hasContent = useMemo(() => {
    return !!(
      draft.contact.fullName ||
      draft.summary.summary ||
      draft.skillGroups.length > 0 ||
      draft.experience.length > 0
    )
  }, [draft])

  // Handle uploaded/parsed resume data
  const handleUploadComplete = useCallback((parsedData: Partial<ResumeDraft>) => {
    console.log('ResumeBuilderPage received upload data:', parsedData)

    // Perform a single atomic update to ensure all data is applied correctly
    setDraft((prev) => {
      // Merge contact and summary carefully to preserve existing fields if not overwritten
      const contact = parsedData.contact
        ? { ...prev.contact, ...parsedData.contact }
        : prev.contact

      const summary = parsedData.summary
        ? { ...prev.summary, ...parsedData.summary }
        : prev.summary

      // For arrays (skills, experience, etc), we typically replace them if new data is provided
      // or keep existing if not.

      return {
        ...prev,
        contact,
        summary,
        skillGroups: parsedData.skillGroups || prev.skillGroups,
        experience: parsedData.experience || prev.experience,
        education: parsedData.education || prev.education,
        certifications: parsedData.certifications || prev.certifications,
        projects: parsedData.projects || prev.projects,
      }
    })
  }, [setDraft])

  // Handle wizard completion
  const handleWizardComplete = useCallback((wizardDraft: Partial<ResumeDraft>) => {
    handleUploadComplete(wizardDraft)
    setShowWizard(false)
  }, [handleUploadComplete])

  // Run ATS analysis
  const handleAnalyze = useCallback(() => {
    analyze(draft)
    setActivePanel('ats')
  }, [analyze, draft])

  // Resume text for job targeting
  const resumeText = useMemo(() => draftToText(draft), [draft])

  const content = (
    <Container maxWidth="xl" padding="md">
      <div className="tab-pane resume-builder active">
          {!embedded && (
            <div className="builder-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2>Build your resume</h2>
                  <p className="text-xs muted">
                    {hasContent ? 'Edit and optimize your resume' : 'Create a professional resume'}
                  </p>
                </div>

                <div className="action-group">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowWizard(true)}
                  >
                    New Resume
                  </Button>

                  <ResumeUpload onUploadComplete={handleUploadComplete} />

                  {hasContent && <ResumeExport draft={draft} />}

                  {isDirty && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={manualSave}
                      disabled={status === 'saving'}
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>

              <div className="builder-tabs">
                {SECTION_META.map((section) => {
                  const isActive = section.id === activeSection
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`builder-tab ${isActive ? 'active' : ''}`}
                    >
                      {section.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {embedded && (
             <div className="builder-header">
                <div className="builder-tabs">
                  {SECTION_META.map((section) => {
                    const isActive = section.id === activeSection
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`builder-tab ${isActive ? 'active' : ''}`}
                      >
                        {section.label}
                      </button>
                    )
                  })}
                </div>
             </div>
          )}

          <div className="builder-container">
            <div className="builder-form">
              <div className="resume-editor-content">
                {activeSection === 'contact' && (
                  <ContactSection contact={draft.contact} onChange={updateContact} />
                )}
                {activeSection === 'summary' && (
                  <SummarySection summary={draft.summary} onChange={updateSummary} />
                )}
                {activeSection === 'skills' && (
                  <SkillsSection id="skills" skillGroups={draft.skillGroups} onChange={setSkillGroups} />
                )}
                {activeSection === 'experience' && (
                  <ExperienceSection id="experience" items={draft.experience} onChange={setExperience} />
                )}
                {activeSection === 'education' && (
                  <EducationSection id="education" items={draft.education} onChange={setEducation} />
                )}
                {activeSection === 'certifications' && (
                  <CertificationsSection id="certifications" items={draft.certifications} onChange={setCertifications} />
                )}
                {activeSection === 'projects' && (
                  <ProjectsSection id="projects" items={draft.projects} onChange={setProjects} />
                )}
              </div>
            </div>

            <div className="builder-preview">
              <div className="panel-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Button
                  type="button"
                  size="sm"
                  variant={activePanel === 'preview' ? 'primary' : 'ghost'}
                  onClick={() => setActivePanel('preview')}
                >
                  Preview
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activePanel === 'ats' ? 'primary' : 'ghost'}
                  onClick={() => setActivePanel('ats')}
                >
                  ATS Score
                  {analysis && (
                    <span style={{ marginLeft: '4px', opacity: 0.8 }}>{analysis.overallScore}</span>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activePanel === 'targeting' ? 'primary' : 'ghost'}
                  onClick={() => setActivePanel('targeting')}
                >
                  Job Match
                </Button>
              </div>

              <div className="at-panel-content">
                {activePanel === 'preview' && (
                  <ResumePreview draft={draft} />
                )}

                {activePanel === 'ats' && (
                  <div className="ats-panel">
                    {resumeId && (
                      <ResumePerformancePanel resumeId={resumeId} />
                    )}
                    <ATSScoreCard
                      analysis={analysis}
                      loading={analyzing}
                      onAnalyze={handleAnalyze}
                    />
                    {analysis && analysis.suggestions.length > 0 && (
                      <ATSSuggestions suggestions={analysis.suggestions} />
                    )}
                  </div>
                )}

                {activePanel === 'targeting' && (
                  <div className="targeting-panel">
                    <JobTargetingPanel resumeText={resumeText} />
                    <div className="card-info" style={{ marginTop: '16px' }}>
                      <p className="text-xs muted">
                        Paste a job description above to see how well your resume matches
                        and get tailoring suggestions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wizard Modal */}
          {showWizard && (
            <NewResumeWizard
              onCancel={() => setShowWizard(false)}
              onComplete={handleWizardComplete}
            />
          )}
      </div>
    </Container>
  )

  if (embedded) return content

  return <PageBackground>{content}</PageBackground>
}

export default ResumeBuilderPage
