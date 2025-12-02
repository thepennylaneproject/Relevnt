import React, { CSSProperties, useMemo, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FeatureGate } from '../components/features/FeatureGate'
import { Container } from '../components/shared/Container'
import {
  ResumeIcon,
  ApplicationsIcon,
  MatchScoreIcon,
} from '../components/icons/RelevntIcons'
import { useRelevntColors } from '../hooks'
import { hasFeatureAccess, getRequiredTier } from '../config'
import {
  useResumes,
  useAnalyzeResume,
  useOptimizeResume,
  useExtractResume,
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
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

type ParsedResumeData = Omit<
  ResumeExtractionResponse['data'],
  'brainstorming' | 'certifications'
> & {
  certifications?: string[]          // just names for now
  brainstorming?: {
    suggestedSkills?: string[]
    alternateTitles?: string[]
    relatedKeywords?: string[]
    positioningNotes?: string
  } | null
}
// Shared helper for formatting date ranges for experience/education previews
function formatDateRange(start?: string, end?: string, current?: boolean): string {
  const cleanStart = start?.trim()
  const cleanEnd = current ? 'Present' : end?.trim()

  if (!cleanStart && !cleanEnd) return ''
  if (cleanStart && !cleanEnd) return cleanStart
  if (!cleanStart && cleanEnd) return cleanEnd

  return `${cleanStart} - ${cleanEnd}`
}

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

  // Figure out which resume to use as the "default" source of text for tools
  const defaultResume = useMemo(() => {
    if (!resumes || resumes.length === 0) return null

    // Prefer the one explicitly marked as default, otherwise fall back to the most recent
    const explicitlyDefault = resumes.find((r) => r.is_default)
    if (explicitlyDefault) return explicitlyDefault

    return resumes[0]
  }, [resumes])

  // Safely pull text content from the default resume, with sensible fallbacks
  const defaultResumeText =
    (defaultResume as any)?.parsed_text ||
    (defaultResume as any)?.raw_text ||
    (defaultResume as any)?.summary ||
    ''

  const defaultResumeId = (defaultResume as any)?.id || undefined

  // New: hydrate parsed fields from the DB so the right-hand panel starts filled in
  const defaultParsedFields =
    ((defaultResume as any)?.parsed_fields as ParsedResumeData) || null

  const [activeTab, setActiveTab] = useState<ResumeTab>('list')

  const isAdmin =
    user?.user_metadata?.role === 'admin' ||
    user?.user_metadata?.tier === 'admin' || // in case you store it this way
    user?.email === 'sarah@thepennylaneproject.org'  // or whatever email you log in with

  const userTier: TierLevel =
    isAdmin
      ? 'premium'
      : user?.tier && ['starter', 'pro', 'premium'].includes(user.tier)
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
              <ResumeExtractTab
                colors={colors}
                defaultResumeText={defaultResumeText}
                defaultResumeId={defaultResumeId}
                defaultParsedFields={defaultParsedFields}
              />
            </FeatureGate>
          )}

          {activeTab === 'analyze' && (
            <FeatureGate
              feature="resume-analyze"
              requiredTier={getRequiredTier('resume-analyze')}
              userTier={userTier}
            >
              <ResumeAnalyzeTab
                colors={colors}
                defaultResumeText={defaultResumeText}
              />
            </FeatureGate>
          )}

          {activeTab === 'optimize' && (
            <FeatureGate
              feature="resume-optimize"
              requiredTier={getRequiredTier('resume-optimize')}
              userTier={userTier}
            >
              <ResumeOptimizeTab
                colors={colors}
                defaultResumeText={defaultResumeText}
              />
            </FeatureGate>
          )}
        </section>
      </Container>
    </div>
  )
}

interface TabProps {
  colors: RelevntColors;
  defaultResumeText?: string;
  defaultResumeId?: string;
  defaultParsedFields?: ParsedResumeData | null;
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
      // Helper to normalize and sanitize text before inserting into Postgres
      const cleanText = (input: string) =>
        input
          .replace(/\u0000/g, '') // strip null bytes that Postgres text hates
          .replace(/<[^>]+>/g, ' ') // strip any HTML tags if present
          .replace(/\s+/g, ' ') // collapse whitespace
          .trim()

