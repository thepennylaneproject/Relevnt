import React, { ChangeEvent, useState } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeSummary } from '../../types/resume-builder.types'
import { AIButton } from './AIButton'
import { useAITask } from '../../hooks/useAITask'

interface Props {
  summary: ResumeSummary
  onChange: (update: Partial<ResumeSummary>) => void
  colors?: any
}

export const SummarySection: React.FC<Props> = ({ summary, onChange, colors }) => {
  const { execute, loading, error } = useAITask()
  const [lastAction, setLastAction] = useState<'rewrite' | null>(null)

  const handleRewrite = async () => {
    setLastAction('rewrite')
    try {
      const result = await execute('rewrite-text', {
        text: summary.summary || summary.headline,
        context: 'resume-summary',
      })

      if (result.success && result.data) {
        onChange({
          ...summary,
          summary: (result.data as any).rewritten || result.data,
        })
      }
    } catch (err) {
      console.error('Failed to rewrite summary', err)
    }
  }

  const handleFieldChange =
    (field: keyof ResumeSummary) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange({ [field]: e.target.value } as Partial<ResumeSummary>)
      }

  return (
    <SectionCard
      title="Summary"
      description="A sharp, outcome focused snapshot that sets the frame for your story."
      icon="📝"
      colors={colors}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>Headline (optional)</label>
          <input
            style={inputStyle}
            value={summary.headline ?? ''}
            onChange={handleFieldChange('headline')}
            placeholder="Mission driven digital marketing strategist & AI product builder"
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Summary</label>
            <AIButton
              label="Rewrite Professional"
              onClick={handleRewrite}
              loading={loading && lastAction === 'rewrite'}
              disabled={!summary.summary && !summary.headline}
            />
          </div>
          <textarea
            style={textareaStyle}
            rows={5}
            value={summary.summary}
            onChange={handleFieldChange('summary')}
            placeholder="2 to 4 lines that describe who you are, what you do best, and the value you create."
          />
          {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error.message}</div>}
        </div>
      </div>
    </SectionCard>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#9ca3af',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.7)',
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#e5e7eb',
  fontSize: 13,
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
}