// src/pages/ResumeBuilder/components/CertificationsSection.tsx
import React, { ChangeEvent } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeCertificationItem } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'

interface CertificationsSectionProps {
  id: string
  items: ResumeCertificationItem[]
  onChange: (items: ResumeCertificationItem[]) => void
  colors: RelevntColors
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  id,
  items,
  onChange,
  colors,
}) => {
  const handleFieldChange =
    (index: number, field: keyof ResumeCertificationItem) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = [...items]
        next[index] = {
          ...next[index],
          [field]: e.target.value,
        }
        onChange(next)
      }

  const addItem = () => {
    const newItem: ResumeCertificationItem = {
      id: crypto.randomUUID(),
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      url: '',
    } as ResumeCertificationItem

    onChange([...items, newItem])
  }

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <SectionCard
      id={id}
      title="Certifications"
      icon="📜"
      description="License, certs, and credentials that move the needle."
      colors={colors}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, index) => (
          <div
            key={item.id || index}
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
                <label style={labelStyle}>Name</label>
                <input
                  style={inputStyle}
                  value={(item.name as string) || ''}
                  onChange={handleFieldChange(index, 'name')}
                  placeholder="Hydrafacial Certified Provider"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Issuer</label>
                <input
                  style={inputStyle}
                  value={(item.issuer as string) || ''}
                  onChange={handleFieldChange(index, 'issuer')}
                  placeholder="Hydrafacial / Manufacturer"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Issued</label>
                <input
                  style={inputStyle}
                  value={(item.year as string) || ''}
                  onChange={handleFieldChange(index, 'year')}
                  placeholder="2022-04"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Expires (optional)</label>
                <input
                  style={inputStyle}
                  value={(item.year as string) || ''}
                  onChange={handleFieldChange(index, 'year')}
                  placeholder="2025-04"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>URL (optional)</label>
              <input
                style={inputStyle}
                value={(item.link as string) || ''}
                onChange={handleFieldChange(index, 'link')}
                placeholder="Link to license or credential"
              />
            </div>

            <button
              type="button"
              onClick={() => removeItem(index)}
              style={removeButtonStyle}
            >
              ✕ Remove certification
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          style={addButtonStyle}
        >
          + Add certification
        </button>
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

const addButtonStyle: React.CSSProperties = {
  marginTop: 4,
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px dashed rgba(148, 163, 184, 0.7)',
  background: 'transparent',
  color: '#e5e7eb',
  fontSize: 13,
  cursor: 'pointer',
  alignSelf: 'flex-start',
}

const removeButtonStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 6,
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid rgba(248, 113, 113, 0.7)',
  background: 'rgba(127, 29, 29, 0.5)',
  color: '#fecaca',
  cursor: 'pointer',
  fontSize: 12,
}