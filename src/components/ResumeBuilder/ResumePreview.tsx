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
      <div className="resume-preview__empty">
        <p className="resume-preview__empty-text">Your resume layout will appear here as you fill in each section.</p>
      </div>
    )
  }

  return (
    <div className="resume-preview">
      {/* Contact */}
      {draft.contact.fullName && (
        <div className="resume-preview__header">
          <h2 className="resume-preview__name">{draft.contact.fullName}</h2>
          <div className="resume-preview__contact-row">
            {draft.contact.email && <span>{draft.contact.email}</span>}
            {draft.contact.phone && <span>{draft.contact.phone}</span>}
            {draft.contact.location && <span>{draft.contact.location}</span>}
          </div>
        </div>
      )}

      {/* Summary */}
      {draft.summary.summary && (
        <div className="resume-preview__section">
          <h3 className="resume-preview__section-title">Summary</h3>
          <p className="resume-preview__summary-text">{draft.summary.summary}</p>
        </div>
      )}

      {/* Experience */}
      {draft.experience.length > 0 && (
        <div className="resume-preview__section">
          <h3 className="resume-preview__section-title">Experience</h3>
          {draft.experience.map((exp: any, idx: number) => (
            <div key={idx} className="resume-preview__item">
              <div className="resume-preview__item-header">
                <strong className="resume-preview__item-title">{exp.title || 'Position'}</strong>
                <span className="resume-preview__item-date">
                  {exp.startDate} - {exp.endDate || 'Present'}
                </span>
              </div>
              <div className="resume-preview__item-subtitle">{exp.company}</div>
              {exp.bullets && <p className="resume-preview__item-description">{exp.bullets}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {draft.education.length > 0 && (
        <div className="resume-preview__section">
          <h3 className="resume-preview__section-title">Education</h3>
          {draft.education.map((edu: any, idx: number) => (
            <div key={idx} className="resume-preview__item">
              <div className="resume-preview__item-header">
                <strong className="resume-preview__item-title">{edu.degree || 'Degree'}</strong>
                <span className="resume-preview__item-date">
                  {edu.endDate || edu.graduationDate}
                </span>
              </div>
              <div className="resume-preview__item-subtitle">{edu.institution || edu.school}</div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {draft.skillGroups.length > 0 && (
        <div className="resume-preview__section">
          <h3 className="resume-preview__section-title">Skills</h3>
          {draft.skillGroups.map((group: any, idx: number) => (
            <div key={idx} className="resume-preview__skill-group">
              {group.label && <strong className="resume-preview__skill-category">{group.label}: </strong>}
              <span className="resume-preview__skill-list">{group.skills?.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {draft.certifications.length > 0 && (
        <div className="resume-preview__section">
          <h3 className="resume-preview__section-title">Certifications</h3>
          {draft.certifications.map((cert: any, idx: number) => (
            <div key={idx} className="resume-preview__cert-item">
              <span className="resume-preview__cert-name">{cert.name}</span>
              {cert.issuer && <> - {cert.issuer}</>}
              {cert.year && <> ({cert.year})</>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {draft.projects.length > 0 && (
        <div className="resume-preview__section">
          <h3 className="resume-preview__section-title">Projects</h3>
          {draft.projects.map((proj: any, idx: number) => (
            <div key={idx} className="resume-preview__item">
              <strong className="resume-preview__item-title">{proj.name || 'Project'}</strong>
              {proj.description && <p className="resume-preview__item-description">{proj.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
