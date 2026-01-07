// src/components/Documents/PreviewPane.tsx
// Slide-out preview pane — hidden by default, toggled via action

import React from 'react'
import { Icon } from '../ui/Icon'
import { ResumePreview } from '../ResumeBuilder/ResumePreview'
import type { ResumeDraft } from '../../types/resume-builder.types'

interface PreviewPaneProps {
  isOpen: boolean
  onClose: () => void
  draft: ResumeDraft | null
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  isOpen,
  onClose,
  draft,
}) => {
  if (!isOpen || !draft) return null

  return (
    <div className="preview-pane">
      <div className="preview-pane__backdrop" onClick={onClose} />
      <aside className="preview-pane__content">
        <header className="preview-pane__header">
          <span className="preview-pane__title">Draft Preview</span>
          <button
            className="preview-pane__close"
            onClick={onClose}
            aria-label="Close preview"
          >
            <Icon name="x" size="sm" />
          </button>
        </header>
        <div className="preview-pane__body">
          <ResumePreview draft={draft} />
        </div>
      </aside>
    </div>
  )
}
