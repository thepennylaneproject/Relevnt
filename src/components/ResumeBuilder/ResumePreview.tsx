import React from 'react'
import { ResumeDraft } from '../../types/resume-builder.types'

interface Props {
  draft: ResumeDraft
}

export const ResumePreview: React.FC<Props> = ({ draft }) => {
  const hasAnyContent = Boolean(
    draft.contact.fullName ||
    draft.summary.summary ||
    draft.experience.length ||
    draft.education.length ||
    draft.skillGroups.length ||
    draft.projects.length ||
    draft.certifications.length
  )

  if (!hasAnyContent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, margin: 0 }}>Your resume layout will appear here as you fill in each section.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>
      {/* Contact */}
      {draft.contact.fullName && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>{draft.contact.fullName}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {draft.contact.email && <span>{draft.contact.email}</span>}
            {draft.contact.phone && <span>{draft.contact.phone}</span>}
            {draft.contact.location && <span>{draft.contact.location}</span>}
          </div>
        </div>
      )}

      {/* Summary */}
      {draft.summary.summary && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Summary</h3>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>{draft.summary.summary}</p>
        </div>
      )}

      {/* Experience */}
      {draft.experience.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Experience</h3>
          {draft.experience.map((exp: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong style={{ fontSize: 13 }}>{exp.title || 'Position'}</strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {exp.startDate} - {exp.endDate || 'Present'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{exp.company}</div>
              {exp.description && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {draft.education.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Education</h3>
          {draft.education.map((edu: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <strong style={{ fontSize: 13 }}>{edu.degree || 'Degree'}</strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {edu.graduationDate}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{edu.school}</div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {draft.skillGroups.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Skills</h3>
          {draft.skillGroups.map((group: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              {group.category && <strong style={{ fontSize: 12 }}>{group.category}: </strong>}
              <span style={{ fontSize: 12 }}>{group.skills?.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {draft.certifications.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Certifications</h3>
          {draft.certifications.map((cert: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 8, fontSize: 12 }}>
              <strong>{cert.name}</strong> - {cert.issuer} ({cert.date})
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {draft.projects.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>Projects</h3>
          {draft.projects.map((proj: any, idx: number) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 13 }}>{proj.name || 'Project'}</strong>
              {proj.description && <p style={{ margin: '4px 0 0', fontSize: 12, lineHeight: 1.5 }}>{proj.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