      const fileName = file.name
      const mimeType = file.type || 'application/octet-stream'
      const size = file.size
      const lowerName = fileName.toLowerCase()

      const isPdf = mimeType === 'application/pdf' || lowerName.endsWith('.pdf')
      const isDocx =
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        lowerName.endsWith('.docx')
      const isPlainText = mimeType.startsWith('text/') || lowerName.endsWith('.txt')

      let parsedText: string | null = null

      if (isPlainText) {
        try {
          const raw = await file.text()
          parsedText = cleanText(raw)
        } catch (e) {
          console.error('Failed to read text file', e)
          parsedText = null
        }
      } else if (isPdf) {
        try {
          const rawText = await extractTextFromPdf(file)
          parsedText = cleanText(rawText)
        } catch (e) {
          console.error('PDF text extraction failed, storing metadata only:', e)
          parsedText = null
        }
      } else if (isDocx) {
        // DOCX parsing via mammoth (browser build), dynamic import to keep bundle happy
        try {
          const arrayBuffer = await file.arrayBuffer()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mammothModule: any = await import('mammoth/mammoth.browser')
          const result = await mammothModule.convertToHtml({ arrayBuffer })
          const html = typeof result.value === 'string' ? result.value : ''
          parsedText = cleanText(html)
        } catch (e) {
          console.error('DOCX parse failed, storing metadata only:', e)
          parsedText = null
        }
      } else {
        // Fallback: try reading as text; if it blows up, we still keep metadata
        try {
          const raw = await file.text()
          parsedText = cleanText(raw)
        } catch (e) {
          console.error('Fallback text read failed, storing metadata only:', e)
          parsedText = null
        }
      }

      // Guardrail: avoid inserting absurdly large blobs into parsed_text
      const MAX_CHARS = 500_000
      if (parsedText && parsedText.length > MAX_CHARS) {
        parsedText = parsedText.slice(0, MAX_CHARS)
      }

      const baseTitle = fileName.replace(/\.[^.]+$/, '') || 'Untitled resume'

