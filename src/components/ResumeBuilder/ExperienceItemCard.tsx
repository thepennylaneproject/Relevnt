// src/pages/ResumeBuilder/components/ExperienceItemCard.tsx
import React, { ChangeEvent } from 'react'
import { ResumeExperienceItem } from '../../types/resume-builder.types'
import { AIButton } from './AIButton'
import { useAITask } from '../../hooks/useAITask'
import { useState } from 'react'

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
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148, 163, 184, 0.6)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Title</label>
          <input
            style={inputStyle}
            value={item.title || ''}
            onChange={handleFieldChange('title')}
            placeholder="Digital Marketing Strategist"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Company</label>
          <input
            style={inputStyle}
            value={item.company || ''}
            onChange={handleFieldChange('company')}
            placeholder="HealthTech Associates"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Location</label>
          <input
            style={inputStyle}
            value={item.location || ''}
            onChange={handleFieldChange('location')}
            placeholder="West Des Moines, IA · Remote"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Start</label>
            <input
              style={inputStyle}
              value={item.startDate || ''}
              onChange={handleFieldChange('startDate')}
              placeholder="2023-09"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>End</label>
            <input
              style={inputStyle}
              value={item.endDate || ''}
              onChange={handleFieldChange('endDate')}
              placeholder="Present"
            />
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Highlights / Impact</label>
          <div style={{ display: 'flex', gap: 8 }}>
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
          style={textareaStyle}
          rows={4}
          value={item.bullets || ''}
          onChange={handleFieldChange('bullets')}
          placeholder="Use bullet-style lines, quantified impact, systems you built…"
        />
        {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error.message}</div>}
      </div>

      <button
        type="button"
        onClick={onRemove}
        style={removeButtonStyle}
      >
        ✕ Remove experience
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#64748b',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#1e293b',
  fontSize: 14,
  transition: 'all 0.2s',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  lineHeight: 1.5,
}

const removeButtonStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 8,
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #fee2e2',
  background: '#fff1f2',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
  transition: 'all 0.2s',
}