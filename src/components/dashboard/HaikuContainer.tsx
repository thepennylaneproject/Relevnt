import React from 'react'
import '../../../src/styles/haiku-container.css'

interface HaikuContainerProps {
  children: React.ReactNode
  /** Optional additional classes */
  className?: string
}

/**
 * HaikuContainer — Punny observations about job search and capitalism
 *
 * Used strategically throughout the dashboard for:
 * - Honest, wry commentary on the job search experience
 * - Moments of levity and human connection
 * - Acknowledging the systemic challenges users face
 * - Breaking up dense information with poetic insight
 *
 * Example:
 * ```jsx
 * <HaikuContainer>
 *   Algorithm sorts
 *   your worth in seconds flat—
 *   you are still human
 * </HaikuContainer>
 * ```
 *
 * Note: Haikus are rendered in italics with secondary text color,
 * so they complement but don't compete with user data.
 */
export function HaikuContainer({ children, className }: HaikuContainerProps) {
  return (
    <div className={`haiku-container ${className || ''}`}>
      {children}
    </div>
  )
}
