import React, { useState } from 'react'
import { AutosaveIndicator } from '../components/ResumeBuilder/AutosaveIndicator'
import { ResumeBuilderStatus } from '../hooks/useResumeBuilder'

interface Props {
  editor: React.ReactNode
  preview: React.ReactNode
  status: ResumeBuilderStatus
  isDirty: boolean
  lastSavedAt: string | null
  headerActions?: React.ReactNode
}

interface TabSection {
  id: string
  label: string
  icon: string
}

const SECTIONS: TabSection[] = [
  { id: 'contact', label: 'Contact', icon: '👋' },
  { id: 'summary', label: 'Summary', icon: '📝' },
  { id: 'skills', label: 'Skills', icon: '🧠' },
  { id: 'experience', label: 'Experience', icon: '💼' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'certifications', label: 'Certifications', icon: '📜' },
  { id: 'projects', label: 'Projects', icon: '🚀' },
]

export const ResumeBuilderLayout: React.FC<Props> = ({
  editor,
  preview,
  status,
  isDirty,
  lastSavedAt,
  headerActions,
}) => {
  const [activeTab, setActiveTab] = useState('contact')

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div
      style={{
        padding: '24px 24px 40px',
        maxWidth: 1600,
        margin: '0 auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Resume builder
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            This draft is your source of truth. Edit sections directly and Relevnt will autosave.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {headerActions}
          <AutosaveIndicator
            status={status}
            isDirty={isDirty}
            lastSavedAt={lastSavedAt}
          />
        </div>
      </header>

      {/* Horizontal Tabs */}
      <nav
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === section.id ? '#4f46e5' : '#64748b',
              fontSize: 14,
              fontWeight: activeTab === section.id ? 600 : 500,
              cursor: 'pointer',
              borderBottom: activeTab === section.id ? '2px solid #4f46e5' : '2px solid transparent',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ marginRight: 6 }}>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </nav>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {editor}
        </main>
        {/* Preview Pane - Sticky */}
        <div style={{ position: 'sticky', top: 24 }}>
          {preview}
        </div>
      </div>
    </div>
  )
}