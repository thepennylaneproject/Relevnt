// src/pages/ResumeBuilder/components/ExperienceItemCard.tsx
import React, { ChangeEvent } from 'react'
import { ResumeExperienceItem } from '../../types/resume-builder.types'
import { AIButton } from './AIButton'
import { useAITask } from '../../hooks/useAITask'
import { useState } from 'react'
import { inputClass, itemCardClass, labelClass, removeButtonClass, textareaClass } from './sectionStyles'

interface ExperienceItemCardProps {
  item: ResumeExperienceItem
  onChange: (item: ResumeExperienceItem) => void
  onRemove: () => void
}

export const ExperienceItemCard: React.FC<ExperienceItemCardProps> = ({
  item,
  onChange,
  onRemove,
}) => {
  const { execute, loading, error } = useAITask()
  const [lastAction, setLastAction] = useState<'generate' | 'rewrite' | null>(null)

  const handleGenerateBullets = async () => {
    setLastAction('generate')
    try {
      const result = await execute('generate-bullets', {
        title: item.title,
        company: item.company,
        currentBullets: item.bullets,
      })

      if (result.success && result.data) {
        onChange({
          ...item,
          bullets: (result.data as any).bullets || result.data,
        })
      }
    } catch (err) {
      console.error('Failed to generate bullets', err)
    }
  }

  const handleRewrite = async () => {
    setLastAction('rewrite')
    try {
      const result = await execute('rewrite-text', {
        text: item.bullets,
        context: 'resume-bullets',
      })

      if (result.success && result.data) {
        onChange({
          ...item,
          bullets: (result.data as any).rewritten || result.data,
        })
      }
    } catch (err) {
      console.error('Failed to rewrite text', err)
    }
  }

  const handleFieldChange =
    (field: keyof ResumeExperienceItem) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange({
          ...item,
          [field]: e.target.value,
        })
      }

  return (
    <div
      className={itemCardClass}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Title</label>
          <input
            className={inputClass}
            value={item.title || ''}
            onChange={handleFieldChange('title')}
            placeholder="Digital Marketing Strategist"
          />
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input
            className={inputClass}
            value={item.company || ''}
            onChange={handleFieldChange('company')}
            placeholder="HealthTech Associates"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Location</label>
          <input
            className={inputClass}
            value={item.location || ''}
            onChange={handleFieldChange('location')}
            placeholder="West Des Moines, IA · Remote"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Start</label>
            <input
              className={inputClass}
              value={item.startDate || ''}
              onChange={handleFieldChange('startDate')}
              placeholder="2023-09"
            />
          </div>
          <div>
            <label className={labelClass}>End</label>
            <input
              className={inputClass}
              value={item.endDate || ''}
              onChange={handleFieldChange('endDate')}
              placeholder="Present"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <label className={labelClass}>Highlights / Impact</label>
          <div className="flex items-center gap-2">
            <AIButton
              label="Generate Bullets"
              onClick={handleGenerateBullets}
              loading={loading && lastAction === 'generate'}
              disabled={!item.title || !item.company}
            />
            <AIButton
              label="Rewrite Stronger"
              onClick={handleRewrite}
              loading={loading && lastAction === 'rewrite'}
              disabled={!item.bullets || item.bullets.length < 10}
            />
          </div>
        </div>
        <textarea
          className={textareaClass}
          rows={4}
          value={item.bullets || ''}
          onChange={handleFieldChange('bullets')}
          placeholder="Use bullet-style lines, quantified impact, systems you built…"
        />
        {error && <div className="text-xs text-rose-600">{error.message}</div>}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className={removeButtonClass}
      >
        ✕ Remove experience
      </button>
    </div>
  )
}
