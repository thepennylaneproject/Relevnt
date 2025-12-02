import React, { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useResumeBuilder } from '../hooks/useResumeBuilder'
import { useExtractResume } from '../hooks/useExtractResume'
import { ResumeBuilderLayout } from '../pages/ResumeBuilderLayout'
import { ContactSection } from '../components/ResumeBuilder/ContactSection'
import { SummarySection } from '../components/ResumeBuilder/SummarySection'
import { SkillsSection } from '../components/ResumeBuilder/SkillsSection'
import { ExperienceSection } from '../components/ResumeBuilder/ExperienceSection'
import { EducationSection } from '../components/ResumeBuilder/EducationSection'
import { CertificationsSection } from '../components/ResumeBuilder/CertificationsSection'
import { ProjectsSection } from '../components/ResumeBuilder/ProjectsSection'
import { ResumePreview } from '../components/ResumeBuilder/ResumePreview'
import { useRelevntColors } from '../hooks/useRelevntColors'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import type { ResumeDraft } from '../types/resume-builder.types'

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export const ResumeBuilderPage: React.FC = () => {
  const { resumeId } = useParams<{ resumeId: string }>() // adjust to your route

  const {
    draft,
    status,
    error,
    isDirty,
    lastSavedAt,
    updateContact,
    updateSummary,
    setSkillGroups,
    setExperience,
    setEducation,
    setCertifications,
    setProjects,
    setDraft,
  } = useResumeBuilder({ resumeId })

  const { extract, loading: extracting } = useExtractResume()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // If you have a theme system, pull colors from there.
  const colors = useRelevntColors()

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    try {
      let resumeText = ''

      if (file.type === 'application/pdf') {
        resumeText = await extractTextFromPDF(file)
      } else if (file.type === 'text/plain') {
        resumeText = await file.text()
      } else {
        setUploadError('Please upload a PDF or TXT file')
        return
      }

      const result = await extract(resumeText)

      if (result && result.success && result.data) {
        const extractedData = result.data

        const newDraft: ResumeDraft = {
          contact: {
            fullName: extractedData.fullName || '',
            email: extractedData.email || '',
            phone: extractedData.phone || '',
            location: extractedData.location || '',
            headline: '',
            links: [],
          },
          summary: {
            headline: '',
            summary: extractedData.summary || '',
          },
          experience: extractedData.experience?.map((exp, idx) => ({
            id: `exp-${idx}`,
            title: exp.title || '',
            company: exp.company || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            current: exp.current || false,
            bullets: exp.bullets?.join('\n') || '',
          })) || [],
          education: extractedData.education?.map((edu, idx) => ({
            id: `edu-${idx}`,
            institution: edu.institution || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || '',
          })) || [],
          certifications: extractedData.certifications?.map((cert, idx) => ({
            id: `cert-${idx}`,
            name: cert.name || '',
            issuer: cert.issuer || '',
            year: cert.year || '',
          })) || [],
          projects: [],
          skillGroups: extractedData.skills?.length
            ? [{
              label: 'Skills',
              skills: extractedData.skills,
            }]
            : [],
          lastUpdatedAt: new Date().toISOString(),
        }

        setDraft(() => newDraft)
      }
    } catch (err) {
      console.error('Failed to upload and extract:', err)
      setUploadError(err instanceof Error ? err.message : 'Failed to extract resume')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const headerActions = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleUploadClick}
        disabled={extracting}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid rgba(129, 140, 248, 0.7)',
          background: 'rgba(30, 64, 175, 0.1)',
          color: '#4f46e5',
          fontSize: 13,
          fontWeight: 600,
          cursor: extracting ? 'not-allowed' : 'pointer',
          opacity: extracting ? 0.6 : 1,
        }}
      >
        {extracting ? '⏳ Extracting...' : '📄 Upload Resume'}
      </button>
    </>
  )

  const editor = (
    <>
      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid rgba(248, 113, 113, 0.7)',
            background: 'rgba(127, 29, 29, 0.4)',
            color: '#fee2e2',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {uploadError && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid rgba(251, 191, 36, 0.7)',
            background: 'rgba(120, 53, 15, 0.4)',
            color: '#fef3c7',
            fontSize: 13,
          }}
        >
          {uploadError}
        </div>
      )}

      <section id="contact">
        <ContactSection
          contact={draft.contact}
          onChange={updateContact}
          colors={colors}
        />
      </section>

      <section id="summary">
        <SummarySection
          summary={draft.summary}
          onChange={updateSummary}
          colors={colors}
        />
      </section>

      <section id="skills">
        <SkillsSection
          id="skills"
          skillGroups={draft.skillGroups}
          onChange={setSkillGroups}
          colors={colors}
        />
      </section>

      <section id="experience">
        <ExperienceSection
          id="experience"
          items={draft.experience}
          onChange={setExperience}
          colors={colors}
        />
      </section>

      <section id="education">
        <EducationSection
          id="education"
          items={draft.education}
          onChange={setEducation}
          colors={colors}
        />
      </section>

      <section id="certifications">
        <CertificationsSection
          id="certifications"
          items={draft.certifications}
          onChange={setCertifications}
          colors={colors}
        />
      </section>

      <section id="projects">
        <ProjectsSection
          id="projects"
          items={draft.projects}
          onChange={setProjects}
          colors={colors}
        />
      </section>
    </>
  )

  const preview = <ResumePreview draft={draft} />

  return (
    <ResumeBuilderLayout
      status={status}
      isDirty={isDirty}
      lastSavedAt={lastSavedAt}
      headerActions={headerActions}
      editor={editor}
      preview={preview}
    />
  )
}