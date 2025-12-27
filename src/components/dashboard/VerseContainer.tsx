import React from 'react'
import '../../../src/styles/verse-container.css'

interface VerseContainerProps {
  children: React.ReactNode
  /** Optional additional classes */
  className?: string
}

/**
 * VerseContainer — A poetic framing for hero moments
 *
 * Used in the dashboard hero section to provide:
 * - Emotional resonance with the user's job search journey
 * - Poetic language that acknowledges the human struggle
 * - Moment of pause and reflection at the top of the page
 *
 * Example:
 * ```jsx
 * <VerseContainer>
 *   You've sent your signal.
 *   Now comes the listening—
 *   rest is part of the rhythm.
 * </VerseContainer>
 * ```
 */
export function VerseContainer({ children, className }: VerseContainerProps) {
  return (
    <div className={`verse-container ${className || ''}`}>
      {children}
    </div>
  )
}
