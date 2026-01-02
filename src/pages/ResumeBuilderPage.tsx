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

// UI components
import { IconName } from '../components/ui/Icon'

// Hooks and utilities
import { copy } from '../lib/copy'
import { useResumeBuilder } from '../hooks/useResumeBuilder'
import { useResumeAnalysis } from '../hooks/useResumeAnalysis'
import type { ResumeDraft } from '../types/resume-builder.types'
import '../styles/resume-builder.css'
import '../styles/tailoring.css'

// Tailoring feature
import { generateTailoringSuggestions } from '../services/tailoringService'
import { TailoringOverlay } from '../components/ResumeBuilder/TailoringOverlay'
import type { TailoringContext, TailoringSuggestion } from '../types/tailoring'

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
}[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'summary', label: 'Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'projects', label: 'Projects' },
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

  // Tailoring state
  const jobId = searchParams.get('jobId')
  const [tailoringContext, setTailoringContext] = useState<TailoringContext | null>(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showTailoringOverlay, setShowTailoringOverlay] = useState(true)

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

  // Load tailoring suggestions when jobId is present
  React.useEffect(() => {
    if (jobId && resumeId) {
      setIsLoadingSuggestions(true)
      generateTailoringSuggestions(resumeId, jobId)
        .then((context) => {
          setTailoringContext(context)
          if (context.suggestions.length > 0) {
            setShowTailoringOverlay(true)
          }
        })
        .catch((error) => {
          console.error('Failed to load tailoring suggestions:', error)
        })
        .finally(() => setIsLoadingSuggestions(false))
    } else {
      setTailoringContext(null)
    }
  }, [jobId, resumeId])

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

  // Handle accepting a tailoring suggestion
  const handleAcceptSuggestion = useCallback((suggestion: TailoringSuggestion) => {
    // Update the experience bullet with suggested text
    // Note: This assumes bulletId format is "{experienceId}-{index}"
    const [expId, bulletIndex] = suggestion.bulletId.split('-')
    const bulletIdx = parseInt(bulletIndex, 10)

    const nextExperience = draft.experience.map((exp) => {
      if (exp.id !== expId) {
        return exp
      }

      // Split bullets by line breaks or semicolons
      const bullets = exp.bullets.split(/[\n;]/).map((b: string) => b.trim()).filter((b: string) => b)

      // Replace the specific bullet
      if (bulletIdx >= 0 && bulletIdx < bullets.length) {
        bullets[bulletIdx] = suggestion.suggestedText
      }

      return {
        ...exp,
        bullets: bullets.join('\n'),
      }
    })

    setExperience(nextExperience)

    // Remove suggestion from list
    setTailoringContext((prev) =>
      prev
        ? {
            ...prev,
            suggestions: prev.suggestions.filter((s) => s.id !== suggestion.id),
          }
        : null
    )
  }, [draft.experience, setExperience])

  // Handle dismissing a suggestion
  const handleDismissSuggestion = useCallback((suggestionId: string) => {
    setTailoringContext((prev) =>
      prev
        ? {
            ...prev,
            suggestions: prev.suggestions.filter((s) => s.id !== suggestionId),
          }
        : null
    )
  }, [])

  // Handle clearing job context
  const handleClearJobContext = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete('jobId')
    setSearchParams(next)
    setTailoringContext(null)
    setShowTailoringOverlay(false)
  }, [searchParams, setSearchParams])

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

          {/* Job Context Banner */}
          {tailoringContext && (
            <div style={{
              padding: '12px 20px',
              background: 'var(--color-bg-alt)',
              borderBottom: '1px solid var(--color-graphite-faint)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <strong style={{ color: 'var(--color-accent)' }}>
                  Tailoring for:
                </strong>{' '}
                <span style={{ color: 'var(--color-ink)' }}>
                  {tailoringContext.jobTitle}
                </span>
                <span className="muted"> at {tailoringContext.company}</span>
              </div>
              <button
                onClick={handleClearJobContext}
                className="link-accent"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Clear job context
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoadingSuggestions && (
            <div style={{
              padding: '12px 20px',
              background: 'var(--color-accent-glow)',
              borderBottom: '1px solid var(--color-accent)',
              color: 'var(--color-accent)',
              fontSize: '14px',
            }}>
              ✨ Analyzing job requirements and generating suggestions...
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

          {/* Tailoring Overlay */}
          {tailoringContext && tailoringContext.suggestions.length > 0 && showTailoringOverlay && (
            <TailoringOverlay
              context={tailoringContext}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissSuggestion={handleDismissSuggestion}
              onClose={() => setShowTailoringOverlay(false)}
            />
          )}

          {/* Toggle button when overlay hidden */}
          {tailoringContext && tailoringContext.suggestions.length > 0 && !showTailoringOverlay && (
            <button
              onClick={() => setShowTailoringOverlay(true)}
              className="floating-suggestions-button"
            >
              💡 {tailoringContext.suggestions.length} Suggestions
            </button>
          )}

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
