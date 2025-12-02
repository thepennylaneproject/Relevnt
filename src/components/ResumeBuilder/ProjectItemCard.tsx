// src/pages/ResumeBuilder/components/ProjectItemCard.tsx
import React, { ChangeEvent } from 'react'
import { ResumeProjectItem } from '../../types/resume-builder.types'

interface ProjectItemCardProps {
  item: ResumeProjectItem
  onChange: (item: ResumeProjectItem) => void
  onRemove: () => void
}

export const ProjectItemCard: React.FC<ProjectItemCardProps> = ({
  item,
  onChange,
  onRemove,
}) => {
  const handleFieldChange =
    (field: keyof ResumeProjectItem) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange({
          ...item,
          [field]: e.target.value,
        })
      }

  const handleTechChange =
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      onChange({
        ...item,
        technologies: list,
      } as ResumeProjectItem)
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
          <label style={labelStyle}>Project name</label>
          <input
            style={inputStyle}
            value={(item.name as string) || ''}
            onChange={handleFieldChange('name')}
            placeholder="Relevnt, AI career platform"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Role</label>
          <input
            style={inputStyle}
            value={(item.role as string) || ''}
            onChange={handleFieldChange('role')}
            placeholder="Founder, Product and Marketing"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Project link (optional)</label>
        <input
          style={inputStyle}
          value={(item.link as string) || ''}
          onChange={handleFieldChange('link')}
          placeholder="https://relevnt.work"
        />
      </div>

      <div>
        <label style={labelStyle}>Highlights/Impact</label>
        <textarea
          style={textareaStyle}
          rows={4}
          value={(item.description as string) || ''}
          onChange={handleFieldChange('description')}
          placeholder="Built full stack architecture, integrated LLM APIs, drove 200%+ IG growth…"
        />
      </div>

      <div>
        <label style={labelStyle}>Technologies (comma separated)</label>
        <input
          style={inputStyle}
          value={Array.isArray(item.techStack) ? item.techStack.join(', ') : ''}
          onChange={handleTechChange}
          placeholder="React, Supabase, Netlify, Tailwind, OpenAI"
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        style={removeButtonStyle}
      >
        ✕ Remove project
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