      const { error: insertError } = await supabase.from('resumes').insert({
        user_id: user.id,
        title: baseTitle,
        parsed_text: parsedText,
        mime_type: mimeType,
        file_name: fileName,
        file_size_bytes: size,
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
        TXT, PDF, and DOCX are supported.
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

// Simple PDF text extraction using pdfjs-dist
// We configure the worker once via GlobalWorkerOptions, then use getDocument.
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  // pdfjs-dist handles parsing in the browser; we feed it the raw bytes
  const pdf = await getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content: any = await page.getTextContent()

    const pageText = (content.items || [])
      .map((item: any) => (item && item.str ? item.str : ''))
      .join(' ')

    fullText += pageText + '\n'
  }

  // Strip any null bytes just in case, Postgres text does not like them
  return fullText.replace(/\u0000/g, '')
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

function normalizeResumeText(raw: string): string {
  // Strip common unicode icons and normalize whitespace
  return raw
    .replace(/[•\t]/g, ' ')
    .replace(/[📍📞✉🔗]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

function inferEmail(text: string): string {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match ? match[0] : ''
}

function inferPhone(text: string): string {
  const match = text.match(/(\+?1[ .-]?)?(\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4})/)
  return match ? match[0].trim() : ''
}

function inferLocation(lines: string[]): string {
  const locLine = lines.find((l) => /,\s*[A-Z]{2}\b/.test(l))
  if (!locLine) return ''

  // Grab the part up through `City, ST` and optional country
  const match = locLine.match(/([^·|]+?,\s*[A-Z]{2}(?:[^·|]*)?)/)
  return match ? match[1].trim() : locLine.trim()
}

function inferName(lines: string[], email: string): string {
  const emailUser = email ? email.split('@')[0] : ''

  for (const line of lines.slice(0, 5)) {
    const hasAt = line.includes('@')
    const hasUrl =
      line.toLowerCase().includes('http') ||
      line.toLowerCase().includes('linkedin')
    if (hasAt || hasUrl) continue

    const lettersOnly = line.replace(/[^A-Za-z ]/g, '').trim()
    if (!lettersOnly) continue

    if (emailUser) {
      const parts = emailUser.split(/[._-]+/).filter(Boolean)
      const hit = parts.some((p) =>
        lettersOnly.toLowerCase().includes(p.toLowerCase())
      )
      if (!hit) continue
    }

    return lettersOnly
  }

  return ''
}

function findSectionRange(
  lines: string[],
  headerPatterns: RegExp[],
  stopPatterns: RegExp[]
): { start: number; end: number } | null {
  const headerIdx = lines.findIndex((l) =>
    headerPatterns.some((re) => re.test(l.toUpperCase()))
  )
  if (headerIdx === -1) return null

  let end = lines.length
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const upper = lines[i].toUpperCase()
    if (stopPatterns.some((re) => re.test(upper))) {
      end = i
      break
    }
  }

  return { start: headerIdx + 1, end }
}

function extractSummary(lines: string[]): string {
  const range = findSectionRange(
    lines,
    [/SUMMARY/, /PROFESSIONAL SUMMARY/],
    [/CORE COMPETENCIES/, /SKILLS/, /EXPERIENCE/, /TECHNOLOGY/, /EDUCATION/]
  )
  if (!range) return ''

  const slice = lines.slice(range.start, range.end)
  return slice.join(' ').slice(0, 800).trim()
}

function extractSkills(lines: string[]): string[] {
  const range = findSectionRange(
    lines,
    [/CORE COMPETENCIES/, /SKILLS/, /TECHNOLOGY & DIGITAL/, /TECHNOLOGY/],
    [/PROFESSIONAL EXPERIENCE/, /EXPERIENCE/, /WORK HISTORY/, /EDUCATION/]
  )
  if (!range) return []

  const slice = lines.slice(range.start, range.end)

  const rawPieces = slice.flatMap((line) => {
    const cleaned = line.replace(/^[-•]+\s*/, '')

    if (cleaned.includes(',')) {
      return cleaned.split(',')
    }

    return [cleaned]
  })

  const skills = rawPieces
    .map((s) => s.replace(/\([^)]*\)/g, '').trim())
    .filter((s) => s.length > 1)

  const seen = new Set<string>()
  const unique: string[] = []
  for (const s of skills) {
    const key = s.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(s)
    }
  }

  return unique
}

function mergeSkills(a: string[], b: string[] = []): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const s of [...a, ...b]) {
    const key = s.trim().toLowerCase()
    if (!key) continue
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(s.trim())
    }
  }

  return merged
}

function parseResumeHeuristic(raw: string): ParsedResumeData {
  const normalized = normalizeResumeText(raw)
  const lines = splitLines(normalized)

  const email = inferEmail(normalized)
  const phone = inferPhone(normalized)
  const location = inferLocation(lines)
  const fullName = inferName(lines, email)
  const summary = extractSummary(lines)
  const skills = extractSkills(lines)

  return {
    fullName,
    email,
    phone,
    location,
    summary,
    skills,
    experience: [],
    education: [],
    certifications: [],
    brainstorming: null,
  }
}

