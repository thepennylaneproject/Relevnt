// src/components/Documents/CanvasHeader.tsx
// Canvas header with document title and inline section switcher
// Manuscript energy — text links, no pills or button styling

import React from 'react'
import { Heading, Text } from '../ui/Typography'

export type ActiveSection =
  | 'contact'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'projects'

const SECTIONS: { id: ActiveSection; label: string }[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'summary', label: 'Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'projects', label: 'Projects' },
]

interface CanvasHeaderProps {
  documentTitle: string
  documentSubtitle?: string
  activeSection: ActiveSection
  onSectionChange: (section: ActiveSection) => void
  saveStatus?: string
  onPreviewToggle: () => void
  onSave?: () => void
  isDirty?: boolean
  documentActions?: React.ReactNode
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  documentTitle,
  documentSubtitle,
  activeSection,
  onSectionChange,
  saveStatus,
  onPreviewToggle,
  onSave,
  isDirty,
  documentActions,
}) => {
  return (
    <header className="canvas-header">
      {/* Document Title Row */}
      <div className="canvas-header__title-row">
        <div>
          <Heading level={2}>{documentTitle || 'Untitled Draft'}</Heading>
          {documentSubtitle && (
            <Text muted className="canvas-header__subtitle">{documentSubtitle}</Text>
          )}
        </div>
        <div className="canvas-header__actions">
          {saveStatus && (
            <Text muted className="canvas-header__status">{saveStatus}</Text>
          )}
          {isDirty && onSave && (
            <button className="canvas-header__action" onClick={onSave}>
              Save
            </button>
          )}
          <button className="canvas-header__action" onClick={onPreviewToggle}>
            Preview
          </button>
          {documentActions}
        </div>
      </div>

      {/* Section Navigation — table of contents style */}
      <nav className="section-nav" aria-label="Document sections">
        {SECTIONS.map((section, index) => {
          const isActive = activeSection === section.id
          return (
            <React.Fragment key={section.id}>
              {index > 0 && <span className="section-nav__sep" aria-hidden="true">·</span>}
              <button
                type="button"
                className={`section-nav__item ${isActive ? 'section-nav__item--active' : ''}`}
                onClick={() => onSectionChange(section.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                {section.label}
              </button>
            </React.Fragment>
          )
        })}
      </nav>
    </header>
  )
}
