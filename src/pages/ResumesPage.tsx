import React, { CSSProperties, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FeatureGate } from '../components/features/FeatureGate'
import { Container } from '../components/shared/Container'
import {
  ResumeIcon,
  ApplicationsIcon,
  KeywordsIcon,
  MatchScoreIcon,
} from '../components/icons/RelevntIcons'
import { useRelevntColors } from '../hooks'
import { hasFeatureAccess, getRequiredTier } from '../config'
import {
  useResumes,
  useExtractResume,
  useAnalyzeResume,
  useOptimizeResume,
} from '../hooks'
import type { RelevntColors } from '../hooks/useRelevntColors'
import type { Resume } from '../hooks/useResumes'
import type { TierLevel } from '../config/tiers'
import type {
  ResumeExtractionResponse,
  ResumeAnalysisResponse,
  ResumeOptimizationResponse,
} from '../types/ai-responses.types'
import { supabase } from '../lib/supabase'

type ResumeTab = 'list' | 'upload' | 'extract' | 'analyze' | 'optimize'

export function ResumesPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const colors = useRelevntColors()

  const {
    resumes,
    loading: resumesLoading,
    deleteResume,
    setDefaultResume,
    updateResumeTitle,
  } = useResumes(user!)

  const [activeTab, setActiveTab] = useState<ResumeTab>('list')

  const userTier: TierLevel =
    user?.tier && ['starter', 'pro', 'premium'].includes(user.tier)
      ? (user.tier as TierLevel)
      : 'starter'

  const canExtract = hasFeatureAccess('resume-extract', userTier)
  const canAnalyze = hasFeatureAccess('resume-analyze', userTier)
  const canOptimize = hasFeatureAccess('resume-optimize', userTier)

  const wrapper: CSSProperties = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const pageHeader: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  }

  const titleRow: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const title: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: colors.text,
  }

  const subtitle: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 540,
    lineHeight: 1.5,
  }

  const pillRow: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  }

  const pill = (active: boolean): CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 999,
    border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
    backgroundColor: active ? colors.surfaceHover : colors.surface,
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    color: active ? colors.text : colors.textSecondary,
    cursor: 'pointer',
  })

  const contentCard: CSSProperties = {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: 16,
    padding: '16px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }

  if (authLoading) {
    return (
      <div style={wrapper}>
        <Container maxWidth="lg" padding="md">
          <div style={{ color: colors.textSecondary, padding: '20px 0', fontSize: 14 }}>
            Checking your account...
          </div>
        </Container>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={wrapper}>
        <Container maxWidth="lg" padding="md">
          <div style={{ color: colors.textSecondary, padding: '20px 0', fontSize: 14 }}>
            Please log in to manage resumes.
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <Container maxWidth="lg" padding="md">
        <header style={pageHeader}>
          <div style={titleRow}>
            <h1 style={title}>Resume hub</h1>
            <p style={subtitle}>
              Keep your resume versions organized, run quick checks, and line them up against the
              roles you care about. No fluff, just clean artifacts you can trust.
            </p>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 999,
              border: `1px solid ${colors.borderLight}`,
              backgroundColor: colors.surfaceHover,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: colors.textSecondary,
            }}
          >
            <ResumeIcon size={16} strokeWidth={1.6} />
            <span>Documents</span>
          </div>
        </header>

        <div style={pillRow}>
          <button type="button" style={pill(activeTab === 'list')} onClick={() => setActiveTab('list')}>
            Resumes
          </button>
          <button type="button" style={pill(activeTab === 'upload')} onClick={() => setActiveTab('upload')}>
            Upload
          </button>
          <button
            type="button"
            style={pill(activeTab === 'extract')}
            onClick={() => setActiveTab('extract')}
            disabled={!canExtract}
          >
            Extract {canExtract ? '' : '(Pro)'}
          </button>
          <button
            type="button"
            style={pill(activeTab === 'analyze')}
            onClick={() => setActiveTab('analyze')}
            disabled={!canAnalyze}
          >
            Analyze {canAnalyze ? '' : '(Pro)'}
          </button>
          <button
            type="button"
            style={pill(activeTab === 'optimize')}
            onClick={() => setActiveTab('optimize')}
            disabled={!canOptimize}
          >
            Optimize {canOptimize ? '' : '(Pro)'}
          </button>
        </div>

        <section style={contentCard}>
          {activeTab === 'list' && (
            <ResumesListTab
              resumes={resumes}
              colors={colors}
              loading={resumesLoading}
              onDelete={async (id) => {
                try {
                  await deleteResume(id)
                } catch (err) {
                  console.error('Delete failed', err)
                }
              }}
              onSetDefault={async (id) => {
                try {
                  await setDefaultResume(id)
                } catch (err) {
                  console.error('Set default failed', err)
                }
              }}
              onEditTitle={async (id, title) => {
                try {
                  await updateResumeTitle(id, title)
                } catch (err) {
                  console.error('Edit title failed', err)
                }
              }}
            />
          )}

          {activeTab === 'upload' && (
            <ResumeUploadTab
              colors={colors}
              user={user}
            />
          )}
          {activeTab === 'extract' && (
            <FeatureGate
              feature="resume-extract"
              requiredTier={getRequiredTier('resume-extract')}
              userTier={userTier}
            >
              <ResumeExtractTab colors={colors} />
            </FeatureGate>
          )}

          {activeTab === 'analyze' && (
            <FeatureGate
              feature="resume-analyze"
              requiredTier={getRequiredTier('resume-analyze')}
              userTier={userTier}
            >
              <ResumeAnalyzeTab colors={colors} />
            </FeatureGate>
          )}

          {activeTab === 'optimize' && (
            <FeatureGate
              feature="resume-optimize"
              requiredTier={getRequiredTier('resume-optimize')}
              userTier={userTier}
            >
              <ResumeOptimizeTab colors={colors} />
            </FeatureGate>
          )}
        </section>
      </Container>
    </div>
  )
}