function ResumeExtractTab({
  colors,
  defaultResumeText,
  defaultResumeId,
  defaultParsedFields,
}: TabProps) {
  const { extract, loading, error } = useExtractResume()

  const [resumeText, setResumeText] = useState('')
  const [parsed, setParsed] = useState<ParsedResumeData | null>(null)
  const [skillsInput, setSkillsInput] = useState('')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Simple toggles so sections can collapse
  const [activeSections, setActiveSections] = useState({
    summary: true,
    skills: true,
    experience: true,
    education: true,
    brainstorm: true,
  })

  const experience = parsed?.experience || []
  const education = parsed?.education || []
  const brainstorming = parsed?.brainstorming || null

  // Hydrate from DB when defaultParsedFields is present
  useEffect(() => {
    if (defaultParsedFields) {
      setParsed(defaultParsedFields)
      setSkillsInput((defaultParsedFields.skills || []).join(', '))
      setSaveMessage('Loaded saved structured fields from your default resume.')
    }
  }, [defaultParsedFields])

  const toggleSection = (key: keyof typeof activeSections) => {
    setActiveSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const persistParsed = async (data: ParsedResumeData) => {
    // Helpful log while we are wiring this up
    console.log('persistParsed: defaultResumeId =', defaultResumeId, 'data:', data)

    if (!defaultResumeId) {
      setSaveMessage(
        'Structured fields updated locally. No default resume record was found to save into.'
      )
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('resumes')
        .update({
          parsed_fields: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            location: data.location,
            summary: data.summary,
            skills: data.skills,
            experience: data.experience,
            education: data.education,
            certifications: data.certifications,
            brainstorming: data.brainstorming,
          },
        })
        .eq('id', defaultResumeId)

      if (updateError) {
        console.error('Failed to save parsed resume fields:', updateError)
        setSaveMessage(
          'Structured fields updated locally. Saving to your resume record failed.'
        )
      } else {
        setSaveMessage('Structured fields saved to your default resume.')
      }
    } catch (dbErr) {
      console.error('Unexpected error saving parsed resume fields:', dbErr)
      setSaveMessage(
        'Structured fields updated locally. Saving to your resume record failed.'
      )
    }
  }

  const handleExtract = async () => {
    if (!resumeText.trim()) return

    // First pass: heuristic for a safety net
    const heuristic = parseResumeHeuristic(resumeText)

    let combined: ParsedResumeData = {
      fullName: heuristic.fullName,
      email: heuristic.email,
      phone: heuristic.phone,
      location: heuristic.location,
      summary: heuristic.summary,
      skills: heuristic.skills,
      experience: [],
      education: [],
      certifications: [],
      brainstorming: null,
    }

    let usedAI = false

    try {
      const response = await extract(resumeText)

      if (response?.success && response.data) {
        usedAI = true
        const ai = response.data

        combined = {
          fullName: ai.fullName || heuristic.fullName,
          email: ai.email || heuristic.email,
          phone: ai.phone || heuristic.phone,
          location: ai.location || heuristic.location,
          summary: ai.summary || heuristic.summary,
          skills: mergeSkills(heuristic.skills, ai.skills || []),
          experience: ai.experience || [],
          education: ai.education || [],
          certifications: (ai.certifications || [])
            .map((c: { name?: string }) => c.name || '')
            .filter((name) => Boolean(name)),
          brainstorming: ai.brainstorming || null,
        }
      }
    } catch (e) {
      console.warn('extract-resume AI failed, using heuristic only', e)
    }

    setParsed(combined)
    setSkillsInput((combined.skills || []).join(', '))
    setSaveMessage(null)

    // Auto-save once after extraction so the rest of the app has something to work with
    await persistParsed(combined)

    if (usedAI) {
      console.info('Resume extract: heuristic + AI hybrid parsing used')
    } else {
      console.info('Resume extract: heuristic only parsing used')
    }
  }

  const handleFieldChange =
    (field: 'fullName' | 'email' | 'phone' | 'location' | 'summary') =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!parsed) return
        setParsed({ ...parsed, [field]: e.target.value })
        setSaveMessage(null)
      }

  const handleSkillsBlur = () => {
    if (!parsed) return
    const raw = skillsInput
      .split(/[,;\n]/)
      .map((s: string) => s.trim())
      .filter(Boolean)

    setParsed({ ...parsed, skills: raw })
    setSaveMessage(null)
  }

  const addSuggestedSkill = (skill: string) => {
    if (!parsed) return
    const existing = new Set(
      (parsed.skills || []).map((s) => s.trim().toLowerCase())
    )
    const key = skill.trim().toLowerCase()
    if (!key || existing.has(key)) return

    const updated = [...(parsed.skills || []), skill]
    setParsed({ ...parsed, skills: updated })
    setSkillsInput(updated.join(', '))
    setSaveMessage(null)
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#555',
  }

  const helperStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  }

  const buttonBase: React.CSSProperties = {
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid #222',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const primaryButton: React.CSSProperties = {
    ...buttonBase,
    backgroundColor: '#111',
    color: '#fdfdfd',
    borderColor: '#111',
  }

  const secondaryButton: React.CSSProperties = {
    ...buttonBase,
    backgroundColor: '#f7f7f7',
    color: '#111',
    borderColor: colors.borderLight,
  }

  const chipStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: '#fff',
    fontSize: 11,
    cursor: 'pointer',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
          Step 1: Drop your resume text in. Step 2: Let the AI squint at it. Step 3:
          Fix anything it got weird about.
        </div>
        <div style={helperStyle}>
          This tab is for turning messy resume text into clean, structured fields
          Relevnt can reuse everywhere else.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        {/* LEFT: RAW RESUME TEXT */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={labelStyle}>1. Paste your resume text</div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your full resume here. You can copy from a PDF, DOCX, or wherever it lives right now."
            style={{
              minHeight: 220,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${colors.borderLight}`,
              fontSize: 13,
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              style={secondaryButton}
              onClick={() => {
                if (defaultResumeText && defaultResumeText.trim()) {
                  setResumeText(defaultResumeText)
                  setSaveMessage(null)
                } else {
                  alert('No default resume text found yet. Try uploading a resume first.')
                }
              }}
            >
              Use default resume
            </button>
            <button
              type="button"
              style={primaryButton}
              onClick={handleExtract}
              disabled={loading || !resumeText.trim()}
            >
              {loading ? 'Extracting…' : 'Extract fields'}
            </button>
          </div>
          {error && (
            <div
              style={{
                marginTop: 4,
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                backgroundColor: '#fff6f6',
                fontSize: 12,
                color: '#b3261e',
              }}
            >
              {error.message}
            </div>
          )}
          <div style={helperStyle}>
            Nothing here overwrites your actual resume file. It just feeds a clean,
            structured version into the rest of Relevnt.
          </div>
        </div>

        {/* RIGHT: PARSED / EDITABLE FIELDS */}
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${colors.borderLight}`,
            padding: 14,
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 520,
            overflowY: 'auto', // independent scroll so you are not yo-yoing the whole page
          }}
        >
          <div style={labelStyle}>2. Review & edit detected fields</div>
          {!parsed && (
            <div style={{ fontSize: 13, color: '#666' }}>
              Run an extraction or load existing structured data to see your contact
              info, summary, skills, and previews of experience and education here.
            </div>
          )}

          {parsed && (
            <>
              {/* Contact block (always visible) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 8,
                }}
              >
                <div>
                  <div style={labelStyle}>Name</div>
                  <input
                    type="text"
                    value={parsed.fullName}
                    onChange={handleFieldChange('fullName')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <div style={labelStyle}>Email</div>
                  <input
                    type="email"
                    value={parsed.email}
                    onChange={handleFieldChange('email')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <div style={labelStyle}>Phone</div>
                  <input
                    type="text"
                    value={parsed.phone}
                    onChange={handleFieldChange('phone')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <div style={labelStyle}>Location</div>
                  <input
                    type="text"
                    value={parsed.location}
                    onChange={handleFieldChange('location')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* Summary (collapsible) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={labelStyle}>Summary</div>
                  <button
                    type="button"
                    onClick={() => toggleSection('summary')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: 11,
                      color: '#666',
                      cursor: 'pointer',
                    }}
                  >
                    {activeSections.summary ? 'Hide' : 'Show'}
                  </button>
                </div>
                {activeSections.summary && (
                  <textarea
                    value={parsed.summary}
                    onChange={handleFieldChange('summary')}
                    placeholder="If your resume has a summary or headline, you can paste or tweak it here."
                    style={{
                      width: '100%',
                      minHeight: 80,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #ddd',
                      fontSize: 13,
                      resize: 'vertical',
                    }}
                  />
                )}
              </div>

              {/* Skills (collapsible) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={labelStyle}>Skills (comma-separated)</div>
                  <button
                    type="button"
                    onClick={() => toggleSection('skills')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: 11,
                      color: '#666',
                      cursor: 'pointer',
                    }}
                  >
                    {activeSections.skills ? 'Hide' : 'Show'}
                  </button>
                </div>
                {activeSections.skills && (
                  <>
                    <textarea
                      value={skillsInput}
                      onChange={(e) => {
                        setSkillsInput(e.target.value)
                        setSaveMessage(null)
                      }}
                      onBlur={handleSkillsBlur}
                      placeholder="Example: Social media strategy, GA4, Google Ads, Monday.com, Canva, HubSpot"
                      style={{
                        width: '100%',
                        minHeight: 70,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #ddd',
                        fontSize: 13,
                        resize: 'vertical',
                      }}
                    />
                    <div style={helperStyle}>
                      We split this into individual skills behind the scenes so you can
                      be as casual or as extra as you want here.
                    </div>
                    {brainstorming?.suggestedSkills &&
                      brainstorming.suggestedSkills.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#555',
                              marginBottom: 4,
                            }}
                          >
                            Suggested skills to add:
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 6,
                            }}
                          >
                            {brainstorming.suggestedSkills.map((skill) => (
                              <button
                                key={skill}
                                type="button"
                                style={chipStyle}
                                onClick={() => addSuggestedSkill(skill)}
                              >
                                + {skill}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>

              {/* Experience preview (collapsible) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={labelStyle}>Experience (preview)</div>
                  <button
                    type="button"
                    onClick={() => toggleSection('experience')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: 11,
                      color: '#666',
                      cursor: 'pointer',
                    }}
                  >
                    {activeSections.experience ? 'Hide' : 'Show'}
                  </button>
                </div>
                {activeSections.experience && (
                  <>
                    {experience.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#777' }}>
                        No structured experience detected yet. That is okay, you can
                        still use this tab for contact, summary, and skills.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {experience.map((role, idx) => {
                          const duration = formatDateRange(
                            role.startDate,
                            role.endDate,
                            role.current
                          )
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '6px 8px',
                                borderRadius: 8,
                                border: '1px solid #e2e2e2',
                                backgroundColor: '#fff',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                {role.title || 'Role title'}
                              </div>
                              <div
                                style={{ fontSize: 12, color: '#555' }}
                              >
                                {role.company}
                                {role.location ? ` • ${role.location}` : ''}
                              </div>
                              {duration && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#777',
                                    marginTop: 2,
                                  }}
                                >
                                  {duration}
                                </div>
                              )}
                              {role.bullets && role.bullets.length > 0 && (
                                <ul
                                  style={{
                                    marginTop: 4,
                                    paddingLeft: 16,
                                    fontSize: 11,
                                    color: '#555',
                                  }}
                                >
                                  {role.bullets.slice(0, 3).map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Education preview (collapsible) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={labelStyle}>Education (preview)</div>
                  <button
                    type="button"
                    onClick={() => toggleSection('education')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontSize: 11,
                      color: '#666',
                      cursor: 'pointer',
                    }}
                  >
                    {activeSections.education ? 'Hide' : 'Show'}
                  </button>
                </div>
                {activeSections.education && (
                  <>
                    {education.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#777' }}>
                        No education section detected yet. Once we can see your schools
                        and credentials, they will show up here.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        {education.map((edu, idx) => {
                          const duration = formatDateRange(
                            edu.startDate,
                            edu.endDate,
                            false
                          )
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '6px 8px',
                                borderRadius: 8,
                                border: '1px solid #e2e2e2',
                                backgroundColor: '#fff',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                {edu.institution || 'Institution'}
                              </div>
                              <div
                                style={{ fontSize: 12, color: '#555' }}
                              >
                                {[edu.degree, edu.fieldOfStudy]
                                  .filter(Boolean)
                                  .join(' • ')}
                              </div>
                              {duration && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#777',
                                    marginTop: 2,
                                  }}
                                >
                                  {duration}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Brainstorm panel (optional, collapsible) */}
              {brainstorming && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={labelStyle}>Brainstorming assist</div>
                    <button
                      type="button"
                      onClick={() => toggleSection('brainstorm')}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: 11,
                        color: '#666',
                        cursor: 'pointer',
                      }}
                    >
                      {activeSections.brainstorm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {activeSections.brainstorm && (
                    <div style={{ fontSize: 12, color: '#555' }}>
                      {brainstorming.alternateTitles &&
                        brainstorming.alternateTitles.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                marginBottom: 2,
                              }}
                            >
                              Alternate titles to consider:
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              {brainstorming.alternateTitles.map((t) => (
                                <span key={t} style={chipStyle}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {brainstorming.relatedKeywords &&
                        brainstorming.relatedKeywords.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                marginBottom: 2,
                              }}
                            >
                              Related keywords:
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              {brainstorming.relatedKeywords.map((k) => (
                                <span key={k} style={chipStyle}>
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {brainstorming.positioningNotes && (
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              marginBottom: 2,
                            }}
                          >
                            Positioning notes:
                          </div>
                          <div>{brainstorming.positioningNotes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Save row */}
              <div
                style={{
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  style={primaryButton}
                  onClick={() => {
                    if (parsed) {
                      void persistParsed(parsed)
                    }
                  }}
                >
                  Save structured fields
                </button>
                {saveMessage && (
                  <div style={{ ...helperStyle, color: '#222' }}>{saveMessage}</div>
                )}
              </div>

              <div style={helperStyle}>
                Once this looks right, these fields become the source of truth for the
                rest of Relevnt. Analyze, optimize, matching, all of it.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ResumeAnalyzeTab({ colors, defaultResumeText }: TabProps) {
  const { user } = useAuth()
  const { analyze, loading, error } = useAnalyzeResume()
  const [resumeText, setResumeText] = useState('')
  const [result, setResult] = useState<ResumeAnalysisResponse['data'] | null>(null)

  const handleLoadDefault = () => {
    if (defaultResumeText && defaultResumeText.trim()) {
      setResumeText(defaultResumeText)
    } else {
      console.warn(
        'No default resume text available for analyze tab. Try uploading a resume first.'
      )
    }
  }

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return
    const response = await analyze(resumeText)

    if (response?.success && response.data) {
      setResult(response.data)

      if (user) {
        try {
          const { error: updateError } = await supabase
            .from('resumes')
            .update({ ats_score: response.data.atsScore })
            .eq('user_id', user.id)
            .eq('is_default', true)

          if (updateError) {
            console.error('Failed to save ATS score to default resume:', updateError)
          }
        } catch (err) {
          console.error('Unexpected error saving ATS score:', err)
        }
      }
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MatchScoreIcon size={18} strokeWidth={1.7} />
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>
          Analyze for ATS
        </h2>
      </div>

      <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
        Quick read on how an ATS will score this version before you send it. You can paste text or load your default resume.
      </p>

      {user && (
        <button
          type="button"
          onClick={handleLoadDefault}
          style={{
            alignSelf: 'flex-start',
            padding: '6px 12px',
            borderRadius: 999,
            border: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.surfaceHover,
            color: colors.text,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Use default resume
        </button>
      )}

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

      {error && (
        <div
          style={{
            marginTop: 4,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.background,
            fontSize: 12,
            color: colors.error || '#b3261e',
          }}
        >
          {error.message}
        </div>
      )}

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
            <div style={{ fontSize: 26, fontWeight: 700, color: colors.primary }}>
              {result.atsScore}%
            </div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              ATS score ·{' '}
              {result.improvements.length > 0
                ? 'Opportunities found'
                : 'Solid alignment'}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              Strengths
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: colors.textSecondary }}>
              {result.keywordMatches.length === 0 ? (
                <li>No standout keywords yet.</li>
              ) : (
                result.keywordMatches.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              Areas to improve
            </div>
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

function ResumeOptimizeTab({ colors, defaultResumeText }: TabProps) {
  const { user } = useAuth()
  const { optimize, loading, error } = useOptimizeResume()
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<ResumeOptimizationResponse['data'] | null>(null)

  const handleLoadDefault = () => {
    if (defaultResumeText && defaultResumeText.trim()) {
      setResumeText(defaultResumeText)
    } else {
      console.warn(
        'No default resume text available for optimize tab. Try uploading a resume first.'
      )
    }
  }

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
        <h2 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>
          Optimize for a role
        </h2>
      </div>

      <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
        Get adjustments that keep your voice but align to the role without exaggerating experience.
      </p>

      {user && (
        <button
          type="button"
          onClick={handleLoadDefault}
          style={{
            alignSelf: 'flex-start',
            padding: '6px 12px',
            borderRadius: 999,
            border: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.surfaceHover,
            color: colors.text,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Use default resume
        </button>
      )}

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

      {error && (
        <div
          style={{
            marginTop: 4,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.background,
            fontSize: 12,
            color: colors.error || '#b3261e',
          }}
        >
          {error.message}
        </div>
      )}

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
