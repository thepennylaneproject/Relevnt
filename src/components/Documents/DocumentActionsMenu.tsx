// src/components/Documents/DocumentActionsMenu.tsx
// Compact document actions: Export (PDF) + More menu (Rename, Duplicate, Delete)
// Quiet, minimal — matches calm notebook tone

import React, { useState, useRef, useEffect } from 'react'
import type { ResumeDraft } from '../../types/resume-builder.types'

// Re-use existing PDF generation
function generateResumeHTML(draft: ResumeDraft): string {
  const sections: string[] = []

  // Header
  sections.push(`
      <div class="resume-header">
          <h1>${draft.contact.fullName || 'Your Name'}</h1>
          ${draft.contact.headline ? `<p class="headline">${draft.contact.headline}</p>` : ''}
          <div class="contact-info">
              ${draft.contact.email ? `<span>${draft.contact.email}</span>` : ''}
              ${draft.contact.phone ? `<span>${draft.contact.phone}</span>` : ''}
              ${draft.contact.location ? `<span>${draft.contact.location}</span>` : ''}
          </div>
      </div>
  `)

  // Summary
  if (draft.summary.summary) {
    sections.push(`
        <div class="resume-section">
            <h2>Professional Summary</h2>
            <p>${draft.summary.summary}</p>
        </div>
    `)
  }

  // Experience
  if (draft.experience.length > 0) {
    const expItems = draft.experience.map(exp => `
        <div class="experience-item">
            <div class="exp-header">
                <strong>${exp.title}</strong>
                <span class="dates">${exp.startDate} - ${exp.endDate || 'Present'}</span>
            </div>
            <div class="exp-company">${exp.company}${exp.location ? ` | ${exp.location}` : ''}</div>
            ${exp.bullets ? `<ul>${exp.bullets.split('\n').filter(b => b.trim()).map(b => `<li>${b.replace(/^[-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
        </div>
    `).join('')

    sections.push(`
        <div class="resume-section">
            <h2>Experience</h2>
            ${expItems}
        </div>
    `)
  }

  // Skills
  if (draft.skillGroups.length > 0) {
    const skillsText = draft.skillGroups.map(g =>
      `<p><strong>${g.label}:</strong> ${g.skills.join(', ')}</p>`
    ).join('')

    sections.push(`
        <div class="resume-section">
            <h2>Skills</h2>
            ${skillsText}
        </div>
    `)
  }

  // Education
  if (draft.education.length > 0) {
    const eduItems = draft.education.map(edu => `
        <div class="education-item">
            <strong>${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}</strong>
            <span class="dates">${edu.endDate || ''}</span>
            <div>${edu.institution}</div>
        </div>
    `).join('')

    sections.push(`
        <div class="resume-section">
            <h2>Education</h2>
            ${eduItems}
        </div>
    `)
  }

  return `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.5; 
                  color: rgb(51 51 51);
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 40px;
              }
              h1 { margin: 0 0 4px; font-size: 24px; }
              h2 { font-size: 14px; border-bottom: 1px solid rgb(51 51 51); padding-bottom: 4px; margin: 20px 0 10px; }
              .headline { margin: 0 0 8px; color: rgb(102 102 102); font-size: 14px; }
              .contact-info { font-size: 12px; color: rgb(102 102 102); }
              .contact-info span { margin-right: 16px; }
              .resume-section { margin-bottom: 16px; }
              .experience-item, .education-item { margin-bottom: 12px; }
              .exp-header { display: flex; justify-content: space-between; }
              .exp-company { color: rgb(102 102 102); font-size: 14px; }
              .dates { color: rgb(102 102 102); font-size: 12px; }
              ul { margin: 6px 0; padding-left: 20px; }
              li { margin-bottom: 4px; font-size: 14px; }
              p { margin: 4px 0; font-size: 14px; }
          </style>
      </head>
      <body>
          ${sections.join('')}
      </body>
      </html>
  `
}

interface DocumentActionsMenuProps {
  draft: ResumeDraft
  resumeId: string | undefined
  documentTitle: string
  onRename: (newTitle: string) => void
  onDuplicate: () => void
  onDelete: () => void
}

export const DocumentActionsMenu: React.FC<DocumentActionsMenuProps> = ({
  draft,
  resumeId,
  documentTitle,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmingDelete(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Focus input when renaming
  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renaming])

  const handleExportPDF = () => {
    const html = generateResumeHTML(draft)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const handleRenameStart = () => {
    setRenameValue(documentTitle)
    setRenaming(true)
    setMenuOpen(false)
  }

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== documentTitle) {
      onRename(renameValue.trim())
    }
    setRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setRenaming(false)
    }
  }

  const handleDuplicate = () => {
    onDuplicate()
    setMenuOpen(false)
  }

  const handleDeleteClick = () => {
    if (confirmingDelete) {
      onDelete()
      setMenuOpen(false)
      setConfirmingDelete(false)
    } else {
      setConfirmingDelete(true)
    }
  }

  if (!resumeId) return null

  return (
    <div className="document-actions" ref={menuRef}>
      {/* Rename inline if active */}
      {renaming && (
        <input
          ref={inputRef}
          type="text"
          className="document-actions__rename-input"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleRenameKeyDown}
        />
      )}

      {/* Export PDF — always visible */}
      <button
        className="document-actions__btn"
        onClick={handleExportPDF}
        title="Export as PDF"
      >
        Export
      </button>

      {/* More menu */}
      <div className="document-actions__more-wrapper">
        <button
          className="document-actions__btn document-actions__btn--more"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          title="More actions"
        >
          ⋯
        </button>

        {menuOpen && (
          <div className="document-actions__menu">
            <button
              className="document-actions__menu-item"
              onClick={handleRenameStart}
            >
              Rename
            </button>
            <button
              className="document-actions__menu-item"
              onClick={handleDuplicate}
            >
              Duplicate
            </button>
            {/* TODO: Share link — requires share token generation which doesn't exist yet */}
            {/* <button className="document-actions__menu-item" disabled>
              Share link (coming soon)
            </button> */}
            <div className="document-actions__menu-divider" />
            <button
              className={`document-actions__menu-item document-actions__menu-item--danger ${confirmingDelete ? 'document-actions__menu-item--confirming' : ''}`}
              onClick={handleDeleteClick}
            >
              {confirmingDelete ? 'Confirm delete?' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