interface TabProps {
  colors: RelevntColors;
}

function ResumeCard({
  resume,
  colors,
  onDelete,
  onSetDefault,
  onEditTitle,
}: {
  resume: Resume
  colors: RelevntColors
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  onEditTitle: (id: string, title: string) => void
}) {
  const created = useMemo(() => {
    const date = resume.created_at ? new Date(resume.created_at) : null
    return date ? date.toLocaleDateString() : 'Just now'
  }, [resume.created_at])

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(resume.title || 'Untitled')

  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '14px 16px',
        borderRadius: 16,
        backgroundColor: colors.background,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.surfaceHover,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ResumeIcon size={18} strokeWidth={1.7} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 10,
                    border: `1px solid ${colors.borderLight}`,
                    background: colors.surfaceHover,
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    onEditTitle(resume.id, title)
                    setEditing(false)
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 10,
                    border: `1px solid ${colors.borderLight}`,
                    background: colors.surfaceHover,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{resume.title}</div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>
            )}
            <div style={{ fontSize: 12, color: colors.textSecondary }}>
              Created {created} {resume.is_default ? '• Default' : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {resume.ats_score && (
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                backgroundColor: colors.surfaceHover,
                border: `1px solid ${colors.borderLight}`,
                fontSize: 12,
                color: colors.text,
              }}
            >
              ATS {resume.ats_score}%
            </span>
          )}
          {!resume.is_default && (
            <button
              type="button"
              onClick={() => onSetDefault(resume.id)}
              style={{
                padding: '6px 10px',
                borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                backgroundColor: colors.surfaceHover,
                color: colors.text,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Make default
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(resume.id)}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: `1px solid ${colors.borderLight}`,
              backgroundColor: colors.surfaceHover,
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

function ResumesListTab({
  resumes,
  colors,
  loading,
  onDelete,
  onSetDefault,
  onEditTitle,
}: {
  resumes: Resume[]
  colors: RelevntColors
  loading: boolean
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  onEditTitle: (id: string, title: string) => void
}) {
  if (loading) {
    return <div style={{ fontSize: 13, color: colors.textSecondary }}>Loading resumes...</div>
  }

  if (resumes.length === 0) {
    return (
      <div
        style={{
          padding: '20px 16px',
          borderRadius: 14,
          border: `1px dashed ${colors.borderLight}`,
          backgroundColor: colors.background,
          color: colors.textSecondary,
          fontSize: 13,
        }}
      >
        No resumes yet. Upload one to start tracking ATS readiness and tailoring.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {resumes.map((resume) => (
        <ResumeCard
          key={resume.id}
          resume={resume}
          colors={colors}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
          onEditTitle={onEditTitle}
        />
      ))}
    </div>
  )
}

function ResumeUploadTab({
  colors,
  user,
}: TabProps & { user: any }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpload = async () => {
    if (!user) {
      setError('You need to be logged in to upload a resume.')
      return
    }
    if (!file) {
      setError('Choose a file first.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      // Basic client side parsing: get text from the file blob.
      // This is not perfect for every format but gives us something usable
      // without extra dependencies or server side PDF work.
      let parsedText = ''
      try {
        parsedText = await file.text()
      } catch (e) {
        console.error('Failed to read file as text', e)
        parsedText = ''
      }

      const baseTitle = file.name.replace(/\.[^.]+$/, '') || 'Untitled resume'

      const { error: insertError } = await supabase.from('resumes').insert({
        user_id: user.id,
        title: baseTitle,
        parsed_text: parsedText || null,
        mime_type: file.type || null,
        file_name: file.name,
        file_size_bytes: file.size,
      })

      if (insertError) {
        console.error('Resume upload insert error:', insertError)
        setError('Resume upload failed. Check the console for details.')
        return
      }

      setSuccess(true)
      setFile(null)
      
    } catch (err) {
      console.error('Resume upload error:', err)
      setError('Resume upload failed unexpectedly.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ResumeIcon size={18} strokeWidth={1.7} />
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>Upload a resume</h2>
      </div>
      <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
        Upload a resume file and Relevnt will store it along with a text version for matching and analysis.
      </p>
      <label
        htmlFor="resume-input"
        style={{
          border: `1px dashed ${colors.border}`,
          borderRadius: 16,
          padding: '24px 18px',
          backgroundColor: colors.background,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          color: colors.textSecondary,
          fontSize: 13,
        }}
      >
        <input
          id="resume-input"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setError(null)
            setSuccess(false)
          }}
          style={{ display: 'none' }}
        />
        <span style={{ color: colors.text, fontWeight: 600 }}>Choose a file</span>
        <span>PDF, DOCX, DOC, or TXT. Max 10MB.</span>
        {file && <span style={{ color: colors.text }}>Selected: {file.name}</span>}
      </label>
      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          borderRadius: 999,
          border: 'none',
          backgroundColor: colors.primary,
          color: colors.text,
          fontSize: 13,
          fontWeight: 600,
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
        }}
      >
        {uploading ? 'Uploading…' : 'Upload resume'}
      </button>
      {(error || success) && (
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {error && <span style={{ color: colors.error }}>{error}</span>}
          {success && !error && (
            <span style={{ color: colors.textSecondary }}>
              Resume uploaded. Your matches and ATS tools can now use it.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
  colors,
  minRows = 6,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  colors: RelevntColors
  minRows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      style={{
        width: '100%',
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.background,
        color: colors.text,
        padding: '12px 12px',
        fontSize: 13,
        resize: 'vertical',
      }}
    />
  )
}

function ResumeExtractTab({ colors }: TabProps) {
  const { extract, loading } = useExtractResume()
  const [resumeText, setResumeText] = useState('')
  const [result, setResult] = useState<ResumeExtractionResponse['data'] | null>(null)

  const handleExtract = async () => {
    if (!resumeText.trim()) return
    const response = await extract(resumeText)
    if (response?.success && response.data) {
      setResult(response.data)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <KeywordsIcon size={18} strokeWidth={1.7} />
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>Extract resume data</h2>
      </div>
      <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
        Paste your resume text to pull out structured details you can reuse elsewhere.
      </p>
      <TextArea
        value={resumeText}
        onChange={setResumeText}
        placeholder="Paste your resume text..."
        colors={colors}
      />
      <button
        type="button"
        onClick={handleExtract}
        disabled={loading}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          borderRadius: 999,
          border: 'none',
          backgroundColor: colors.primary,
          color: colors.text,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Extracting…' : 'Extract data'}
      </button>
      {result && (
        <div
          style={{
            marginTop: 4,
            padding: '12px 12px',
            borderRadius: 12,
            border: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.background,
            fontSize: 13,
            color: colors.text,
            display: 'grid',
            gap: 6,
          }}
        >
          <div><strong>Name:</strong> {result.fullName}</div>
          <div><strong>Email:</strong> {result.email}</div>
          <div><strong>Location:</strong> {result.location}</div>
          <div><strong>Skills:</strong> {result.skills.join(', ')}</div>
        </div>
      )}
    </div>
  )
}

function ResumeAnalyzeTab({ colors }: TabProps) {
  const { analyze, loading } = useAnalyzeResume()
  const [resumeText, setResumeText] = useState('')
  const [result, setResult] = useState<ResumeAnalysisResponse['data'] | null>(null)

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return
    const response = await analyze(resumeText)
    if (response?.success && response.data) {
      setResult(response.data)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MatchScoreIcon size={18} strokeWidth={1.7} />
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>Analyze for ATS</h2>
      </div>
      <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
        Quick read on how an ATS will score this version before you send it.
      </p>
      <TextArea
        value={resumeText}
        onChange={setResumeText}
        placeholder="Paste your resume text..."
        colors={colors}
      />
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          borderRadius: 999,
          border: 'none',
          backgroundColor: colors.primary,
          color: colors.text,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Analyzing…' : 'Analyze'}
      </button>
      {result && (
        <div
          style={{
            marginTop: 4,
            padding: '14px 14px',
            borderRadius: 12,
            border: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.background,
            display: 'grid',
            gap: 10,
            color: colors.text,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: colors.primary }}>{result.atsScore}%</div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              ATS score · {result.improvements.length > 0 ? 'Opportunities found' : 'Solid alignment'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Strengths</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: colors.textSecondary }}>
              {result.keywordMatches.length === 0
                ? <li>No standout keywords yet.</li>
                : result.keywordMatches.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Areas to improve</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: colors.textSecondary }}>
              {result.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumeOptimizeTab({ colors }: TabProps) {
  const { optimize, loading } = useOptimizeResume()
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<ResumeOptimizationResponse['data'] | null>(null)

  const handleOptimize = async () => {
    if (!resumeText.trim()) return
    const response = await optimize(resumeText, jobDescription || undefined)
    if (response?.success && response.data) {
      setResult(response.data)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ApplicationsIcon size={18} strokeWidth={1.7} />
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>Optimize for a role</h2>
      </div>
      <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
        Get adjustments that keep your voice but align to the role without exaggerating experience.
      </p>
      <TextArea
        value={resumeText}
        onChange={setResumeText}
        placeholder="Paste your resume text..."
        colors={colors}
        minRows={5}
      />
      <TextArea
        value={jobDescription}
        onChange={setJobDescription}
        placeholder="Optional: paste a job description to tailor toward"
        colors={colors}
        minRows={4}
      />
      <button
        type="button"
        onClick={handleOptimize}
        disabled={loading}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          borderRadius: 999,
          border: 'none',
          backgroundColor: colors.primary,
          color: colors.text,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Optimizing…' : 'Get suggestions'}
      </button>
      {result && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div
            style={{
              padding: '14px 14px',
              borderRadius: 12,
              border: `1px solid ${colors.borderLight}`,
              backgroundColor: colors.background,
              color: colors.text,
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>Optimized resume</div>
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: `1px solid ${colors.borderLight}`,
                  backgroundColor: colors.surfaceHover,
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                ATS {result.atsScore}%
              </div>
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              {result.optimizedResume}
            </div>
          </div>
          {result.improvements.length > 0 && (
            <div
              style={{
                padding: '14px 14px',
                borderRadius: 12,
                border: `1px solid ${colors.borderLight}`,
                backgroundColor: colors.background,
                color: colors.text,
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 600 }}>Recommended tweaks</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: colors.textSecondary }}>
                {result.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResumesPage