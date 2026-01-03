// src/pages/ResumeBuilderPage.tsx
// Premium resume builder with integrated AI coaching, ATS scoring, and job targeting

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/ui/Card'
import { Heading, Text } from '../components/ui/Typography'
import { Badge } from '../components/ui/Badge'
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
    <div className="space-y-12">
      {/* Editorial Header Section (embedded mode handles its own header logic often via the parent, 
          but we ensure the builder itself uses canonical patterns) */}
      {!embedded && (
        <header className="flex justify-between items-end border-b border-border/30 pb-6">
          <div>
            <Heading level={2}>{draft.contact.fullName || 'Untitled Draft'}</Heading>
            <Text muted className="uppercase tracking-widest text-[10px] font-bold mt-1">
              {hasContent ? 'Modify and refine active record' : 'Initialize professional record'}
            </Text>
          </div>
          <div className="flex gap-8 items-center">
            {saveStatusText && (
              <Text muted className="text-[10px] uppercase tracking-widest font-bold tabular-nums">
                {saveStatusText}
              </Text>
            )}
            <div className="flex gap-4">
              <button 
                className="text-[10px] uppercase tracking-widest font-bold text-accent border-b border-accent/20 hover:border-accent transition-colors"
                onClick={() => setShowWizard(true)}
              >
                Reset Record
              </button>
              {hasContent && <ResumeExport draft={draft} />}
              {isDirty && (
                <button 
                  className="text-[10px] uppercase tracking-widest font-bold text-text border-b border-text/20 hover:border-text transition-colors"
                  onClick={manualSave}
                  disabled={status === 'saving'}
                >
                  Commit Changes
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Navigation Triggers - Internal Sections */}
      <div className="flex flex-wrap gap-8 border-b border-border/10 pb-4">
        {SECTION_META.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
              activeSection === section.id ? 'text-accent border-b border-accent pb-4 -mb-[17px]' : 'text-text-muted hover:text-text'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Job Context Integration */}
      {tailoringContext && (
        <div className="bg-black/[0.02] border border-border px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge variant="neutral">Tailoring Active</Badge>
            <Text className="text-xs">
              Optimizing for <span className="font-bold">{tailoringContext.jobTitle}</span> <span className="text-text-muted">at {tailoringContext.company}</span>
            </Text>
          </div>
          <button
            onClick={handleClearJobContext}
            className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
          >
            Reset Job Context
          </button>
        </div>
      )}

      {isLoadingSuggestions && (
        <Text className="italic text-accent animate-pulse px-8 text-xs">
          ✨ Analyzing market fit and generating suggestions...
        </Text>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Editor Pane */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="min-h-[500px]">
            <header className="mb-8 border-b border-border/30 pb-4">
              <Heading level={4} className="uppercase tracking-widest text-[10px] text-text-muted">Editor View</Heading>
            </header>
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
          </Card>
        </div>

        {/* Intelligence / Preview Pane */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex gap-10 border-b border-border/30 pb-4">
            {[
              { id: 'preview', label: 'Draft Preview' },
              { id: 'ats', label: 'Market Analytics' },
              { id: 'targeting', label: 'Match Intelligence' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  activePanel === p.id ? 'text-text border-b border-text pb-4 -mb-[17px]' : 'text-text-muted hover:text-text'
                }`}
                onClick={() => setActivePanel(p.id as ActivePanel)}
              >
                {p.label} {p.id === 'ats' && analysis && <span className="ml-1 opacity-50">({analysis.overallScore})</span>}
              </button>
            ))}
          </div>

          <div className="pt-8">
            {activePanel === 'preview' && (
              <div className="bg-ivory shadow-shadow p-12 border border-border min-h-[800px]">
                <ResumePreview draft={draft} />
              </div>
            )}

            {activePanel === 'ats' && (
              <Card className="space-y-10">
                <ATSScoreCard
                  analysis={analysis}
                  loading={analyzing}
                  onAnalyze={handleAnalyze}
                />
                {analysis && analysis.suggestions.length > 0 && (
                  <div className="pt-8 border-t border-border/30">
                    <ATSSuggestions suggestions={analysis.suggestions} />
                  </div>
                )}
              </Card>
            )}

            {activePanel === 'targeting' && (
              <Card>
                <JobTargetingPanel resumeText={resumeText} />
                <Text muted className="mt-8 italic py-4 border-t border-border/30">
                  Paste a job description above to analyze market alignment.
                </Text>
              </Card>
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
  );

  if (embedded) return content;

  return (
    <PageLayout
      title="Drafting Desk"
      subtitle="Assemble and optimize your professional record for market entry."
    >
      {content}
    </PageLayout>
  );
}

export default ResumeBuilderPage
