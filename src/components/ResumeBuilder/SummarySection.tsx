import React, { ChangeEvent, useState } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeSummary } from '../../types/resume-builder.types'
import { AIButton } from './AIButton'
import { useAITask } from '../../hooks/useAITask'
import { inputClass, labelClass, textareaClass } from './sectionStyles'
import { Stars } from "lucide-react"

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
      icon={<Stars className="w-4 h-4 text-[var(--color-ink)]" />}
      colors={colors}
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Headline (optional)</label>
          <input
            className={inputClass}
            value={summary.headline ?? ''}
            onChange={handleFieldChange('headline')}
            placeholder="Mission driven digital marketing strategist & AI product builder"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className={labelClass}>Summary</label>
            <AIButton
              label="Rewrite Professional"
              onClick={handleRewrite}
              loading={loading && lastAction === 'rewrite'}
              disabled={!summary.summary && !summary.headline}
            />
          </div>
          <textarea
            className={textareaClass}
            rows={5}
            value={summary.summary}
            onChange={handleFieldChange('summary')}
            placeholder="2 to 4 lines that describe who you are, what you do best, and the value you create."
          />
          {error && <div className="text-xs text-rose-600">{error.message}</div>}
        </div>
      </div>
    </SectionCard>
  )
}
