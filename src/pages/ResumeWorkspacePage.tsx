// src/pages/ResumeWorkspacePage.tsx
// Documents workspace with Rail + Canvas layout — NO TABS
// Implements the Writer's Desk metaphor from the audit

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { DocumentRail, DocumentItem, DocumentType, CanvasHeader, PreviewPane, ActiveSection, DocumentActionsMenu } from '../components/Documents'

// Resume section editors
import { ContactSection } from '../components/ResumeBuilder/ContactSection'
import { SummarySection } from '../components/ResumeBuilder/SummarySection'
import { SkillsSection } from '../components/ResumeBuilder/SkillsSection'
import { ExperienceSection } from '../components/ResumeBuilder/ExperienceSection'
import { EducationSection } from '../components/ResumeBuilder/EducationSection'
import { CertificationsSection } from '../components/ResumeBuilder/CertificationsSection'
import { ProjectsSection } from '../components/ResumeBuilder/ProjectsSection'

import { Text, Heading } from '../components/ui/Typography'

// Hooks
import { useResumeBuilder } from '../hooks/useResumeBuilder'
import { useCoverLetters, type CoverLetter } from '../hooks/useCoverLetters'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Styles
import '../styles/documents-workspace.css'

// Types
type ResumeRow = { id: string; title: string; updated_at: string | null }

