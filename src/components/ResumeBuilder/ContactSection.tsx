import React, { ChangeEvent } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeContact } from '../../types/resume-builder.types'

interface Props {
  contact: ResumeContact
  onChange: (update: Partial<ResumeContact>) => void
  colors?: any
}

export const ContactSection: React.FC<Props> = ({ contact, onChange, colors }) => {
  const handleFieldChange =
    (field: keyof ResumeContact) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        onChange({ [field]: e.target.value } as Partial<ResumeContact>)
      }

  const handleLinkLabelChange =
    (index: number) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = [...(contact.links ?? [])]
        next[index] = { ...next[index], label: e.target.value }
        onChange({ links: next })
      }

  const handleLinkUrlChange =
    (index: number) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = [...(contact.links ?? [])]
        next[index] = { ...next[index], url: e.target.value }
        onChange({ links: next })
      }

  const addLink = () => {
    const next = [
      ...(contact.links ?? []),
      { label: 'LinkedIn', url: '' },
    ]
    onChange({ links: next })
  }

  const removeLink = (index: number) => {
    const next = (contact.links ?? []).filter((_, i) => i !== index)
    onChange({ links: next })
  }

  return (
    <SectionCard
      title="Contact"
      description="Who you are and how people should reach you."
      icon="👋"
      colors={colors}
      showAIButton={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Full name</label>
            <input
              style={inputStyle}
              value={contact.fullName}
              onChange={handleFieldChange('fullName')}
              placeholder="Sarah Sahl"
            />
          </div>
          <div style={{ flex: 3 }}>
            <label style={labelStyle}>Headline (optional)</label>
            <input
              style={inputStyle}
              value={contact.headline ?? ''}
              onChange={handleFieldChange('headline')}
              placeholder="Digital marketing strategist & AI product builder"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              value={contact.email}
              onChange={handleFieldChange('email')}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Phone</label>
            <input
              style={inputStyle}
              value={contact.phone}
              onChange={handleFieldChange('phone')}
              placeholder="(555) 123-4567"
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Location</label>
            <input
              style={inputStyle}
              value={contact.location}
              onChange={handleFieldChange('location')}
              placeholder="Des Moines, IA · Remote"
            />
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <label style={labelStyle}>Links (optional)</label>
            <button
              type="button"
              onClick={addLink}
              style={smallGhostButton}
            >
              + Add link
            </button>
          </div>

          {(contact.links ?? []).length === 0 ? (
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              Add LinkedIn, portfolio, GitHub, or other high value links.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(contact.links ?? []).map((link, index) => (
                <div
                  key={index}
                  style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={link.label}
                    onChange={handleLinkLabelChange(index)}
                    placeholder="LinkedIn"
                  />
                  <input
                    style={{ ...inputStyle, flex: 3 }}
                    value={link.url}
                    onChange={handleLinkUrlChange(index)}
                    placeholder="https://linkedin.com/in/you"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    style={iconButtonStyle}
                    aria-label="Remove link"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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

const smallGhostButton: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px dashed rgba(148, 163, 184, 0.8)',
  background: 'transparent',
  color: '#e5e7eb',
  cursor: 'pointer',
}

const iconButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.7)',
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#e5e7eb',
  cursor: 'pointer',
  fontSize: 12,
}