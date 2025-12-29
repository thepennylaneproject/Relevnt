import React from 'react'
import '../../../src/styles/verse-container.css'

interface VerseContainerProps {
  children: React.ReactNode
  /** Optional additional classes */
  className?: string
  /** Compact mode for single-line verses */
  compact?: boolean
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
 *
 * // Compact mode for shorter verses
 * <VerseContainer compact>
 *   Every journey begins with a single brave step.
 * </VerseContainer>
 * ```
 */
export function VerseContainer({ children, className, compact }: VerseContainerProps) {
  const classes = [
    'verse-container',
    compact && 'verse-container--compact',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}