export default function ResumeWorkspacePage(): JSX.Element {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Document selection state
  const activeDocId = searchParams.get('id') || null
  const activeDocType = (searchParams.get('type') as DocumentType) || 'resume'

  // UI state
  const [activeSection, setActiveSection] = useState<ActiveSection>('contact')
  const [showPreview, setShowPreview] = useState(false)

  // Data: Resumes
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [resumesLoading, setResumesLoading] = useState(false)

  // Data: Cover Letters
  const { coverLetters, loading: lettersLoading } = useCoverLetters()

  // Active resume builder
  const {
    resumeId,
    draft,
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
  } = useResumeBuilder({ resumeId: activeDocType === 'resume' ? activeDocId || undefined : undefined })

  // Load resumes list (data only, no auto-selection)
  const loadResumes = useCallback(async () => {
    if (!user) return
    setResumesLoading(true)
    try {
      const { data } = await supabase
        .from('resumes')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false, nullsFirst: false })
      setResumes(data || [])
    } catch (err) {
      console.error('Failed to load resumes:', err)
    } finally {
      setResumesLoading(false)
    }
  }, [user])

  // Load resumes on mount
  useEffect(() => {
    loadResumes()
  }, [loadResumes])

  // Auto-select first resume if none selected (runs once after resumes load)
  const hasAutoSelected = React.useRef(false)
  useEffect(() => {
    if (hasAutoSelected.current) return
    if (resumes.length > 0 && !activeDocId && !resumesLoading) {
      hasAutoSelected.current = true
      const params = new URLSearchParams(searchParams)
      params.set('id', resumes[0].id)
      params.set('type', 'resume')
      setSearchParams(params, { replace: true })
    }
  }, [resumes, activeDocId, resumesLoading, searchParams, setSearchParams])

  // Create new resume
  const handleCreateResume = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: 'Untitled Resume',
          parsed_fields: {},
        })
        .select('id')
        .single()

      if (error || !data?.id) throw error || new Error('Failed to create')

      const params = new URLSearchParams()
      params.set('id', data.id)
      params.set('type', 'resume')
      setSearchParams(params)
      loadResumes()
    } catch (err) {
      console.error('Failed to create resume:', err)
    }
  }, [user, setSearchParams, loadResumes])

  // Select document
  const handleSelectDocument = useCallback((id: string, type: DocumentType) => {
    const params = new URLSearchParams()
    params.set('id', id)
    params.set('type', type)
    setSearchParams(params)
    setActiveSection('contact')
    setShowPreview(false)
  }, [setSearchParams])

  // Rename resume
  const handleRename = useCallback(async (newTitle: string) => {
    if (!user || !activeDocId) return
    try {
      await supabase
        .from('resumes')
        .update({ title: newTitle })
        .eq('id', activeDocId)
        .eq('user_id', user.id)
      loadResumes()
    } catch (err) {
      console.error('Failed to rename resume:', err)
    }
  }, [user, activeDocId, loadResumes])

  // Duplicate resume
  const handleDuplicate = useCallback(async () => {
    if (!user || !activeDocId) return
    try {
      // Fetch current resume
      const { data: current } = await supabase
        .from('resumes')
        .select('title, parsed_fields')
        .eq('id', activeDocId)
        .single()

      if (!current) return

      // Create duplicate
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: `${current.title || 'Untitled'} (copy)`,
          parsed_fields: current.parsed_fields,
        })
        .select('id')
        .single()

      if (error || !data?.id) throw error || new Error('Failed to duplicate')

      // Navigate to new resume
      const params = new URLSearchParams()
      params.set('id', data.id)
      params.set('type', 'resume')
      setSearchParams(params)
      loadResumes()
    } catch (err) {
      console.error('Failed to duplicate resume:', err)
    }
  }, [user, activeDocId, setSearchParams, loadResumes])

  // Delete resume
  const handleDelete = useCallback(async () => {
    if (!user || !activeDocId) return
    try {
      await supabase
        .from('resumes')
        .delete()
        .eq('id', activeDocId)
        .eq('user_id', user.id)

      // Clear selection and reload
      setSearchParams(new URLSearchParams())
      loadResumes()
    } catch (err) {
      console.error('Failed to delete resume:', err)
    }
  }, [user, activeDocId, setSearchParams, loadResumes])

  // Convert data for rail
  const resumeItems: DocumentItem[] = useMemo(() =>
    resumes.map(r => ({
      id: r.id,
      title: r.title || 'Untitled',
      type: 'resume' as DocumentType,
      updatedAt: r.updated_at || undefined,
    })),
    [resumes]
  )

  const letterItems: DocumentItem[] = useMemo(() =>
    coverLetters.map(l => ({
      id: l.id,
      title: l.title || 'Untitled Letter',
      type: 'letter' as DocumentType,
      updatedAt: l.created_at,
    })),
    [coverLetters]
  )

  // Active letter (if viewing)
  const activeLetter = useMemo(() =>
    activeDocType === 'letter' ? coverLetters.find(l => l.id === activeDocId) : null,
    [activeDocType, activeDocId, coverLetters]
  )

  // Save status text
  const saveStatusText = useMemo(() => {
    if (status === 'saving') return 'Saving…'
    if (status === 'loading') return 'Loading…'
    if (isDirty) return 'Unsaved'
    if (lastSavedAt) return 'Saved'
    return ''
  }, [status, isDirty, lastSavedAt])

  // Document title
  const documentTitle = useMemo(() => {
    if (activeDocType === 'letter' && activeLetter) {
      return activeLetter.title
    }
    return draft.contact.fullName || 'Untitled Draft'
  }, [activeDocType, activeLetter, draft.contact.fullName])

  return (
    <PageLayout
      title="Documents"
      subtitle="Resumes and cover letters"
    >
      <div className="documents-workspace">
        {/* Document Rail */}
        <DocumentRail
          resumes={resumeItems}
          letters={letterItems}
          activeDocumentId={activeDocId}
          onSelectDocument={handleSelectDocument}
          onCreateResume={handleCreateResume}
          loading={resumesLoading || lettersLoading}
        />

        {/* Canvas */}
        <div className="document-canvas writing-column">
          {activeDocType === 'resume' && (
            <>
              <CanvasHeader
                documentTitle={documentTitle}
                documentSubtitle={draft.contact.headline}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                saveStatus={saveStatusText}
                onPreviewToggle={() => setShowPreview(true)}
                onSave={manualSave}
                isDirty={isDirty}
                documentActions={
                  <DocumentActionsMenu
                    draft={draft}
                    resumeId={resumeId}
                    documentTitle={documentTitle}
                    onRename={handleRename}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                }
              />

              {/* Section Editor — ONE at a time */}
              <div className="section-editor">
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
            </>
          )}

          {activeDocType === 'letter' && activeLetter && (
            <div className="letter-viewer">
              <header className="letter-viewer__header">
                <Heading level={2}>{activeLetter.title}</Heading>
                <Text muted className="mt-1">{activeLetter.company_name}</Text>
              </header>
              <div className="letter-viewer__content">
                {activeLetter.content}
              </div>
              <div className="letter-viewer__actions">
                <button
                  className="canvas-header__action"
                  onClick={() => navigator.clipboard.writeText(activeLetter.content)}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {!activeDocId && !resumesLoading && (
            <div className="text-center py-16">
              <Text muted>Select a document from the rail or create a new resume.</Text>
            </div>
          )}
        </div>
      </div>

      {/* Preview Pane — Slide-out, hidden by default */}
      <PreviewPane
        isOpen={showPreview && activeDocType === 'resume'}
        onClose={() => setShowPreview(false)}
        draft={draft}
      />
    </PageLayout>
  )
}
