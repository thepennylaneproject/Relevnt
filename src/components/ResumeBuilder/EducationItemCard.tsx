// src/pages/ResumeBuilder/components/EducationItemCard.tsx
import React, { ChangeEvent } from 'react'
import { ResumeEducationItem } from '../../types/resume-builder.types' // adjust if needed

interface EducationItemCardProps {
  item: ResumeEducationItem
  onChange: (item: ResumeEducationItem) => void
  onRemove: () => void
}

export const EducationItemCard: React.FC<EducationItemCardProps> = ({
  item,
  onChange,
  onRemove,
}) => {
  const handleFieldChange =
    (field: keyof ResumeEducationItem) =>
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
          <label style={labelStyle}>School</label>
          <input
            style={inputStyle}
            value={(item.institution as string) || ''}
            onChange={handleFieldChange('institution')}
            placeholder="Iowa State University"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Degree</label>
          <input
            style={inputStyle}
            value={(item.degree as string) || ''}
            onChange={handleFieldChange('degree')}
            placeholder="BA, Marketing"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Field of study</label>
          <input
            style={inputStyle}
            value={(item.fieldOfStudy as string) || ''}
            onChange={handleFieldChange('fieldOfStudy')}
            placeholder="Digital Media and Communications"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Location</label>
          <input
            style={inputStyle}
            value={(item.location as string) || ''}
            onChange={handleFieldChange('location')}
            placeholder="Ames, IA"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Start</label>
          <input
            style={inputStyle}
            value={(item.startDate as string) || ''}
            onChange={handleFieldChange('startDate')}
            placeholder="2014-08"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>End</label>
          <input
            style={inputStyle}
            value={(item.endDate as string) || ''}
            onChange={handleFieldChange('endDate')}
            placeholder="2018-05"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        style={removeButtonStyle}
      >
        ✕ Remove education
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