// src/components/ResumeBuilder/ResumeExport.tsx
// Export resume to PDF with ATS-friendly formatting

import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import type { ResumeDraft } from '../../types/resume-builder.types'

// ============================================================================
// TYPES
// ============================================================================

type ExportFormat = 'pdf' | 'docx' | 'txt'

interface Props {
    draft: ResumeDraft
}

// ============================================================================
// HELPERS
// ============================================================================

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

    // Certifications
    if (draft.certifications.length > 0) {
        const certItems = draft.certifications.map(c =>
            `<p>${c.name}${c.issuer ? ` - ${c.issuer}` : ''}${c.year ? ` (${c.year})` : ''}</p>`
        ).join('')

        sections.push(`
            <div class="resume-section">
                <h2>Certifications</h2>
                ${certItems}
            </div>
        `)
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                :root {
                    --color-ink: rgb(51 51 51);
                    --color-ink-secondary: rgb(102 102 102);
                }
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.5; 
                    color: var(--color-ink);
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                }
                h1 { margin: 0 0 4px; font-size: 24px; }
                h2 { 
                    font-size: 14px; 

                    border-bottom: 1px solid var(--color-ink); 
                    padding-bottom: 4px;
                    margin: 20px 0 10px;
                }
                .headline { margin: 0 0 8px; color: var(--color-ink-secondary); font-size: 14px; }
                .contact-info { font-size: 12px; color: var(--color-ink-secondary); }
                .contact-info span { margin-right: 16px; }
                .resume-section { margin-bottom: 16px; }
                .experience-item, .education-item { margin-bottom: 12px; }
                .exp-header { display: flex; justify-content: space-between; }
                .exp-company { color: var(--color-ink-secondary); font-size: 14px; }
                .dates { color: var(--color-ink-secondary); font-size: 12px; }
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

function generatePlainText(draft: ResumeDraft): string {
    const lines: string[] = []

    lines.push(draft.contact.fullName || 'Your Name')
    if (draft.contact.headline) lines.push(draft.contact.headline)
    const contactParts = [draft.contact.email, draft.contact.phone, draft.contact.location].filter(Boolean)
    if (contactParts.length) lines.push(contactParts.join(' | '))
    lines.push('')

    if (draft.summary.summary) {
        lines.push('PROFESSIONAL SUMMARY')
        lines.push('-'.repeat(40))
        lines.push(draft.summary.summary)
        lines.push('')
    }

    if (draft.experience.length > 0) {
        lines.push('EXPERIENCE')
        lines.push('-'.repeat(40))
        draft.experience.forEach(exp => {
            lines.push(`${exp.title} at ${exp.company}`)
            lines.push(`${exp.startDate} - ${exp.endDate || 'Present'}`)
            if (exp.bullets) {
                exp.bullets.split('\n').filter(b => b.trim()).forEach(b => {
                    lines.push(`• ${b.replace(/^[-•]\s*/, '')}`)
                })
            }
            lines.push('')
        })
    }

    if (draft.skillGroups.length > 0) {
        lines.push('SKILLS')
        lines.push('-'.repeat(40))
        draft.skillGroups.forEach(g => {
            lines.push(`${g.label}: ${g.skills.join(', ')}`)
        })
        lines.push('')
    }

    if (draft.education.length > 0) {
        lines.push('EDUCATION')
        lines.push('-'.repeat(40))
        draft.education.forEach(edu => {
            lines.push(`${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''} - ${edu.institution}`)
        })
        lines.push('')
    }

    return lines.join('\n')
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ResumeExport: React.FC<Props> = ({ draft }) => {
    const [exporting, setExporting] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const handleExport = async (format: ExportFormat) => {
        setExporting(true)
        setShowOptions(false)

        try {
            switch (format) {
                case 'pdf': {
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
                    break
                }
                case 'txt': {
                    const text = generatePlainText(draft)
                    const blob = new Blob([text], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${draft.contact.fullName || 'resume'}.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                    break
                }
                case 'docx': {
                    // For DOCX, we'll use the same approach as PDF (print dialog)
                    // A full implementation would require a library like docx.js
                    alert('DOCX export coming soon! Use PDF for now.')
                    break
                }
            }
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="resume-export">
            <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowOptions(!showOptions)}
                disabled={exporting}
            >
                {exporting ? (
                    <span className="ai-improve-spinner" />
                ) : (
                    <>
                        <Icon name="scroll" size="sm" />
                        Export
                    </>
                )}
            </Button>

            {showOptions && (
                <div className="export-dropdown">
                    <button
                        type="button"
                        onClick={() => handleExport('pdf')}
                        className="export-option"
                    >
                        <span className="export-icon">📄</span>
                        <div>
                            <strong className="text-sm">PDF</strong>
                            <span className="text-xs muted">Best for submitting applications</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExport('txt')}
                        className="export-option"
                    >
                        <span className="export-icon">📝</span>
                        <div>
                            <strong className="text-sm">Plain Text</strong>
                            <span className="text-xs muted">ATS-friendly, no formatting</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExport('docx')}
                        className="export-option"
                        disabled
                    >
                        <span className="export-icon">📃</span>
                        <div>
                            <strong className="text-sm">Word Document</strong>
                            <span className="text-xs muted">Coming soon</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    )
}

export default ResumeExport
