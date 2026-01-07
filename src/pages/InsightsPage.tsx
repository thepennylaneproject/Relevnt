// src/pages/InsightsPage.tsx
// Dedicated Insights page for Market Analytics and Match Intelligence
// Separated from editing per the Documents Experience audit

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/ui/Card'
import { Heading, Text } from '../components/ui/Typography'
import { Badge } from '../components/ui/Badge'

// Analysis components
import { ATSScoreCard } from '../components/ResumeBuilder/ATSScoreCard'
import { ATSSuggestions } from '../components/ResumeBuilder/ATSSuggestions'
import { JobTargetingPanel } from '../components/ResumeBuilder/JobTargetingPanel'

// Hooks
import { useResumeAnalysis } from '../hooks/useResumeAnalysis'
import { useResumeBuilder } from '../hooks/useResumeBuilder'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Types
type InsightsTab = 'ats' | 'fit'

// Helper: Convert draft to text for job targeting
function draftToText(draft: { contact: { fullName?: string; headline?: string }; summary: { summary?: string }; skillGroups: { skills: string[] }[]; experience: { title: string; company: string; bullets: string }[] }): string {
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

export default function InsightsPage(): JSX.Element {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Query params
  const docId = searchParams.get('doc')
  const jobId = searchParams.get('job')

  // Active tab
  const [activeTab, setActiveTab] = useState<InsightsTab>(jobId ? 'fit' : 'ats')

  // Resume data (read-only for insights)
  const { draft, status } = useResumeBuilder({ resumeId: docId || undefined })

  // ATS Analysis
  const { analysis, analyze, loading: analyzing } = useResumeAnalysis()

  // Resume text for job targeting
  const resumeText = useMemo(() => draftToText(draft), [draft])

  // Document title
  const documentTitle = draft.contact.fullName || 'Untitled Resume'

  // Auto-run ATS analysis when page loads with a doc
  useEffect(() => {
    if (docId && status === 'idle' && !analysis) {
      analyze(draft)
    }
  }, [docId, status, analysis, analyze, draft])

  // Loading state
  if (status === 'loading') {
    return (
      <PageLayout title="Insights" subtitle="Loading...">
        <Text muted className="italic">Loading resume data…</Text>
      </PageLayout>
    )
  }

  // No document selected
  if (!docId) {
    return (
      <PageLayout title="Insights" subtitle="Resume analysis and job fit">
        <Card>
          <div className="text-center py-16">
            <Text muted className="mb-4">No document selected.</Text>
            <button
              className="text-[10px] uppercase tracking-widest font-bold text-accent border-b border-accent/20 hover:border-accent transition-colors"
              onClick={() => navigate('/resumes')}
            >
              Go to Documents
            </button>
          </div>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Insights"
      subtitle={`Analyzing: ${documentTitle}`}
    >
      <div className="space-y-8">
        {/* Header with back link */}
        <header className="flex justify-between items-center border-b border-border/30 pb-4">
          <div className="flex items-center gap-4">
            <button
              className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
              onClick={() => navigate(`/resumes?id=${docId}&type=resume`)}
            >
              ← Back to Editor
            </button>
            <span className="text-border">|</span>
            <Text muted className="text-xs">{documentTitle}</Text>
          </div>
          {jobId && (
            <Badge variant="neutral">Job Context Active</Badge>
          )}
        </header>

        {/* Tab navigation — minimal, inline */}
        <nav className="flex gap-6">
          <button
            className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
              activeTab === 'ats' ? 'text-text border-b border-text' : 'text-text-muted hover:text-text'
            }`}
            onClick={() => setActiveTab('ats')}
          >
            ATS Score
            {analysis && <span className="ml-1 opacity-50">({analysis.overallScore})</span>}
          </button>
          <button
            className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
              activeTab === 'fit' ? 'text-text border-b border-text' : 'text-text-muted hover:text-text'
            }`}
            onClick={() => setActiveTab('fit')}
          >
            Job Fit
          </button>
        </nav>

        {/* Content */}
        <div className="pt-4">
          {activeTab === 'ats' && (
            <Card className="space-y-10">
              <ATSScoreCard
                analysis={analysis}
                loading={analyzing}
                onAnalyze={() => analyze(draft)}
              />
              {analysis && analysis.suggestions.length > 0 && (
                <div className="pt-8 border-t border-border/30">
                  <ATSSuggestions suggestions={analysis.suggestions} />
                </div>
              )}
            </Card>
          )}

          {activeTab === 'fit' && (
            <Card>
              <JobTargetingPanel resumeText={resumeText} />
              <Text muted className="mt-8 italic py-4 border-t border-border/30">
                Paste a job description above to analyze market alignment.
              </Text>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
