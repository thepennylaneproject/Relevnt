// src/components/ResumeBuilder/SectionCard.tsx
// Manuscript Chapter Header pattern — typographic, calm, no card container

import * as React from 'react'

type Props = {
  children: React.ReactNode
  title?: string
  description?: string
  icon?: React.ReactNode // kept for API compat, but not rendered
  colors?: unknown // kept for API compat
  className?: string
}

export const SectionCard: React.FC<Props> = ({
  title,
  description,
  className = '',
  children,
}) => {
  return (
    <section className={`chapter-section ${className}`.trim()}>
      {/* Chapter Header */}
      {(title || description) && (
        <header className="chapter-header">
          {title && (
            <h2 className="chapter-header__title">{title}</h2>
          )}
          {description && (
            <p className="chapter-header__description">{description}</p>
          )}
          <div className="chapter-header__rule" aria-hidden="true" />
        </header>
      )}

      {/* Form Content */}
      <div className="chapter-content">
        {children}
      </div>
    </section>
  )
}

export default SectionCard