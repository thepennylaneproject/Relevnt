// src/components/Documents/DocumentRail.tsx
// Persistent left rail for document switching — the ONLY navigation surface for documents

import React from 'react'
import { Link } from 'react-router-dom'
import { Text } from '../ui/Typography'

export type DocumentType = 'resume' | 'letter'

export interface DocumentItem {
  id: string
  title: string
  type: DocumentType
  updatedAt?: string
}

interface DocumentRailProps {
  resumes: DocumentItem[]
  letters: DocumentItem[]
  activeDocumentId: string | null
  onSelectDocument: (id: string, type: DocumentType) => void
  onCreateResume: () => void
  loading?: boolean
}

export const DocumentRail: React.FC<DocumentRailProps> = ({
  resumes,
  letters,
  activeDocumentId,
  onSelectDocument,
  onCreateResume,
  loading,
}) => {
  return (
    <nav className="document-rail">
      {/* Resumes Section */}
      <div className="document-rail__section">
        <Text className="document-rail__label">Resumes</Text>
        
        {loading ? (
          <Text muted className="document-rail__loading">Loading…</Text>
        ) : resumes.length === 0 ? (
          <button
            className="document-rail__create"
            onClick={onCreateResume}
          >
            + New resume
          </button>
        ) : (
          <ul className="document-rail__list">
            {resumes.map((doc) => (
              <li key={doc.id}>
                <button
                  className={`document-rail__item ${activeDocumentId === doc.id ? 'document-rail__item--active' : ''}`}
                  onClick={() => onSelectDocument(doc.id, 'resume')}
                >
                  {doc.title || 'Untitled'}
                </button>
              </li>
            ))}
            <li>
              <button
                className="document-rail__create"
                onClick={onCreateResume}
              >
                + New
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Divider */}
      <div className="document-rail__divider" />

      {/* Letters Section */}
      <div className="document-rail__section">
        <Text className="document-rail__label">Letters</Text>
        
        {letters.length === 0 ? (
          <Text muted className="document-rail__empty">
            Generated from applications
          </Text>
        ) : (
          <ul className="document-rail__list">
            {letters.map((doc) => (
              <li key={doc.id}>
                <button
                  className={`document-rail__item ${activeDocumentId === doc.id ? 'document-rail__item--active' : ''}`}
                  onClick={() => onSelectDocument(doc.id, 'letter')}
                >
                  {doc.title || 'Untitled Letter'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Insights Access — quiet link at bottom */}
      {activeDocumentId && (
        <>
          <div className="document-rail__divider" />
          <div className="document-rail__section">
            <Link
              to={`/insights?doc=${activeDocumentId}`}
              className="document-rail__insights-link"
            >
              Run Insights →
            </Link>
          </div>
        </>
      )}
    </nav>
  )
}
