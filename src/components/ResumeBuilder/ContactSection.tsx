import React, { ChangeEvent } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeContact } from '../../types/resume-builder.types'
import { Button } from '../ui/Button'
import { helperClass, inputClass, labelClass } from './sectionStyles'
import { User } from "lucide-react"

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
      icon={<User className="w-4 h-4 text-[var(--color-ink)]" />}
      colors={colors}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1.1fr_1.4fr]">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              className={inputClass}
              value={contact.fullName}
              onChange={handleFieldChange('fullName')}
              placeholder="Sarah Sahl"
            />
          </div>
          <div>
            <label className={labelClass}>Headline (optional)</label>
            <input
              className={inputClass}
              value={contact.headline ?? ''}
              onChange={handleFieldChange('headline')}
              placeholder="Digital marketing strategist & AI product builder"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Email</label>
            <input
              className={inputClass}
              value={contact.email}
              onChange={handleFieldChange('email')}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              value={contact.phone}
              onChange={handleFieldChange('phone')}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              className={inputClass}
              value={contact.location}
              onChange={handleFieldChange('location')}
              placeholder="Des Moines, IA · Remote"
            />
          </div>
        </div>
        {/* Links subsection — quiet rows */}
        <div className="links-subsection">
          <div className="links-subsection__header">
            <label className={labelClass}>Links (optional)</label>
            <button
              type="button"
              className="links-subsection__add"
              onClick={addLink}
            >
              + Add link
            </button>
          </div>

          {(contact.links ?? []).length === 0 ? (
            <p className={helperClass}>
              Add LinkedIn, portfolio, GitHub, or other high value links.
            </p>
          ) : (
            <div className="links-subsection__list">
              {(contact.links ?? []).map((link, index) => (
                <div
                  key={index}
                  className="links-subsection__row"
                >
                  <input
                    className={`${inputClass} links-subsection__label-input`}
                    value={link.label}
                    onChange={handleLinkLabelChange(index)}
                    placeholder="LinkedIn"
                  />
                  <input
                    className={`${inputClass} links-subsection__url-input`}
                    value={link.url}
                    onChange={handleLinkUrlChange(index)}
                    placeholder="https://linkedin.com/in/you"
                  />
                  <button
                    type="button"
                    className="links-subsection__remove"
                    onClick={() => removeLink(index)}
                    aria-label="Remove link"
                  >
                    Remove
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
