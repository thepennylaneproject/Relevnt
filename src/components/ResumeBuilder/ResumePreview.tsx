import React from 'react'
import { ResumeDraft } from '../../types/resume-builder.types'

interface Props {
    draft: ResumeDraft
}

export const ResumePreview: React.FC<Props> = ({ draft }) => {
    const { contact, summary, experience, education, certifications, projects, skillGroups } = draft

    // A4 dimensions in pixels (approximate for screen)
    // Standard A4 is 210mm x 297mm. At 96 DPI, that's ~794px x 1123px.
    // We'll use a responsive container but keep the aspect ratio in mind.

    return (
        <div
            style={{
                background: 'white',
                color: '#1e293b', // Slate 800
                width: '100%',
                minHeight: '1123px', // A4 height
                padding: '40px 50px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '10.5pt',
                lineHeight: 1.5,
            }}
        >
            {/* Header */}
            <header style={{ borderBottom: '2px solid #334155', paddingBottom: 20, marginBottom: 20 }}>
                <h1 style={{ fontSize: '24pt', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                    {contact.fullName}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '10pt', color: '#475569' }}>
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>• {contact.phone}</span>}
                    {contact.location && <span>• {contact.location}</span>}
                    {contact.links && contact.links.map((link, i) => (
                        <span key={i}>• <a href={link.url} style={{ color: 'inherit', textDecoration: 'none' }}>{link.label}</a></span>
                    ))}
                </div>
            </header>

            {/* Summary */}
            {summary.summary && (
                <section style={{ marginBottom: 16 }}>
                    <h2 style={sectionHeaderStyle}>{summary.headline || 'Professional Summary'}</h2>
                    <p style={{ margin: 0 }}>{summary.summary}</p>
                </section>
            )}

            {/* Experience */}
            {experience.length > 0 && (
                <section style={{ marginBottom: 16 }}>
                    <h2 style={sectionHeaderStyle}>Experience</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {experience.map((job) => (
                            <div key={job.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <h3 style={{ fontSize: '11pt', fontWeight: 700, margin: 0 }}>{job.title}</h3>
                                    <span style={{ fontSize: '10pt', color: '#64748b' }}>
                                        {job.startDate} – {job.current ? 'Present' : job.endDate}
                                    </span>
                                </div>
                                <div style={{ fontSize: '10pt', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                    {job.company} {job.location && `| ${job.location}`}
                                </div>
                                {job.bullets && (
                                    <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                                        {job.bullets.split('\n').filter(Boolean).map((bullet, i) => (
                                            <li key={i} style={{ marginBottom: 2 }}>{bullet.replace(/^[•-]\s*/, '')}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Projects */}
            {projects.length > 0 && (
                <section style={{ marginBottom: 16 }}>
                    <h2 style={sectionHeaderStyle}>Projects</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {projects.map((project) => (
                            <div key={project.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <h3 style={{ fontSize: '11pt', fontWeight: 700, margin: 0 }}>
                                        {project.name} {project.link && <a href={project.link} style={{ fontSize: '9pt', fontWeight: 400, color: '#2563eb' }}>[Link]</a>}
                                    </h3>
                                </div>
                                {project.role && (
                                    <div style={{ fontSize: '10pt', fontWeight: 600, color: '#334155', marginBottom: 2 }}>
                                        {project.role}
                                    </div>
                                )}
                                <p style={{ margin: 0 }}>{project.description}</p>
                                {project.techStack && project.techStack.length > 0 && (
                                    <div style={{ fontSize: '9pt', color: '#475569', marginTop: 2 }}>
                                        <strong>Tech:</strong> {project.techStack.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {skillGroups.length > 0 && (
                <section style={{ marginBottom: 16 }}>
                    <h2 style={sectionHeaderStyle}>Skills</h2>
                    {skillGroups.map((group, index) => (
                        <div key={index} style={{ display: 'flex', marginBottom: 4 }}>
                            <strong style={{ width: 120, flexShrink: 0 }}>{group.label}:</strong>
                            <span>{group.skills.join(', ')}</span>
                        </div>
                    ))}
                </section>
            )}

            {/* Education */}
            {education.length > 0 && (
                <section style={{ marginBottom: 16 }}>
                    <h2 style={sectionHeaderStyle}>Education</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {education.map((edu) => (
                            <div key={edu.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <h3 style={{ fontSize: '11pt', fontWeight: 700, margin: 0 }}>{edu.institution}</h3>
                                    <span style={{ fontSize: '10pt', color: '#64748b' }}>
                                        {edu.startDate} – {edu.endDate}
                                    </span>
                                </div>
                                <div>
                                    {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
                <section style={{ marginBottom: 16 }}>
                    <h2 style={sectionHeaderStyle}>Certifications</h2>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {certifications.map((cert) => (
                            <li key={cert.id} style={{ marginBottom: 2 }}>
                                <strong>{cert.name}</strong> – {cert.issuer} ({cert.year})
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}

const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '12pt',
    fontWeight: 700,
    textTransform: 'uppercase',
    borderBottom: '1px solid #cbd5e1',
    paddingBottom: 4,
    marginBottom: 8,
    color: '#0f172a',
    letterSpacing: '0.05em',
}
